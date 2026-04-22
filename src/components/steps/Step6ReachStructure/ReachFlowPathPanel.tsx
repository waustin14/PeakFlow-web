import { X, AlertTriangle } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import type { Reach, Structure } from '@/types/project'

interface ReachFlowPathPanelProps {
  onClose: () => void
}

interface TreeNode {
  type: 'outlet' | 'reach' | 'watershed'
  reachId?: string
  reachName?: string
  reachLengthFt?: number
  structure?: Structure
  children: TreeNode[]
}

function buildTree(reaches: Reach[], structures: Structure[]): { root: TreeNode; hasCycle: boolean } {
  // Build adjacency: which reaches flow into each receiver
  const byReceiver = new Map<string, Reach[]>()
  for (const r of reaches) {
    const key = r.receivingReachId
    if (!byReceiver.has(key)) byReceiver.set(key, [])
    byReceiver.get(key)!.push(r)
  }

  const visited = new Set<string>()
  let hasCycle = false

  function buildNode(receiverId: string, depth: number): TreeNode[] {
    if (depth > 50) { hasCycle = true; return [] }
    const children: Reach[] = byReceiver.get(receiverId) ?? []
    return children.map((reach): TreeNode => {
      if (visited.has(reach.id)) { hasCycle = true; return { type: 'reach', reachName: reach.name, children: [] } }
      visited.add(reach.id)
      const structure = reach.structureId ? structures.find((s) => s.id === reach.structureId) : undefined
      const reachNode: TreeNode = {
        type: 'reach',
        reachId: reach.id,
        reachName: reach.name,
        reachLengthFt: reach.lengthFt,
        structure,
        children: buildNode(reach.id, depth + 1),
      }
      visited.delete(reach.id)
      return reachNode
    })
  }

  // Find reaches that flow to 'outlet' — these are direct children of the outlet node
  const outletChildren = buildNode('outlet', 0)

  // If no reaches, show the watershed as a direct child of the outlet
  const root: TreeNode = {
    type: 'outlet',
    children: outletChildren.length > 0 ? outletChildren : [],
  }

  return { root, hasCycle }
}

export function ReachFlowPathPanel({ onClose }: ReachFlowPathPanelProps) {
  const reaches = useProjectStore((s) => s.reaches)
  const structures = useProjectStore((s) => s.structures)
  const watershed = useProjectStore((s) => s.watershed)
  const compositeCN = useProjectStore((s) => s.compositeCN)
  const tcHours = useProjectStore((s) => s.tcHours)
  const projectName = useProjectStore((s) => s.meta.name)

  const { root, hasCycle } = buildTree(reaches, structures)

  // Find the deepest leaf reaches (those with no children from other reaches) to attach watershed
  function attachWatershed(node: TreeNode): TreeNode {
    if (node.type === 'outlet' && node.children.length === 0) {
      return {
        ...node,
        children: [watershedLeaf(watershed?.areaAcres, compositeCN, tcHours)],
      }
    }
    return {
      ...node,
      children: node.children.map((child) => {
        if (child.children.length === 0 && child.type === 'reach') {
          return {
            ...child,
            children: [watershedLeaf(watershed?.areaAcres, compositeCN, tcHours)],
          }
        }
        return attachWatershed(child)
      }),
    }
  }

  const treeWithWatershed = attachWatershed(root)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Reach Flow Path</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Project ({projectName}) flow path
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tree */}
        <div className="px-5 py-4 overflow-y-auto max-h-[60vh] font-mono text-xs">
          {hasCycle && (
            <div className="flex items-center gap-2 mb-3 p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-xs">Routing cycle detected. Check Receiving Reach assignments.</span>
            </div>
          )}
          <TreeNodeView node={treeWithWatershed} isLast={true} prefix="" />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 px-5 py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <LegendItem color="text-blue-500" label="Reaches" />
          <LegendItem color="text-green-500" label="Watershed" />
          <LegendItem color="text-red-400" label="Structures" />
          <button
            onClick={onClose}
            className="ml-auto text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function TreeNodeView({
  node,
  isLast,
  prefix,
}: {
  node: TreeNode
  isLast: boolean
  prefix: string
}) {
  const connector = isLast ? '└── ' : '├── '
  const childPrefix = prefix + (isLast ? '    ' : '│   ')

  if (node.type === 'outlet') {
    return (
      <div>
        <div className="text-zinc-900 dark:text-zinc-100 font-semibold">Outlet</div>
        {node.children.map((child, i) => (
          <TreeNodeView
            key={child.reachId ?? `child-${i}`}
            node={child}
            isLast={i === node.children.length - 1}
            prefix=""
          />
        ))}
      </div>
    )
  }

  if (node.type === 'watershed') {
    return (
      <div>
        <span className="text-zinc-400 dark:text-zinc-500 select-none">{prefix}{connector}</span>
        <span className="text-green-600 dark:text-green-400">{node.reachName}</span>
      </div>
    )
  }

  // reach node
  return (
    <div>
      <div>
        <span className="text-zinc-400 dark:text-zinc-500 select-none">{prefix}{connector}</span>
        <span className="text-blue-600 dark:text-blue-400">{node.reachName}</span>
        {node.reachLengthFt !== undefined && node.reachLengthFt > 0 && (
          <span className="text-zinc-400 dark:text-zinc-500">{` {Length=${node.reachLengthFt} ft}`}</span>
        )}
      </div>
      {node.structure && (
        <div>
          <span className="text-zinc-400 dark:text-zinc-500 select-none">{childPrefix}├── </span>
          <span className="text-red-500 dark:text-red-400">{node.structure.name}</span>
          <span className="text-zinc-400 dark:text-zinc-500">
            {node.structure.spillwayType === 'pipe'
              ? ` {Pipe, ${[node.structure.trialDiameter1In, node.structure.trialDiameter2In, node.structure.trialDiameter3In].filter(Boolean).join('"/') || '—'}" dia.}`
              : ` {Weir, ${node.structure.weirLengthFt ?? '—'} ft}`
            }
          </span>
        </div>
      )}
      {node.children.map((child, i) => (
        <TreeNodeView
          key={child.reachId ?? `${node.reachId}-child-${i}`}
          node={child}
          isLast={i === node.children.length - 1}
          prefix={childPrefix}
        />
      ))}
    </div>
  )
}

function watershedLeaf(areaAcres?: number, cn?: number | null, tcHours?: number | null): TreeNode {
  const parts: string[] = []
  if (areaAcres) parts.push(`Area=${areaAcres.toFixed(2)} ac`)
  if (cn) parts.push(`CN=${Math.round(cn)}`)
  if (tcHours) parts.push(`Tc=${tcHours.toFixed(3)}`)
  const label = parts.length > 0 ? `Watershed {${parts.join(', ')}}` : 'Watershed'
  return { type: 'watershed', reachName: label, children: [] }
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[10px] font-bold ${color}`}>●</span>
      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{label}</span>
    </div>
  )
}
