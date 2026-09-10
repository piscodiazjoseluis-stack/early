import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useEffect } from 'react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { reportClientError } from '@/lib/monitoring/report-client-error'

export function RouteErrorPage() {
  const error = useRouteError()
  const isNotFound = isRouteErrorResponse(error) && error.status === 404

  useEffect(() => {
    if (isNotFound) return
    console.error('Uncaught route error', error)
    reportClientError('REACT_BOUNDARY', error)
  }, [error, isNotFound])

  return (
    <main
      className="bg-background grid min-h-screen place-items-center px-6 text-center"
      role="alert"
    >
      <div className="max-w-lg">
        <span className="bg-warning-soft text-warning mx-auto grid size-14 place-items-center rounded-2xl">
          <AlertTriangle className="size-7" aria-hidden="true" />
        </span>
        <p className="text-warning mt-5 text-sm font-bold tracking-widest uppercase">
          {isNotFound ? 'Página no encontrada' : 'Error inesperado'}
        </p>
        <h1 className="text-primary-strong mt-3 text-4xl font-extrabold">
          {isNotFound ? 'No encontramos esta pantalla' : 'No pudimos mostrar esta pantalla'}
        </h1>
        <p className="text-muted-foreground mt-4">
          Tu sesión sigue protegida. Intenta nuevamente o regresa al panel principal.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="border-border text-primary hover:border-electric-blue hover:text-electric-blue inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-5 py-3 font-bold transition"
          >
            <RotateCcw className="size-4" aria-hidden="true" /> Reintentar
          </button>
          <Link
            to="/panel"
            className="bg-electric-blue hover:bg-primary inline-flex min-h-11 items-center rounded-xl px-5 py-3 font-bold text-white transition"
          >
            Ir a mi panel
          </Link>
        </div>
      </div>
    </main>
  )
}
