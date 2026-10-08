import { describe, expect, it } from 'vitest'

import type { TeamApprovalRequest } from '@/features/approvals/types'
import {
  filterPortfolioRequests,
  recommendPortfolioCandidate,
  requestedFridayEvolution,
} from '@/features/portfolio/utils/portfolio-analysis'

function request(
  status: TeamApprovalRequest['status'],
  finalDecidedAt: string | null,
  requestedDate = '2026-08-14',
) {
  return {
    id: crypto.randomUUID(),
    requesterId: 'user',
    requesterName: 'Persona',
    requesterJobTitle: 'Cargo',
    requesterAvatarUrl: null,
    teamName: 'Team',
    requestedDate,
    startTime: '13:00:00',
    endTime: '15:00:00',
    permittedStartTime: '13:00:00',
    permittedEndTime: '15:00:00',
    reason: null,
    status,
    approvalLevel: 'COMPLETED',
    priority: 50,
    createdAt: '2026-08-10T13:00:00Z',
    updatedAt: '2026-08-10T13:00:00Z',
    submittedAt: '2026-08-10T13:00:00Z',
    finalDecidedAt,
    usageConfirmedAt: null,
  } satisfies TeamApprovalRequest
}

describe('evolución por viernes solicitado del portfolio', () => {
  it('no contabiliza rechazos como aprobaciones', () => {
    const current = requestedFridayEvolution([
      request('FINAL_APPROVED', '2026-08-11T12:00:00Z'),
      request('REJECTED_BY_PORTFOLIO', '2026-08-11T13:00:00Z'),
    ])[0]

    expect(current).toMatchObject({ solicitudes: 2, aprobaciones: 1 })
  })
})

describe('filtro por período del portfolio', () => {
  it('incluye ambos extremos del rango solicitado', () => {
    const requests = [
      request('USED', '2026-08-07T18:00:00Z', '2026-08-07'),
      request('FINAL_APPROVED', '2026-08-14T18:00:00Z', '2026-08-14'),
      request('PENDING_PORTFOLIO', null, '2026-08-21'),
    ]

    expect(
      filterPortfolioRequests(requests, '2026-08-14', '2026-08-21').map(
        (item) => item.requestedDate,
      ),
    ).toEqual(['2026-08-14', '2026-08-21'])
    expect(
      filterPortfolioRequests(requests, '', '2026-08-14').map((item) => item.requestedDate),
    ).toEqual(['2026-08-07', '2026-08-14'])
  })
})

describe('recomendación semanal del portfolio', () => {
  it('solo recomienda colaboradores elegibles que participan en rotación', () => {
    const people = [
      {
        userId: 'leader',
        fullName: 'Jefa',
        jobTitle: 'Jefa',
        teamName: 'Team Uno',
        role: 'Jefe directo',
        isEligible: false,
        participatesInRotation: false,
      },
      {
        userId: 'eligible',
        fullName: 'Colaboradora Elegible',
        jobTitle: 'Practicante',
        teamName: 'Team Uno',
        role: 'Colaborador',
        isEligible: true,
        participatesInRotation: true,
      },
      {
        userId: 'blocked',
        fullName: 'Colaborador No Elegible',
        jobTitle: 'Practicante',
        teamName: 'Team Dos',
        role: 'Colaborador',
        isEligible: false,
        participatesInRotation: true,
      },
    ] satisfies Parameters<typeof recommendPortfolioCandidate>[0]

    expect(
      recommendPortfolioCandidate(
        people,
        [],
        [
          { name: 'Uno', value: 0 },
          { name: 'Dos', value: 0 },
        ],
      )?.userId,
    ).toBe('eligible')
  })
})
