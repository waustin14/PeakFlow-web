import { ChevronLeft, ChevronRight, Map, ChevronLeftIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useUIStore, type Step } from '@/store/useUIStore'
import { useProjectStore, selectIsStep1Complete, selectIsStep2Complete, selectIsStep3Complete, selectIsStep4Complete, selectIsStep5Complete, selectIsStep6Complete } from '@/store/useProjectStore'
import { cn } from '@/lib/utils'
import { Sidebar } from './Sidebar'
import { StepErrorBoundary } from './StepErrorBoundary'
import { WatershedMap } from '@/components/map/WatershedMap'
import { Step1ProjectSetup } from '@/components/steps/Step1ProjectSetup'
import { Step2Watershed } from '@/components/steps/Step2Watershed'
import { Step3Rainfall } from '@/components/steps/Step3Rainfall'
import { Step4LandUseSoils } from '@/components/steps/Step4LandUseSoils'
import { Step5TimeOfConc } from '@/components/steps/Step5TimeOfConc'
import { Step6ReachStructure } from '@/components/steps/Step6ReachStructure'
import { Step7Results } from '@/components/steps/Step7Results'
import { ScrollArea } from '@/components/ui/scroll-area'

const STEP_COMPONENTS = {
  1: Step1ProjectSetup,
  2: Step2Watershed,
  3: Step3Rainfall,
  4: Step4LandUseSoils,
  5: Step5TimeOfConc,
  6: Step6ReachStructure,
  7: Step7Results,
}

const STEP_LABELS: Record<number, string> = {
  1: 'Project Setup',
  2: 'Watershed',
  3: 'Rainfall',
  4: 'Land Use & Soils',
  5: 'Time of Conc.',
  6: 'Reaches & Structures',
  7: 'Results',
}

function useCurrentStepComplete(step: Step): boolean {
  const s = useProjectStore()
  const map: Record<Step, boolean> = {
    1: selectIsStep1Complete(s),
    2: selectIsStep2Complete(s),
    3: selectIsStep3Complete(s),
    4: selectIsStep4Complete(s),
    5: selectIsStep5Complete(s),
    6: selectIsStep6Complete(s),
    7: true,
  }
  return map[step]
}

export function AppShell() {
  const activeStep = useUIStore((s) => s.activeStep)
  const setActiveStep = useUIStore((s) => s.setActiveStep)
  const isMapCollapsed = useUIStore((s) => s.isMapCollapsed)
  const setIsMapCollapsed = useUIStore((s) => s.setIsMapCollapsed)
  const watershed = useProjectStore((s) => s.watershed)
  const StepComponent = STEP_COMPONENTS[activeStep]
  const isComplete = useCurrentStepComplete(activeStep)

  // Auto-collapse map when advancing past Step 2 with a completed watershed;
  // auto-expand when the user navigates back to Step 2.
  useEffect(() => {
    if (activeStep === 2) {
      setIsMapCollapsed(false)
    } else if (activeStep > 2 && watershed !== null) {
      setIsMapCollapsed(true)
    }
  }, [activeStep, watershed, setIsMapCollapsed])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Step panel */}
      <div className={cn(
        'flex flex-col border-r border-border bg-background overflow-x-hidden',
        activeStep === 7 ? 'flex-1' : 'w-[380px] shrink-0'
      )}>
        {/* Step panel header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0">
          <span className="font-mono text-xs font-bold text-primary tabular-nums tracking-wider">
            {String(activeStep).padStart(2, '0')}/{String(7).padStart(2, '0')}
          </span>
          <span className="text-border text-xs">|</span>
          <span className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {STEP_LABELS[activeStep]}
          </span>
          <div className="flex-1" />
          {/* Progress pips */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 7 }, (_, i) => i + 1).map((n) => (
              <span
                key={n}
                className={cn(
                  'rounded-full transition-all duration-300',
                  n < activeStep
                    ? 'h-1.5 w-1.5 bg-primary/60'
                    : n === activeStep
                    ? 'h-1.5 w-4 bg-primary step-active-dot'
                    : 'h-1.5 w-1.5 bg-border'
                )}
              />
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <StepErrorBoundary>
            <div className="p-5 min-w-0 w-full">
              <StepComponent />
            </div>
          </StepErrorBoundary>
        </ScrollArea>

        {/* Nav footer — hidden on last step */}
        {activeStep < 7 && (
          <div className="shrink-0 px-5 py-3 border-t border-border flex gap-2">
            {activeStep > 1 && (
              <button
                onClick={() => setActiveStep((activeStep - 1) as Step)}
                className="flex items-center justify-center gap-1 rounded-md px-3 py-2 text-sm font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all duration-150"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <button
              onClick={() => isComplete && setActiveStep((activeStep + 1) as Step)}
              disabled={!isComplete}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all duration-150',
                isComplete
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
              )}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Map — always mounted; hidden on Step 7 where results need the space.
          Collapses to a narrow strip on Steps 3–6 once the watershed is drawn. */}
      {activeStep !== 7 && (
        <div
          className={cn(
            'relative overflow-hidden flex-shrink-0 transition-all duration-300 ease-in-out',
            isMapCollapsed ? 'w-[52px]' : 'flex-1'
          )}
        >
          {/* Map always rendered so Leaflet/MapLibre never remounts */}
          <div className="absolute inset-0">
            <WatershedMap />
          </div>

          {/* Collapsed strip overlay — shown only when collapsed */}
          {isMapCollapsed && (
            <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-[2px] flex flex-col items-center gap-3 pt-4 z-10">
              <button
                onClick={() => setIsMapCollapsed(false)}
                title="Expand map"
                className="flex flex-col items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors duration-150 group"
              >
                <Map className="h-5 w-5 group-hover:scale-110 transition-transform duration-150" />
                <span
                  className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-500 group-hover:text-blue-400 transition-colors duration-150"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
                >
                  Map
                </span>
              </button>
            </div>
          )}

          {/* Collapse toggle — shown only when expanded */}
          {!isMapCollapsed && (
            <button
              onClick={() => setIsMapCollapsed(true)}
              title="Collapse map"
              className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-md px-2 py-1 bg-zinc-800/90 border border-zinc-700 text-zinc-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-zinc-800 transition-all duration-150 text-xs font-medium shadow-md backdrop-blur-sm"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
              <span className="font-mono text-[10px] tracking-wider">Collapse</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
