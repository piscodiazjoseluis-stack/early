import { Navigate, Outlet, useLocation } from 'react-router-dom'

import type { AppRole } from '../types'
import { useAuth } from '../hooks/useAuth'

interface RoleRouteProps {
  allowedRoles: AppRole[]
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { access, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="bg-background grid min-h-screen place-items-center" aria-live="polite">
        <div className="text-center">
          <span className="border-border border-t-electric-blue mx-auto block size-9 animate-spin rounded-full border-4" />
          <p className="text-primary mt-4 font-semibold">Comprobando tus permisos…</p>
        </div>
      </main>
    )
  }

  const isAllowed = access?.roles.some((role) => allowedRoles.includes(role)) ?? false
  if (!isAllowed) {
    return <Navigate to="/sin-acceso" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
