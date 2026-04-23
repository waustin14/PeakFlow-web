import { Leaf } from 'lucide-react'
import { usePreDevCompositeCN } from '@/hooks/usePreDevCompositeCN'
import { useProjectStore } from '@/store/useProjectStore'
import { LandUseEditor } from '@/components/steps/shared/LandUseEditor'
import { Button } from '@/components/ui/button'

export function Step4PreDevelopment() {
  usePreDevCompositeCN()

  const watershed = useProjectStore((s) => s.watershed)
  const preDevLandUseEntries = useProjectStore((s) => s.preDevLandUseEntries)
  const preDevCompositeCN = useProjectStore((s) => s.preDevCompositeCN)
  const addPreDevLandUseEntry = useProjectStore((s) => s.addPreDevLandUseEntry)
  const updatePreDevLandUseEntry = useProjectStore((s) => s.updatePreDevLandUseEntry)
  const removePreDevLandUseEntry = useProjectStore((s) => s.removePreDevLandUseEntry)

  const watershedAreaAcres = watershed?.areaAcres ?? 0

  const handleQuickBaseline = () => {
    if (watershedAreaAcres <= 0) return
    // Meadow in good hydrologic condition, HSG B — CN 58 (TR-55 Table 2-2)
    addPreDevLandUseEntry({
      code: 'meadow_b',
      label: 'Meadow — good condition (HSG B)',
      hsg: 'B',
      cn: 58,
      areaAcres: watershedAreaAcres,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Pre-Development Conditions</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Characterize existing (pre-development) land cover. This is the regulatory baseline —
          post-development peak flows must not exceed these values.
        </p>
      </div>

      {preDevLandUseEntries.length === 0 && watershedAreaAcres > 0 && (
        <div className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 flex items-start gap-3">
          <Leaf className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium mb-1">Don't have pre-development data yet?</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              Use the Quick Baseline to pre-fill Meadow / HSG B across the full watershed area as a
              conservative starting point. Refine the entries before finalizing.
            </p>
            <Button size="sm" variant="outline" onClick={handleQuickBaseline}
              className="border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-xs h-7">
              <Leaf className="h-3 w-3 mr-1" />
              Quick Baseline (Meadow / HSG B)
            </Button>
          </div>
        </div>
      )}

      <LandUseEditor
        entries={preDevLandUseEntries}
        compositeCN={preDevCompositeCN}
        watershedAreaAcres={watershedAreaAcres}
        onAdd={addPreDevLandUseEntry}
        onUpdate={updatePreDevLandUseEntry}
        onRemove={removePreDevLandUseEntry}
        badgeLabel="Pre-Dev Composite CN"
        cardTitle="Add Pre-Development Land Use"
      />
    </div>
  )
}
