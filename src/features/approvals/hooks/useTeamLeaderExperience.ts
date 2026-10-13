import { useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'

/** Presentation variant only. Authorization remains in RoleRoute and Supabase. */
export function useTeamLeaderExperience() {
  const { pathname } = useLocation()
  const { access } = useAuth()
  if (pathname.startsWith('/sistema-visual')) return pathname.startsWith('/sistema-visual/jefe')
  return Boolean(
    access?.roles.includes('TEAM_LEADER') &&
    !access.roles.includes('PORTFOLIO_MANAGER') &&
    !access.roles.includes('ADMIN'),
  )
}
