import { useAuth } from '@/features/auth/hooks/useAuth'
import { TeamLeaderDashboardPage } from '@/features/approvals/pages/TeamLeaderDashboardPage'
import { VisualSystemPage } from '@/features/design-system/pages/VisualSystemPage'
import { PortfolioDashboardPage } from '@/features/portfolio/pages/PortfolioDashboardPage'

export function RoleDashboardPage() {
  const { access } = useAuth()
  if (access?.roles.includes('PORTFOLIO_MANAGER')) return <PortfolioDashboardPage />
  if (access?.roles.includes('TEAM_LEADER')) return <TeamLeaderDashboardPage />
  return <VisualSystemPage />
}
