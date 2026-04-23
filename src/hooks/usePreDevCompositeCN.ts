import { useEffect } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { computeCompositeCN } from '@/lib/tr55/runoffVolume'

/**
 * Derives weighted composite CN from pre-development land use entries.
 * Writes the result back to the store.
 */
export function usePreDevCompositeCN() {
  const preDevLandUseEntries = useProjectStore((s) => s.preDevLandUseEntries)
  const setPreDevCompositeCN = useProjectStore((s) => s.setPreDevCompositeCN)

  useEffect(() => {
    if (preDevLandUseEntries.length === 0) {
      setPreDevCompositeCN(null)
      return
    }
    const cn = computeCompositeCN(preDevLandUseEntries)
    setPreDevCompositeCN(Math.round(cn * 10) / 10)
  }, [preDevLandUseEntries, setPreDevCompositeCN])
}
