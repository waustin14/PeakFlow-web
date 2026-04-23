import { useCallback } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { computeS, computeIa, computeRunoffDepth, computeRunoffVolume } from '@/lib/tr55/runoffVolume'
import { computeIaOverP, interpolateQu, computePeakDischarge } from '@/lib/tr55/peakDischarge'
import { computeRequiredStorage, computeVsOverVr } from '@/lib/tr55/detentionBasin'
import { computeScenario } from '@/lib/tr55/scenario'
import type { ReturnPeriod } from '@/types/project'
import type {
  RunoffResult,
  PeakDischargeResult,
  DetentionBasinResult,
  HydrographPoint,
  TR55Results,
} from '@/types/results'

function buildTriangularHydrograph(
  qpCfs: number,
  tcHours: number,
  durationHours = 24
): HydrographPoint[] {
  const D = 1.0
  const tpeak = 0.6 * tcHours + D / 2
  const tbase = 2.67 * tpeak
  const points: HydrographPoint[] = []
  const step = 0.25
  for (let t = 0; t <= Math.max(durationHours, tbase) + step; t += step) {
    let q: number
    if (t <= tpeak) {
      q = qpCfs * (t / tpeak)
    } else if (t <= tbase) {
      q = qpCfs * (1 - (t - tpeak) / (tbase - tpeak))
    } else {
      q = 0
    }
    points.push({ timeHr: Math.round(t * 100) / 100, flowCfs: Math.max(0, q) })
  }
  return points
}

export function useTR55Results() {
  const store = useProjectStore()

  const computeResults = useCallback(() => {
    const {
      watershed,
      rainfall,
      returnPeriods,
      compositeCN,
      preDevCompositeCN,
      tcHours,
      allowableOutflows,
      setResults,
    } = store

    if (!watershed || !rainfall || !compositeCN || !tcHours) return

    const areaAcres = watershed.areaAcres
    const stormType = rainfall.stormType
    const cn = compositeCN

    const runoff: RunoffResult[] = []
    const peakDischarge: PeakDischargeResult[] = []
    const detentionBasin: DetentionBasinResult[] = []
    const hydrographs: Partial<Record<ReturnPeriod, HydrographPoint[]>> = {}

    const S = computeS(cn)
    const Ia = computeIa(S)

    for (const period of returnPeriods as ReturnPeriod[]) {
      const P = rainfall.depths[period]
      if (!P) continue

      // Module 1: Runoff
      const Q = computeRunoffDepth(P, cn)
      const V = computeRunoffVolume(Q, areaAcres)

      runoff.push({
        returnPeriod: period,
        rainfallDepthIn: P,
        sValue: S,
        iaValue: Ia,
        runoffDepthIn: Q,
        runoffVolumeAcreFt: V,
      })

      // Module 3: Peak Discharge
      const iaOverP = computeIaOverP(P, cn)
      let qu = 0
      let qp = 0
      try {
        qu = interpolateQu(stormType, tcHours, iaOverP)
        qp = computePeakDischarge(qu, areaAcres, Q)
      } catch {
        qp = 0
      }

      peakDischarge.push({
        returnPeriod: period,
        runoffDepthIn: Q,
        iaOverP,
        quCsm: qu,
        peakDischargeCfs: qp,
      })

      // Module 4: Detention Basin
      const qo = allowableOutflows[period] ?? 0
      const qoOverQi = qp > 0 ? Math.min(qo / qp, 1.0) : 0
      const vsVr = computeVsOverVr(qoOverQi)
      const Vs = vsVr * V

      detentionBasin.push({
        returnPeriod: period,
        inflowCfs: qp,
        allowableOutflowCfs: qo,
        qoOverQi,
        vsOverVr: vsVr,
        requiredStorageAcreFt: Vs,
      })

      // Post-dev hydrograph
      hydrographs[period] = buildTriangularHydrograph(qp, tcHours)
    }

    // Pre-development scenario (when CN is available)
    const preDev = preDevCompositeCN
      ? computeScenario(
          preDevCompositeCN,
          tcHours,
          areaAcres,
          rainfall.depths,
          returnPeriods as ReturnPeriod[],
          stormType
        )
      : undefined

    const results: TR55Results = {
      compositeCN: cn,
      tcHours,
      areaAcres,
      runoff,
      peakDischarge,
      detentionBasin,
      hydrographs: hydrographs as Record<ReturnPeriod, HydrographPoint[]>,
      preDev,
      computedAt: new Date().toISOString(),
    }

    setResults(results)
    return results
  }, [store])

  return { computeResults }
}
