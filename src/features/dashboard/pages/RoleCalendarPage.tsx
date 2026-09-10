import { TeamCalendarPage } from '@/features/approvals/pages/TeamCalendarPage'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PersonalCalendarPage } from '@/features/collaborator/pages/PersonalCalendarPage'

export function RoleCalendarPage() {
  const { access } = useAuth()
  if (access?.roles.includes('PORTFOLIO_MANAGER')) return <TeamCalendarPage global />
  if (access?.roles.includes('TEAM_LEADER')) return <TeamCalendarPage />
  return <PersonalCalendarPage />
}
