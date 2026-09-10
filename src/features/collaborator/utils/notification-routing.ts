import type { AppRole } from '@/features/auth/types'

export function notificationRequestPath(roles: AppRole[], requestId: string, preview: boolean) {
  if (preview) return `/sistema-visual/solicitudes/${requestId}`
  const canReview = roles.some((role) => ['TEAM_LEADER', 'PORTFOLIO_MANAGER'].includes(role))
  return canReview ? `/aprobaciones/${requestId}` : `/solicitudes/${requestId}`
}
