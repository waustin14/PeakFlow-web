import { useEffect, useState } from 'react'
import { Plus, GripVertical, Trash2, Clock, AlertTriangle } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useProjectStore, type NewFlowSegment } from '@/store/useProjectStore'
import { computeSegmentTt, computeTotalTc } from '@/lib/tr55/timeOfConcentration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import type { FlowSegment, FlowSegmentType } from '@/types/project'
import { SHEET_FLOW_MANNINGS_N, CHANNEL_MANNINGS_N } from '@/data/constants'

const SEGMENT_TYPES: { value: FlowSegmentType; label: string }[] = [
  { value: 'sheet', label: 'Sheet Flow' },
  { value: 'shallow_concentrated', label: 'Shallow Concentrated' },
  { value: 'channel', label: 'Channel Flow (Manning)' },
]

export function Step5TimeOfConc() {
  const flowSegments = useProjectStore((s) => s.flowSegments)
  const addFlowSegment = useProjectStore((s) => s.addFlowSegment)
  const updateFlowSegment = useProjectStore((s) => s.updateFlowSegment)
  const removeFlowSegment = useProjectStore((s) => s.removeFlowSegment)
  const reorderFlowSegments = useProjectStore((s) => s.reorderFlowSegments)
  const resetFlowSegments = useProjectStore((s) => s.resetFlowSegments)
  const setTcHours = useProjectStore((s) => s.setTcHours)
  const tcHours = useProjectStore((s) => s.tcHours)
  const p2FromNoaa = useProjectStore((s) => s.rainfall?.depths[2] ?? null)

  // Compute Tc whenever segments change
  useEffect(() => {
    if (flowSegments.length === 0) {
      setTcHours(null)
      return
    }
    try {
      const tc = computeTotalTc(flowSegments)
      setTcHours(tc)
      // Update individual segment travel times
      flowSegments.forEach((seg) => {
        try {
          const tt = computeSegmentTt(seg)
          if (seg.travelTimeHours !== tt) {
            updateFlowSegment(seg.id, { travelTimeHours: tt })
          }
        } catch { /* skip invalid */ }
      })
    } catch {
      setTcHours(null)
    }
  }, [flowSegments.map((s) => JSON.stringify(s)).join(',')])

  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = flowSegments.findIndex((s) => s.id === active.id)
      const newIndex = flowSegments.findIndex((s) => s.id === over.id)
      const reordered = arrayMove(flowSegments, oldIndex, newIndex)
      reorderFlowSegments(reordered.map((s) => s.id))
    }
  }

  const handleAddSegment = (type: FlowSegmentType) => {
    const label = `${SEGMENT_TYPES.find(t => t.value === type)?.label} ${flowSegments.length + 1}`
    const lengthFt = 100
    const slopeFtFt = 0.02
    if (type === 'sheet') {
      addFlowSegment({ type: 'sheet', label, lengthFt, slopeFtFt, manningsN: 0.15, p2InchRainfall: p2FromNoaa ?? 3.0 })
    } else if (type === 'shallow_concentrated') {
      addFlowSegment({ type: 'shallow_concentrated', label, lengthFt, slopeFtFt, surfaceType: 'unpaved' })
    } else {
      addFlowSegment({ type: 'channel', label, lengthFt, slopeFtFt, manningsN: 0.030, hydraulicRadiusFt: 1.0 })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Time of Concentration</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Define flow path segments. Drag to reorder. Tc = Σ travel times.
        </p>
      </div>

      {/* Tc summary */}
      {tcHours !== null && (
        <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
          <CardContent className="py-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400 shrink-0" />
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-300 uppercase tracking-wider mb-0.5">Total Tc</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                {tcHours.toFixed(3)} hr
                <span className="text-sm text-zinc-500 dark:text-zinc-400 ml-2 font-normal">
                  ({(tcHours * 60).toFixed(1)} min)
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TR-55 validity warning: method undefined for Tc > 10 hr */}
      {tcHours !== null && tcHours > 10 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            <span className="font-semibold">Tc exceeds 10 hours ({tcHours.toFixed(2)} hr).</span>{' '}
            TR-55 is only valid for Tc ≤ 10 hr. Check flow path lengths and slopes — results will be unreliable.
          </span>
        </div>
      )}

      {/* Add segment buttons */}
      <div className="flex gap-2 flex-wrap items-center">
        {SEGMENT_TYPES.map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant="outline"
            onClick={() => handleAddSegment(t.value)}
            className="border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-blue-500"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t.label}
          </Button>
        ))}
        {flowSegments.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={resetFlowSegments}
            className="ml-auto text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Sortable segment list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={flowSegments.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {flowSegments.map((seg, idx) => (
              <SortableSegmentCard
                key={seg.id}
                seg={seg}
                index={idx}
                p2FromNoaa={p2FromNoaa}
                onUpdate={(updates) => updateFlowSegment(seg.id, updates)}
                onRemove={() => removeFlowSegment(seg.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {flowSegments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 py-8 px-6 text-center">
          <Plus className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-3" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">No flow segments</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-[280px]">
            Add sheet flow, shallow concentrated, or channel segments above to compute Tc.
          </p>
        </div>
      )}
    </div>
  )
}

