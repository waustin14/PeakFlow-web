import type { ReturnPeriod } from './project'

export interface RunoffResult {
  returnPeriod: ReturnPeriod
  rainfallDepthIn: number
  sValue: number
  iaValue: number
  runoffDepthIn: number
  runoffVolumeAcreFt: number
}

export interface PeakDischargeResult {
  returnPeriod: ReturnPeriod
  runoffDepthIn: number
  iaOverP: number
  quCsm: number
  peakDischargeCfs: number
}

export interface DetentionBasinResult {
  returnPeriod: ReturnPeriod
  inflowCfs: number
  allowableOutflowCfs: number
  qoOverQi: number
  vsOverVr: number
  requiredStorageAcreFt: number
}

export interface HydrographPoint {
  timeHr: number
  flowCfs: number
}

/** Minimal scenario results — used for the pre-development baseline overlay. */
export interface ScenarioResults {
  compositeCN: number
  tcHours: number
  peakDischarge: Partial<Record<ReturnPeriod, number>>
  hydrographs: Partial<Record<ReturnPeriod, HydrographPoint[]>>
}

export interface TR55Results {
  // Post-development (primary computation)
  compositeCN: number
  tcHours: number
  areaAcres: number
  runoff: RunoffResult[]
  peakDischarge: PeakDischargeResult[]
  detentionBasin: DetentionBasinResult[]
  hydrographs: Record<ReturnPeriod, HydrographPoint[]>
  // Pre-development baseline (present when pre-dev CN is configured)
  preDev?: ScenarioResults
  computedAt: string
}
