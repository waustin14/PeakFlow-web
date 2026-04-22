import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import type { Structure, SpillwayType } from '@/types/project'

export function StructureDataPanel() {
  const structures = useProjectStore((s) => s.structures)
  const addStructure = useProjectStore((s) => s.addStructure)
  const updateStructure = useProjectStore((s) => s.updateStructure)
  const removeStructure = useProjectStore((s) => s.removeStructure)

  const [selectedId, setSelectedId] = useState<string | null>(() => structures[0]?.id ?? null)

  const selected = structures.find((s) => s.id === selectedId) ?? null

  const handleAdd = () => {
    const name = `Structure ${structures.length + 1}`
    addStructure({
      name,
      spillwayType: 'pipe',
      trialDiameter1In: undefined,
      trialDiameter2In: undefined,
      trialDiameter3In: undefined,
    })
    // Select newly added structure (id assigned by store, grab from updated list after next render)
    setTimeout(() => {
      const updated = useProjectStore.getState().structures
      setSelectedId(updated[updated.length - 1]?.id ?? null)
    }, 0)
  }

  const handleRemove = (id: string) => {
    removeStructure(id)
    const remaining = structures.filter((s) => s.id !== id)
    setSelectedId(remaining[0]?.id ?? null)
  }

  if (structures.length === 0) {
    return <EmptyState onAdd={handleAdd} />
  }

  return (
    <div className="space-y-4">
      {/* Structure selector bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 shrink-0">
          Structure:
        </span>
        <div className="flex gap-1.5 flex-wrap flex-1">
          {structures.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedId === s.id
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/40'
                  : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={handleAdd}
          className="shrink-0 border-zinc-300 dark:border-zinc-600 hover:border-blue-500 text-xs h-7">
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      {/* Selected structure form */}
      {selected && (
        <StructureForm
          structure={selected}
          onUpdate={(updates) => updateStructure(selected.id, updates)}
          onRemove={() => handleRemove(selected.id)}
        />
      )}
    </div>
  )
}

