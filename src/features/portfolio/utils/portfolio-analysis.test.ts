import { describe, expect, it } from 'vitest'

import type { TeamApprovalRequest } from '@/features/approvals/types'

import {
  requestedFridayEvolution,
  resolvedApprovalRate,
  summarizeRequestStatuses,
} from './portfolio-analysis'

describe('summarizeRequestStatuses', () => {
  it('concilia todos los estados visibles del portfolio', () => {
    const summary = summarizeRequestStatuses([
      { status: 'FINAL_APPROVED' },
      { status: 'USED' },
      { status: 'PENDING_TEAM_LEADER' },
      { status: 'PENDING_PORTFOLIO' },
      { status: 'RETURNED_FOR_CORRECTION' },
      { status: 'REJECTED_BY_TEAM_LEADER' },
      { status: 'REJECTED_BY_PORTFOLIO' },
      { status: 'CANCELLED' },
      { status: 'EXPIRED' },
    ])

    expect(summary).toEqual({
      total: 9,
      approved: 2,
      inProgress: 3,
      rejected: 2,
      closedWithoutBenefit: 2,
      unclassified: 0,
    })
  })
})

describe('requestedFridayEvolution', () => {
  it('agrupa por viernes solicitado y conserva todo el rango de fechas con actividad', () => {
    const evolution = requestedFridayEvolution([
      request('2026-08-07', 'USED'),
      request('2026-09-25', 'FINAL_APPROVED'),
      request('2026-09-25', 'REJECTED_BY_TEAM_LEADER'),
      request('2026-10-09', 'FINAL_APPROVED'),
      request('2026-10-09', 'REJECTED_BY_PORTFOLIO'),
      request('2026-10-16', 'PENDING_PORTFOLIO'),
    ])

    expect(evolution[0]).toMatchObject({
      date: '2026-08-07',
      solicitudes: 1,
      aprobaciones: 1,
    })
    expect(evolution.find((item) => item.date === '2026-09-25')).toMatchObject({
      solicitudes: 2,
      aprobaciones: 1,
    })
    expect(evolution.find((item) => item.date === '2026-10-02')).toMatchObject({
      solicitudes: 0,
      aprobaciones: 0,
    })
    expect(evolution.at(-1)).toMatchObject({
      date: '2026-10-16',
      solicitudes: 1,
      aprobaciones: 0,
    })
  })
})

describe('resolvedApprovalRate', () => {
  it('calcula aprobadas solo sobre decisiones finales', () => {
    expect(
      resolvedApprovalRate([
        { status: 'FINAL_APPROVED' },
        { status: 'USED' },
        { status: 'REJECTED_BY_PORTFOLIO' },
        { status: 'PENDING_PORTFOLIO' },
        { status: 'CANCELLED' },
      ]),
    ).toBe(67)
  })
})

function request(requestedDate: string, status: TeamApprovalRequest['status']) {
  return { requestedDate, status } as TeamApprovalRequest
}
