import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ApprovalsPage } from '@/features/approvals/pages/ApprovalsPage'
import { ApprovalDetailPage } from '@/features/approvals/pages/ApprovalDetailPage'
import { TeamCalendarPage } from '@/features/approvals/pages/TeamCalendarPage'
import { TeamManagementPreviewPage } from '@/features/teams/pages/TeamManagementPage'
import { NotificationsPreviewPage } from '@/features/collaborator/pages/NotificationsPage'
import { ProfilePreviewPage } from '@/features/collaborator/pages/ProfilePage'
import { RulesHelpPage } from '@/features/collaborator/pages/RulesHelpPage'
import { PortfolioDashboardPage } from './PortfolioDashboardPage'
import { PortfolioAnalyticsPage } from './PortfolioAnalyticsPage'
import { PortfolioAuditPage } from './PortfolioAuditPage'
import { portfolioPreviewWorkspace } from '../data/portfolio-preview-data'

/** Isolated read-only cache: production query declarations and services are untouched. */
export function PortfolioPreviewPage() {
  const { pathname } = useLocation()
  const [client] = useState(() => {
    const cache = new QueryClient({ defaultOptions: { queries: { enabled: false, retry: false } } })
    cache.setQueryData(['portfolio-workspace'], portfolioPreviewWorkspace)
    cache.setQueryData(['portfolio-audit'], [])
    cache.setQueryData(['client-error-events'], [])
    return cache
  })
  const route = pathname.replace('/sistema-visual/portfolio', '')
  const screen = route.startsWith('/aprobaciones/') ? (
    <ApprovalDetailPage />
  ) : route === '/aprobaciones' ? (
    <ApprovalsPage />
  ) : route === '/calendario' ? (
    <TeamCalendarPage global />
  ) : route === '/equipos' ? (
    <TeamManagementPreviewPage />
  ) : route === '/bi-global' ? (
    <PortfolioAnalyticsPage />
  ) : route === '/analisis-inteligente' ? (
    <PortfolioAnalyticsPage insightsOnly />
  ) : route === '/excepciones-auditoria' ? (
    <PortfolioAuditPage />
  ) : route === '/notificaciones' ? (
    <NotificationsPreviewPage />
  ) : route === '/perfil' ? (
    <ProfilePreviewPage />
  ) : route === '/reglas-ayuda' ? (
    <RulesHelpPage />
  ) : (
    <PortfolioDashboardPage />
  )
  return <QueryClientProvider client={client}>{screen}</QueryClientProvider>
}
