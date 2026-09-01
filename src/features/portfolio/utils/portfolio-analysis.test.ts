import { describe, expect, it } from 'vitest'

import { summarizeRequestStatuses } from './portfolio-analysis'

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
