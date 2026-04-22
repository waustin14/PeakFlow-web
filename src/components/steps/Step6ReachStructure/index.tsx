import { useState } from 'react'
import { GitBranch, Waves, Network } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReachDataTable } from './ReachDataTable'
import { StructureDataPanel } from './StructureDataPanel'
import { ReachFlowPathPanel } from './ReachFlowPathPanel'
import { Button } from '@/components/ui/button'

type Tab = 'reaches' | 'structures'

export function Step6ReachStructure() {
  const [activeTab, setActiveTab] = useState<Tab>('reaches')
  const [flowPathOpen, setFlowPathOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Reaches &amp; Structures
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Optional. Define channel reaches and detention structures for multi-reach projects.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setFlowPathOpen(true)}
          className="shrink-0 border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-blue-500"
        >
          <Network className="h-3.5 w-3.5 mr-1.5" />
          Flow Path
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
        <TabButton
          active={activeTab === 'reaches'}
          onClick={() => setActiveTab('reaches')}
          icon={<GitBranch className="h-3.5 w-3.5" />}
          label="Reach Data"
        />
        <TabButton
          active={activeTab === 'structures'}
          onClick={() => setActiveTab('structures')}
          icon={<Waves className="h-3.5 w-3.5" />}
          label="Structure Data"
        />
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'reaches' && <ReachDataTable />}
        {activeTab === 'structures' && <StructureDataPanel />}
      </div>

      {/* Reach Flow Path panel */}
      {flowPathOpen && (
        <ReachFlowPathPanel onClose={() => setFlowPathOpen(false)} />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
        active
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600'
      )}
    >
      {icon}
      {label}
    </button>
  )
}
