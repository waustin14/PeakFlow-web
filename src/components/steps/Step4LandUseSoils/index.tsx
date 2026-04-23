import { useCompositeCN } from '@/hooks/useCompositeCN'
import { useProjectStore } from '@/store/useProjectStore'
import { LandUseEditor } from '@/components/steps/shared/LandUseEditor'

export function Step4LandUseSoils() {
  useCompositeCN()

  const watershed = useProjectStore((s) => s.watershed)
  const landUseEntries = useProjectStore((s) => s.landUseEntries)
  const compositeCN = useProjectStore((s) => s.compositeCN)
  const addLandUseEntry = useProjectStore((s) => s.addLandUseEntry)
  const updateLandUseEntry = useProjectStore((s) => s.updateLandUseEntry)
  const removeLandUseEntry = useProjectStore((s) => s.removeLandUseEntry)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Post-Development Land Use & Soils</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Build the composite CN from post-development land use / hydrologic soil group combinations.
        </p>
      </div>
      <LandUseEditor
        entries={landUseEntries}
        compositeCN={compositeCN}
        watershedAreaAcres={watershed?.areaAcres ?? 0}
        onAdd={addLandUseEntry}
        onUpdate={updateLandUseEntry}
        onRemove={removeLandUseEntry}
        badgeLabel="Post-Dev Composite CN"
      />
    </div>
  )
}
