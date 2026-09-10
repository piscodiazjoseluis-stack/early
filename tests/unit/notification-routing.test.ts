import { describe, expect, it } from 'vitest'

import { notificationRequestPath } from '@/features/collaborator/utils/notification-routing'

describe('navegación desde notificaciones', () => {
  it('abre el detalle propio para un colaborador', () => {
    expect(notificationRequestPath(['COLLABORATOR'], 'request-1', false)).toBe(
      '/solicitudes/request-1',
    )
  })

  it('abre el detalle de aprobación para jefatura y Portfolio', () => {
    expect(notificationRequestPath(['TEAM_LEADER'], 'request-2', false)).toBe(
      '/aprobaciones/request-2',
    )
    expect(notificationRequestPath(['PORTFOLIO_MANAGER'], 'request-3', false)).toBe(
      '/aprobaciones/request-3',
    )
  })
})
