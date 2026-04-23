import type { ReturnPeriod, StormType } from '@/types/project'
import type { ScenarioResults, HydrographPoint } from '@/types/results'
import { computeS, computeIa, computeRunoffDepth } from './runoffVolume'
import { computeIaOverP, interpolateQu, computePeakDischarge } from './peakDischarge'

function buildTriangularHydrograph(qpCfs: number, tcHours: number, durationHours = 24): HydrographPoint[] {
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

/**
 * Runs TR-55 Module 1 + Module 3 for a single CN/Tc scenario across all return periods.
 * Used for both post-development and pre-development computations.
 */
export function computeScenario(
  cn: number,
  tcHours: number,
  areaAcres: number,
  rainfallDepths: Partial<Record<ReturnPeriod, number>>,
  returnPeriods: ReturnPeriod[],
  stormType: StormType
): ScenarioResults {
  const S = computeS(cn)
  const Ia = computeIa(S)
  const peakDischarge: Partial<Record<ReturnPeriod, number>> = {}
  const hydrographs: Partial<Record<ReturnPeriod, HydrographPoint[]>> = {}

  for (const period of returnPeriods) {
    const P = rainfallDepths[period]
    if (!P) continue

    const Q = computeRunoffDepth(P, cn)
    const iaOverP = computeIaOverP(P, cn)

    let qp = 0
    try {
      const qu = interpolateQu(stormType, tcHours, iaOverP)
      qp = computePeakDischarge(qu, areaAcres, Q)
    } catch {
      qp = 0
    }

    peakDischarge[period] = qp
    hydrographs[period] = buildTriangularHydrograph(qp, tcHours)
  }

  // S and Ia unused externally but part of the scenario context
  void S; void Ia

  return { compositeCN: cn, tcHours, peakDischarge, hydrographs }
}
