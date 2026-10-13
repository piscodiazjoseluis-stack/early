import { useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'

export function useCollaboratorExperience() {
  const location = useLocation()
  const { access } = useAuth()
  const preview = location.pathname.startsWith('/sistema-visual')
  const leaderPreview = location.pathname.startsWith('/sistema-visual/jefe')
  const portfolioPreview = location.pathname.startsWith('/sistema-visual/equipos')

  if (preview) return !leaderPreview && !portfolioPreview

  return Boolean(
    access?.roles.includes('COLLABORATOR') &&
    !access.roles.includes('TEAM_LEADER') &&
    !access.roles.includes('PORTFOLIO_MANAGER') &&
    !access.roles.includes('ADMIN'),
  )
}