function StructureForm({
  structure,
  onUpdate,
  onRemove,
}: {
  structure: Structure
  onUpdate: (updates: Partial<Omit<Structure, 'id'>>) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-700">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Input
          value={structure.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Structure name"
          className="flex-1 bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-sm font-semibold h-8"
        />
        <button
          onClick={onRemove}
          className="shrink-0 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          title="Delete structure"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Pond Surface Area */}
      <div className="px-4 py-4 space-y-3">
        <SectionHeading>
          Pond Surface Area
          <InfoTooltip content="Surface area of the pond used for detention storage calculations. Both rows are optional." />
        </SectionHeading>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <OptionalNumberField
            label="@ spillway crest"
            value={structure.pondSurfaceAreaAtCrestAcres}
            unit="acres"
            step={0.01}
            onChange={(v) => onUpdate({ pondSurfaceAreaAtCrestAcres: v })}
          />
        </div>
        <div className="grid grid-cols-[auto_1fr_auto_1fr] items-end gap-2">
          <OptionalNumberField
            label="Depth above crest"
            value={structure.additionalDepthFt}
            unit="ft"
            step={0.1}
            onChange={(v) => onUpdate({ additionalDepthFt: v })}
          />
          <OptionalNumberField
            label="Area at that depth"
            value={structure.additionalSurfaceAreaAcres}
            unit="acres"
            step={0.01}
            onChange={(v) => onUpdate({ additionalSurfaceAreaAcres: v })}
          />
        </div>
      </div>

      {/* Spillway Type */}
      <div className="px-4 py-4 space-y-4">
        <SectionHeading>Discharge Description</SectionHeading>

        {/* Radio toggle */}
        <div className="flex gap-6">
          <SpillwayRadio
            id="pipe"
            label="Pipe Spillway"
            checked={structure.spillwayType === 'pipe'}
            onChange={() => onUpdate({ spillwayType: 'pipe' })}
          />
          <SpillwayRadio
            id="weir"
            label="Weir Spillway"
            checked={structure.spillwayType === 'weir'}
            onChange={() => onUpdate({ spillwayType: 'weir' })}
          />
        </div>

        {structure.spillwayType === 'pipe' && (
          <PipeFields structure={structure} onUpdate={onUpdate} />
        )}

        {structure.spillwayType === 'weir' && (
          <WeirFields structure={structure} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  )
}

function PipeFields({
  structure,
  onUpdate,
}: {
  structure: Structure
  onUpdate: (updates: Partial<Omit<Structure, 'id'>>) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          Pipe Diameter Trials (in)
          <InfoTooltip content="Enter up to three trial pipe diameters to compare in your design. At least Trial #1 is required." />
        </Label>
        <div className="grid grid-cols-3 gap-3">
          {([1, 2, 3] as const).map((n) => {
            const key = `trialDiameter${n}In` as keyof Structure
            const val = structure[key] as number | undefined
            return (
              <div key={n} className="space-y-1">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Trial #{n}</span>
                <Input
                  type="number"
                  step={1}
                  min={1}
                  value={val ?? ''}
                  placeholder="—"
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    onUpdate({ [key]: isNaN(v) ? undefined : v } as Partial<Omit<Structure, 'id'>>)
                  }}
                  className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-sm tabular-nums h-9"
                />
              </div>
            )
          })}
        </div>
      </div>

      <OptionalNumberField
        label="Pipe invert to spillway crest"
        value={structure.pipeInvertToSpillwayFt}
        unit="ft"
        step={0.1}
        onChange={(v) => onUpdate({ pipeInvertToSpillwayFt: v })}
        tooltip="Vertical distance from the pipe invert (bottom of pipe) to the spillway crest elevation."
      />
    </div>
  )
}

function WeirFields({
  structure,
  onUpdate,
}: {
  structure: Structure
  onUpdate: (updates: Partial<Omit<Structure, 'id'>>) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <OptionalNumberField
        label="Weir length"
        value={structure.weirLengthFt}
        unit="ft"
        step={0.5}
        onChange={(v) => onUpdate({ weirLengthFt: v })}
        tooltip="Effective length of the weir crest in feet."
      />
      <OptionalNumberField
        label="Discharge coefficient C"
        value={structure.weirCoefficientC}
        unit=""
        step={0.01}
        onChange={(v) => onUpdate({ weirCoefficientC: v })}
        tooltip="Weir discharge coefficient. Broad-crested weirs typically use C = 3.33; sharp-crested weirs use C ≈ 3.27–3.94."
        placeholder="3.33"
      />
    </div>
  )
}

// ── Shared sub-components ───────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-1">
      {children}
    </h4>
  )
}

function SpillwayRadio({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none group">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ring-1 transition-colors ${
          checked
            ? 'ring-blue-500 bg-blue-500'
            : 'ring-zinc-300 dark:ring-zinc-600 bg-transparent group-hover:ring-blue-400'
        }`}
        onClick={onChange}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      <input type="radio" className="sr-only" checked={checked} onChange={onChange} name={`spillway-${id}`} />
      <span className={`text-sm ${checked ? 'text-zinc-900 dark:text-white font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>
        {label}
      </span>
    </label>
  )
}

function OptionalNumberField({
  label,
  value,
  unit,
  step,
  onChange,
  tooltip,
  placeholder,
}: {
  label: string
  value: number | undefined
  unit: string
  step: number
  onChange: (v: number | undefined) => void
  tooltip?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
        {label}
        {tooltip && <InfoTooltip content={tooltip} />}
      </Label>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          step={step}
          min={0}
          value={value ?? ''}
          placeholder={placeholder ?? '—'}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            onChange(isNaN(v) ? undefined : v)
          }}
          className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-sm tabular-nums h-9 flex-1"
        />
        {unit && <span className="text-xs text-zinc-500 shrink-0 whitespace-nowrap">{unit}</span>}
      </div>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 py-10 px-6 text-center">
      <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
        <span className="text-lg">🌊</span>
      </div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">No structures defined</p>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4 max-w-[260px]">
        Add detention ponds or other control structures. Assign them to a reach in the Reach Data tab.
      </p>
      <Button size="sm" onClick={onAdd} variant="outline"
        className="border-zinc-300 dark:border-zinc-600 hover:border-blue-500">
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add First Structure
      </Button>
    </div>
  )
}
