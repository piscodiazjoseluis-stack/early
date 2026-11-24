import type { TeamApprovalRequest } from '@/features/approvals/types'

export type RequestReportFilters = {
  dateFrom?: string
  dateTo?: string
  teamName?: string
  status?: TeamApprovalRequest['status'] | ''
}

export function filterHistoricalRequests(
  requests: TeamApprovalRequest[],
  filters: RequestReportFilters,
) {
  return requests.filter((request) => {
    if (filters.dateFrom && request.requestedDate < filters.dateFrom) return false
    if (filters.dateTo && request.requestedDate > filters.dateTo) return false
    if (filters.teamName && request.teamName !== filters.teamName) return false
    if (filters.status && request.status !== filters.status) return false
    return true
  })
}

export function requestsToCsv(requests: TeamApprovalRequest[]) {
  const header = [
    'ID',
    'Fecha solicitada',
    'Solicitante',
    'Equipo',
    'Hora de salida',
    'Estado',
    'Nivel de aprobación',
    'Fecha de registro',
    'Fecha de decisión final',
  ]
  const rows = requests.map((request) => [
    request.id,
    request.requestedDate,
    request.requesterName,
    request.teamName,
    request.startTime.slice(0, 5),
    request.status,
    request.approvalLevel,
    request.createdAt,
    request.finalDecidedAt ?? '',
  ])
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
}

export function downloadRequestsCsv(requests: TeamApprovalRequest[], fileName: string) {
  const blob = new Blob([`\uFEFF${requestsToCsv(requests)}`], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function csvCell(value: string) {
  // Quoting alone does not stop Excel from evaluating untrusted cell formulas.
  const safeValue = /^[=+@\-\t\r\n]/.test(value) ? `'${value}` : value
  return `"${safeValue.replaceAll('"', '""')}"`
}
