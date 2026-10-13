import { describe, expect, it } from 'vitest'

import type { TeamApprovalRequest } from '@/features/approvals/types'
import { filterHistoricalRequests, requestsToCsv } from '@/features/reports/request-report'

const base: TeamApprovalRequest = {
  id: 'request-1',
  requesterId: 'user-1',
  requesterName: 'Ana, PMO',
  requesterJobTitle: 'Analista',
  requesterAvatarUrl: null,
  teamName: 'Team Norte',
  requestedDate: '2026-09-25',
  startTime: '14:00:00',
  endTime: '15:00:00',
  permittedStartTime: '13:00:00',
  permittedEndTime: '15:00:00',
  reason: null,
  status: 'FINAL_APPROVED',
  approvalLevel: 'COMPLETED',
  priority: 70,
  createdAt: '2026-09-01T12:00:00Z',
  updatedAt: '2026-09-02T12:00:00Z',
  submittedAt: '2026-09-01T12:00:00Z',
  finalDecidedAt: '2026-09-02T12:00:00Z',
  usageConfirmedAt: null,
}

describe('reporte histórico de solicitudes', () => {
  it('combina filtros de periodo, equipo y estado', () => {
    const requests = [
      base,
      { ...base, id: 'request-2', teamName: 'Team Sur', status: 'REJECTED_BY_PORTFOLIO' as const },
      { ...base, id: 'request-3', requestedDate: '2026-10-09' },
    ]
    expect(
      filterHistoricalRequests(requests, {
        dateFrom: '2026-09-01',
        dateTo: '2026-09-30',
        teamName: 'Team Norte',
        status: 'FINAL_APPROVED',
      }).map((request) => request.id),
    ).toEqual(['request-1'])
  })

  it('genera CSV con cabecera y escapa comas', () => {
    const csv = requestsToCsv([base])
    expect(csv).toContain('"Fecha solicitada"')
    expect(csv).toContain('"Ana, PMO"')
    expect(csv).toContain('"FINAL_APPROVED"')
  })
})
