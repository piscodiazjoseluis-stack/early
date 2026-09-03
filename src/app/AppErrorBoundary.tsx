import { Component, type ErrorInfo, type ReactNode } from 'react'

import { reportClientError } from '@/lib/monitoring/report-client-error'

interface AppErrorBoundaryState {
  failed: boolean
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught application error', { error, componentStack: info.componentStack })
    reportClientError('REACT_BOUNDARY', error)
  }

  render() {
    if (this.state.failed) {
      return (
        <main
          className="bg-background grid min-h-screen place-items-center px-6 text-center"
          role="alert"
        >
          <div className="max-w-lg">
            <p className="text-danger text-sm font-bold tracking-widest uppercase">
              Error inesperado
            </p>
            <h1 className="text-primary-strong mt-3 text-4xl font-extrabold">
              No pudimos continuar
            </h1>
            <p className="text-muted-foreground mt-4">
              Tu información permanece protegida. Recarga la aplicación para volver a intentarlo.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-electric-blue hover:bg-primary mt-8 min-h-11 rounded-xl px-5 py-3 font-bold text-white transition"
            >
              Recargar aplicación
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
