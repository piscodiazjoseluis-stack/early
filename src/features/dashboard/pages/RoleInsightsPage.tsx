import { TeamInsightsPage } from '@/features/approvals/pages/TeamInsightsPage'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PortfolioAnalyticsPage } from '@/features/portfolio/pages/PortfolioAnalyticsPage'

export function RoleInsightsPage() {
  const { access } = useAuth()
  if (access?.roles.includes('PORTFOLIO_MANAGER')) return <PortfolioAnalyticsPage insightsOnly />
  return <TeamInsightsPage />
}