function NumericInput({
  value,
  step,
  unit,
  className,
  onChange,
}: {
  value: number
  step: number
  unit?: string
  className?: string
  onChange: (v: number) => void
}) {
  const [raw, setRaw] = useState(() => String(value))

  useEffect(() => {
    const parsed = parseFloat(raw)
    if (isNaN(parsed) || parsed !== value) setRaw(String(value))
  }, [value])

  return (
    <div className="flex items-center gap-1">
      <Input
        type="text"
        inputMode="decimal"
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value)
          const v = parseFloat(e.target.value)
          if (!isNaN(v)) onChange(v)
        }}
        onBlur={() => {
          const v = parseFloat(raw)
          if (!isNaN(v)) {
            setRaw(String(v))
          } else {
            setRaw(String(value))
          }
        }}
        className={className}
      />
      {unit && <span className="text-xs text-zinc-500 whitespace-nowrap">{unit}</span>}
    </div>
  )
}

function SortableSegmentCard({
  seg,
  index,
  p2FromNoaa,
  onUpdate,
  onRemove,
}: {
  seg: FlowSegment
  index: number
  p2FromNoaa: number | null
  onUpdate: (updates: Partial<FlowSegment>) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: seg.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  let ttDisplay = '—'
  try {
    const tt = computeSegmentTt(seg)
    ttDisplay = `${tt.toFixed(3)} hr`
  } catch { /* invalid inputs */ }

  return (
    <div ref={setNodeRef} style={style} className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
        <button {...attributes} {...listeners} className="cursor-grab text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300">
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs text-zinc-500 w-5">{index + 1}</span>
        <Input
          value={seg.label}
          onChange={(e) => onUpdate({ label: e.target.value } as Partial<FlowSegment>)}
          className="flex-1 bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-sm h-7"
        />
        <span className="text-xs text-blue-400 tabular-nums whitespace-nowrap">{ttDisplay}</span>
        <button onClick={onRemove} className="text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3">
        <SegmentFields seg={seg} p2FromNoaa={p2FromNoaa} onUpdate={onUpdate} />
      </div>
    </div>
  )
}

function SegmentFields({ seg, p2FromNoaa, onUpdate }: { seg: FlowSegment; p2FromNoaa: number | null; onUpdate: (u: Partial<FlowSegment>) => void }) {
  const numField = (label: string, key: string, value: number, step = 1, unit = '') => (
    <div className="space-y-0.5">
      <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{label}</Label>
      <NumericInput
        value={value}
        step={step}
        unit={unit}
        className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-xs h-8 tabular-nums"
        onChange={(v) => onUpdate({ [key]: v } as Partial<FlowSegment>)}
      />
    </div>
  )

  const commonFields = (
    <div className="grid grid-cols-2 gap-2">
      {numField('Length', 'lengthFt', seg.lengthFt, 10, 'ft')}
      {numField('Slope', 'slopeFtFt', seg.slopeFtFt, 0.001, 'ft/ft')}
    </div>
  )

  if (seg.type === 'sheet') {
    return (
      <div className="space-y-2">
        {commonFields}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs flex items-center gap-1">
              Manning's n
              <InfoTooltip content="Sheet flow Manning's n from TR-55 Table 3-1." />
            </Label>
            <Select value={String(seg.manningsN)} onValueChange={(v) => onUpdate({ manningsN: parseFloat(v) } as Partial<FlowSegment>)}>
              <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                {Object.entries(SHEET_FLOW_MANNINGS_N).map(([k, v]) => (
                  <SelectItem key={k} value={String(v.n)} className="text-zinc-700 dark:text-zinc-200 text-xs focus:bg-zinc-100 dark:focus:bg-zinc-700">
                    {v.n} – {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-0.5">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs flex items-center gap-1">
              2-yr 24-hr Rainfall
              <InfoTooltip content="2-year 24-hour rainfall depth (inches) from TR-55 Table 3-1 / NOAA Atlas 14, used in the sheet flow travel time equation: Tt = 0.007(nL)^0.8 / (P₂^0.5 · s^0.4)" />
            </Label>
            <div className="flex items-center gap-1">
              <NumericInput
                value={seg.p2InchRainfall}
                step={0.1}
                unit="in"
                className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-xs h-8 tabular-nums"
                onChange={(v) => onUpdate({ p2InchRainfall: v } as Partial<FlowSegment>)}
              />
              {p2FromNoaa !== null && (
                <button
                  type="button"
                  title={`Sync from NOAA Atlas 14 (${p2FromNoaa.toFixed(2)} in)`}
                  onClick={() => onUpdate({ p2InchRainfall: p2FromNoaa } as Partial<FlowSegment>)}
                  className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-sky-900/40 text-sky-400 border border-sky-700/50 hover:bg-sky-800/50 whitespace-nowrap leading-none"
                >
                  NOAA {p2FromNoaa.toFixed(2)}"
                </button>
              )}
            </div>
          </div>
        </div>
        {seg.lengthFt > 300 && (
          <div className="flex items-start gap-1.5 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-400">
            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
            <span>Sheet flow &gt; 300 ft is unreliable per TR-55. Consider splitting the remainder into a Shallow Concentrated segment.</span>
          </div>
        )}
      </div>
    )
  }

  if (seg.type === 'shallow_concentrated') {
    return (
      <div className="space-y-2">
        {commonFields}
        <div className="space-y-0.5">
          <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Surface Type</Label>
          <Select value={seg.surfaceType} onValueChange={(v) => onUpdate({ surfaceType: v } as Partial<FlowSegment>)}>
            <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
              <SelectItem value="unpaved" className="text-zinc-700 dark:text-zinc-200 text-xs focus:bg-zinc-100 dark:focus:bg-zinc-700">Unpaved (k = 16.13)</SelectItem>
              <SelectItem value="paved" className="text-zinc-700 dark:text-zinc-200 text-xs focus:bg-zinc-100 dark:focus:bg-zinc-700">Paved (k = 20.33)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  // channel
  return (
    <div className="space-y-2">
      {commonFields}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Manning's n</Label>
          <Select value={String(seg.manningsN)} onValueChange={(v) => onUpdate({ manningsN: parseFloat(v) } as Partial<FlowSegment>)}>
            <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
              {Object.entries(CHANNEL_MANNINGS_N).map(([k, v]) => (
                <SelectItem key={k} value={String(v.n)} className="text-zinc-700 dark:text-zinc-200 text-xs focus:bg-zinc-100 dark:focus:bg-zinc-700">
                  {v.n} – {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {numField('Hyd. Radius', 'hydraulicRadiusFt', seg.hydraulicRadiusFt, 0.1, 'ft')}
      </div>
    </div>
  )
}
