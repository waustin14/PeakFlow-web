export type ReturnPeriod = 1 | 2 | 5 | 10 | 25 | 50 | 100

export type HydrologicSoilGroup = 'A' | 'B' | 'C' | 'D'

export type StormType = 'I' | 'IA' | 'II' | 'III'

export interface LatLngLiteral {
  lat: number
  lng: number
}

export interface WatershedGeometry {
  path: LatLngLiteral[]
  areaAcres: number
  centroid: LatLngLiteral
}

export interface RainfallDepths {
  depths: Partial<Record<ReturnPeriod, number>>
  source: 'noaa' | 'manual'
  stormType: StormType
  fetchedAt?: string
}

export interface LandUseEntry {
  id: string
  code: string
  label: string
  hsg: HydrologicSoilGroup
  cn: number
  areaAcres: number
}

export type FlowSegmentType = 'sheet' | 'shallow_concentrated' | 'channel'
export type SurfaceType = 'paved' | 'unpaved'

export interface FlowSegmentBase {
  id: string
  type: FlowSegmentType
  label: string
  lengthFt: number
  slopeFtFt: number
  travelTimeHours?: number
}

export interface SheetFlowSegment extends FlowSegmentBase {
  type: 'sheet'
  manningsN: number
  p2InchRainfall: number
}

export interface ShallowConcentratedSegment extends FlowSegmentBase {
  type: 'shallow_concentrated'
  surfaceType: SurfaceType
}

export interface ChannelFlowSegment extends FlowSegmentBase {
  type: 'channel'
  manningsN: number
  hydraulicRadiusFt: number
}

export type FlowSegment = SheetFlowSegment | ShallowConcentratedSegment | ChannelFlowSegment

export interface ProjectMeta {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface NoaaFetchState {
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: string
  lastFetchedAt?: string
}

// ── Reaches ────────────────────────────────────────────────────────────────

export interface Reach {
  id: string
  name: string
  receivingReachId: string | 'outlet'
  lengthFt: number
  manningsN: number
  frictionSlopeFtFt: number
  bottomWidthFt: number
  avgSideSlopes: number   // horizontal per 1 vertical (e.g. 2 means 2:1)
  structureId?: string
}

// ── Structures ─────────────────────────────────────────────────────────────

export type SpillwayType = 'pipe' | 'weir'

export interface Structure {
  id: string
  name: string
  // Pond surface area (both optional)
  pondSurfaceAreaAtCrestAcres?: number
  additionalDepthFt?: number           // feet above spillway crest
  additionalSurfaceAreaAcres?: number  // area at that elevation
  spillwayType: SpillwayType
  // Pipe spillway
  trialDiameter1In?: number
  trialDiameter2In?: number
  trialDiameter3In?: number
  pipeInvertToSpillwayFt?: number
  // Weir spillway
  weirLengthFt?: number
  weirCoefficientC?: number            // default 3.33 for broad-crested
}
