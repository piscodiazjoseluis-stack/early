import { useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'

/** Presentation only; production guards and permissions remain authoritative. */
export function usePortfolioExperience() {
  const { pathname } = useLocation()
  const { access } = useAuth()
  if (pathname.startsWith('/sistema-visual'))
    return pathname.startsWith('/sistema-visual/portfolio')
  return Boolean(access?.roles.includes('PORTFOLIO_MANAGER'))
}
