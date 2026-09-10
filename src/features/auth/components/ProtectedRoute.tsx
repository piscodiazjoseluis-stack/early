import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { session, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="bg-background grid min-h-screen place-items-center" aria-live="polite">
        <div className="text-center">
          <span className="border-border border-t-electric-blue mx-auto block size-9 animate-spin rounded-full border-4" />
          <p className="text-primary mt-4 font-semibold">Comprobando tu sesión…</p>
        </div>
      </main>
    )
  }

  if (!session) {
    return <Navigate to="/iniciar-sesion" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
