import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUIStore, type Step } from '@/store/useUIStore'
import { useProjectStore, selectIsStep1Complete, selectIsStep2Complete, selectIsStep3Complete, selectIsStep4Complete, selectIsStep5Complete, selectIsStep6Complete, selectIsStep7Complete } from '@/store/useProjectStore'
import { cn } from '@/lib/utils'
import { Sidebar } from './Sidebar'
import { StepErrorBoundary } from './StepErrorBoundary'
import { WatershedMap } from '@/components/map/WatershedMap'
import { Step1ProjectSetup } from '@/components/steps/Step1ProjectSetup'
import { Step2Watershed } from '@/components/steps/Step2Watershed'
import { Step3Rainfall } from '@/components/steps/Step3Rainfall'
import { Step4PreDevelopment } from '@/components/steps/Step4PreDevelopment'
import { Step4LandUseSoils } from '@/components/steps/Step4LandUseSoils'
import { Step5TimeOfConc } from '@/components/steps/Step5TimeOfConc'
import { Step6ReachStructure } from '@/components/steps/Step6ReachStructure'
import { Step7Results } from '@/components/steps/Step7Results'
import { ScrollArea } from '@/components/ui/scroll-area'

const STEP_COMPONENTS: Record<Step, React.ComponentType> = {
  1: Step1ProjectSetup,
  2: Step2Watershed,
  3: Step3Rainfall,
  4: Step4PreDevelopment,
  5: Step4LandUseSoils,
  6: Step5TimeOfConc,
  7: Step6ReachStructure,
  8: Step7Results,
}

const STEP_LABELS: Record<Step, string> = {
  1: 'Project Setup',
  2: 'Watershed',
  3: 'Rainfall',
  4: 'Pre-Development',
  5: 'Post-Development',
  6: 'Time of Conc.',
  7: 'Reaches & Structures',
  8: 'Results',
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
    7: selectIsStep7Complete(s),
    8: true,
  }
  return map[step]
}

export function AppShell() {
  const activeStep = useUIStore((s) => s.activeStep)
  const setActiveStep = useUIStore((s) => s.setActiveStep)
  const StepComponent = STEP_COMPONENTS[activeStep]
  const isComplete = useCurrentStepComplete(activeStep)

  // Steps 1–2: step panel is fixed 380px, map fills remaining space.
  // Steps 3–7: step panel expands up to 560px, map fills remaining space.
  // Step 8: step panel fills entire content area, no map.
  const stepPanelClass = activeStep === 8
    ? 'flex-1'
    : activeStep <= 2
    ? 'w-[380px] shrink-0'
    : 'flex-1 max-w-[560px]'

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Step panel */}
      <div className={cn(
        'flex flex-col border-r border-border bg-background overflow-x-hidden transition-all duration-300 ease-in-out',
        stepPanelClass
      )}>
        {/* Step panel header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0">
          <span className="font-mono text-xs font-bold text-primary tabular-nums tracking-wider">
            {String(activeStep).padStart(2, '0')}/{String(8).padStart(2, '0')}
          </span>
          <span className="text-border text-xs">|</span>
          <span className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {STEP_LABELS[activeStep]}
          </span>
          <div className="flex-1" />
          {/* Progress pips */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
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
        {activeStep < 8 && (
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

      {/* Map — always mounted so Leaflet never remounts; hidden on Step 8. */}
      {activeStep !== 8 && (
        <div className="relative flex-1 overflow-hidden">
          <WatershedMap />
        </div>
      )}
    </div>
  )
}
