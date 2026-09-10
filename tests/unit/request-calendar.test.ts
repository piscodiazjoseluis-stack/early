import { describe, expect, it } from 'vitest'

import {
  groupRequestsByDate,
  groupRequestsByPersonAndDate,
  sortRequestsByRecency,
} from '@/features/requests/utils/request-calendar'

const requests = [
  {
    id: 'old-rejected',
    requestedDate: '2026-09-25',
    createdAt: '2026-08-01T10:00:00.000Z',
    requesterId: 'jose',
    status: 'REJECTED_BY_TEAM_LEADER',
  },
  {
    id: 'new-approved',
    requestedDate: '2026-09-25',
    createdAt: '2026-08-02T10:00:00.000Z',
    requesterId: 'jose',
    status: 'FINAL_APPROVED',
  },
  {
    id: 'valeria-current',
    requestedDate: '2026-09-25',
    createdAt: '2026-08-03T10:00:00.000Z',
    requesterId: 'valeria',
    status: 'PENDING_PORTFOLIO',
  },
]

describe('consolidación de solicitudes para calendarios', () => {
  it('muestra como vigente la solicitud más reciente y conserva el historial personal', () => {
    const group = groupRequestsByDate(
      requests.filter((request) => request.requesterId === 'jose'),
    ).get('2026-09-25')

    expect(group?.current.id).toBe('new-approved')
    expect(group?.history.map((request) => request.id)).toEqual(['new-approved', 'old-rejected'])
  })

  it('consolida por persona y fecha sin ocultar a otras personas del mismo viernes', () => {
    const groups = groupRequestsByPersonAndDate(requests)

    expect(groups.size).toBe(2)
    expect(groups.get('2026-09-25:jose')?.current.status).toBe('FINAL_APPROVED')
    expect(groups.get('2026-09-25:jose')?.history).toHaveLength(2)
    expect(groups.get('2026-09-25:valeria')?.current.id).toBe('valeria-current')
  })

  it('mantiene cien registros disponibles y ordenados para listas con scroll', () => {
    const manyRequests = Array.from({ length: 100 }, (_, index) => ({
      id: `request-${index}`,
      requestedDate: '2026-12-18',
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
    }))

    const sorted = sortRequestsByRecency(manyRequests)
    expect(sorted).toHaveLength(100)
    expect(sorted[0].id).toBe('request-99')
    expect(sorted.at(-1)?.id).toBe('request-0')
  })
})
