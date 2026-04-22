import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class StepErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Step render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                Step failed to render
              </p>
              <p className="text-xs text-red-600 dark:text-red-300 font-mono break-all">
                {this.state.error.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            className="text-xs text-zinc-500 underline"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
