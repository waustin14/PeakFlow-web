import { useState, useEffect } from 'react'
import { Plus, Trash2, GitBranch } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Reach } from '@/types/project'

const MANNINGS_OPTIONS = [
  { n: 0.020, label: 'Concrete, straight' },
  { n: 0.025, label: 'Concrete, winding' },
  { n: 0.030, label: 'Clean, straight gravel' },
  { n: 0.035, label: 'Clean, winding gravel' },
  { n: 0.040, label: 'Some weeds, gravel' },
  { n: 0.045, label: 'Dense weeds / gravel' },
  { n: 0.050, label: 'Clean natural channel' },
  { n: 0.060, label: 'Some weeds, natural' },
  { n: 0.075, label: 'Dense weeds, natural' },
]

export function ReachDataTable() {
  const reaches = useProjectStore((s) => s.reaches)
  const structures = useProjectStore((s) => s.structures)
  const addReach = useProjectStore((s) => s.addReach)
  const updateReach = useProjectStore((s) => s.updateReach)
  const removeReach = useProjectStore((s) => s.removeReach)

  const handleAdd = () => {
    addReach({
      name: `R${reaches.length + 1}`,
      receivingReachId: 'outlet',
      lengthFt: 0,
      manningsN: 0.040,
      frictionSlopeFtFt: 0,
      bottomWidthFt: 0,
      avgSideSlopes: 2,
    })
  }

  if (reaches.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState onAdd={handleAdd} />
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {/* Rows */}
      {reaches.map((reach) => (
        <ReachRow
          key={reach.id}
          reach={reach}
          allReaches={reaches}
          structureNames={structures.map((s) => ({ id: s.id, name: s.name }))}
          onUpdate={(updates) => updateReach(reach.id, updates)}
          onRemove={() => removeReach(reach.id)}
        />
      ))}

      <Button
        size="sm"
        variant="outline"
        onClick={handleAdd}
        className="border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-blue-500"
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add Reach
      </Button>
    </div>
  )
}

function NumericInput({
  value,
  step,
  placeholder,
  className,
  onChange,
}: {
  value: number
  step: number
  placeholder?: string
  className?: string
  onChange: (v: number) => void
}) {
  const [raw, setRaw] = useState(() => value === 0 ? '' : String(value))

  useEffect(() => {
    const parsed = parseFloat(raw)
    if (isNaN(parsed) || parsed !== value) setRaw(value === 0 ? '' : String(value))
  }, [value])

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={raw}
      placeholder={placeholder ?? '0'}
      onChange={(e) => {
        setRaw(e.target.value)
        const v = parseFloat(e.target.value)
        if (!isNaN(v)) onChange(v)
        else if (e.target.value === '' || e.target.value === '-') onChange(0)
      }}
      onBlur={() => {
        const v = parseFloat(raw)
        if (!isNaN(v)) {
          setRaw(String(v))
        } else {
          setRaw(value === 0 ? '' : String(value))
        }
      }}
      className={className}
    />
  )
}

function ReachRow({
  reach,
  allReaches,
  structureNames,
  onUpdate,
  onRemove,
}: {
  reach: Reach
  allReaches: Reach[]
  structureNames: { id: string; name: string }[]
  onUpdate: (updates: Partial<Omit<Reach, 'id'>>) => void
  onRemove: () => void
}) {
  // Receiving reach options: all other reaches + outlet
  const receivingOptions = [
    { id: 'outlet', name: 'Outlet' },
    ...allReaches.filter((r) => r.id !== reach.id).map((r) => ({ id: r.id, name: r.name })),
  ]

  const numInput = (
    value: number,
    onChange: (v: number) => void,
    step = 1,
    placeholder = ''
  ) => (
    <NumericInput
      value={value}
      step={step}
      placeholder={placeholder || '0'}
      className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-xs h-8 tabular-nums w-full"
      onChange={onChange}
    />
  )

  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Input
            value={reach.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Name"
            className="flex-1 bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-sm h-8 font-medium"
          />
          <button onClick={onRemove} className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 shrink-0">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MobileField label="Receiving Reach">
            <ReceivingSelect value={reach.receivingReachId} options={receivingOptions} onChange={(v) => onUpdate({ receivingReachId: v })} />
          </MobileField>
          <MobileField label="Manning's n">
            <ManningsSelect value={reach.manningsN} onChange={(v) => onUpdate({ manningsN: v })} />
          </MobileField>
          <MobileField label="Length (ft)">{numInput(reach.lengthFt, (v) => onUpdate({ lengthFt: v }), 10)}</MobileField>
          <MobileField label="Slope (ft/ft)">{numInput(reach.frictionSlopeFtFt, (v) => onUpdate({ frictionSlopeFtFt: v }), 0.0001, '0.0100')}</MobileField>
          <MobileField label="Bot. Width (ft)">{numInput(reach.bottomWidthFt, (v) => onUpdate({ bottomWidthFt: v }), 1)}</MobileField>
          <MobileField label="Side Slopes (H:1)">
            <div className="flex items-center gap-1">
              {numInput(reach.avgSideSlopes, (v) => onUpdate({ avgSideSlopes: v }), 0.5)}
              <span className="text-xs text-zinc-500 shrink-0">:1</span>
            </div>
          </MobileField>
          <MobileField label="Structure (optional)" className="col-span-2">
            <StructureSelect value={reach.structureId} options={structureNames} onChange={(v) => onUpdate({ structureId: v || undefined })} />
          </MobileField>
        </div>
      </div>

    </div>
  )
}

function ReceivingSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: { id: string; name: string }[]
  onChange: (v: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-xs h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id} className="text-zinc-700 dark:text-zinc-200 text-xs focus:bg-zinc-100 dark:focus:bg-zinc-700">
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ManningsSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(parseFloat(v))}>
      <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-xs h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
        {MANNINGS_OPTIONS.map((o) => (
          <SelectItem key={o.n} value={String(o.n)} className="text-zinc-700 dark:text-zinc-200 text-xs focus:bg-zinc-100 dark:focus:bg-zinc-700">
            {o.n.toFixed(3)} – {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const NO_STRUCTURE = '__none__'

function StructureSelect({
  value,
  options,
  onChange,
}: {
  value?: string
  options: { id: string; name: string }[]
  onChange: (v: string) => void
}) {
  return (
    <Select
      value={value ?? NO_STRUCTURE}
      onValueChange={(v) => onChange(v === NO_STRUCTURE ? '' : v)}
    >
      <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-xs h-8">
        <SelectValue placeholder="None" />
      </SelectTrigger>
      <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
        <SelectItem value={NO_STRUCTURE} className="text-zinc-500 dark:text-zinc-400 text-xs focus:bg-zinc-100 dark:focus:bg-zinc-700 italic">
          None
        </SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id} className="text-zinc-700 dark:text-zinc-200 text-xs focus:bg-zinc-100 dark:focus:bg-zinc-700">
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function MobileField({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 py-10 px-6 text-center">
      <GitBranch className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-3" />
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">No reaches defined</p>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4 max-w-[260px]">
        Add reaches to model channel routing between your watershed and the outlet.
        Skip this step if your watershed drains directly to the outlet.
      </p>
      <Button size="sm" onClick={onAdd} variant="outline"
        className="border-zinc-300 dark:border-zinc-600 hover:border-blue-500">
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add First Reach
      </Button>
    </div>
  )
}
