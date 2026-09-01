import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'

export function PublicOnlyRoute() {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  return session ? <Navigate to="/panel" replace /> : <Outlet />
}
