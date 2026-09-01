import type { RequestStatus } from '../types'

export const requestStatusPresentation: Record<
  RequestStatus,
  { label: string; tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  DRAFT: { label: 'Borrador', tone: 'neutral' },
  PENDING_TEAM_LEADER: { label: 'Pendiente del jefe', tone: 'warning' },
  RETURNED_FOR_CORRECTION: { label: 'Requiere corrección', tone: 'warning' },
  APPROVED_BY_TEAM_LEADER: { label: 'Aprobada por el jefe', tone: 'info' },
  PENDING_PORTFOLIO: { label: 'Pendiente de Portfolio', tone: 'warning' },
  REJECTED_BY_TEAM_LEADER: { label: 'Rechazada por el jefe', tone: 'danger' },
  REJECTED_BY_PORTFOLIO: { label: 'Rechazada por Portfolio', tone: 'danger' },
  FINAL_APPROVED: { label: 'Aprobada', tone: 'success' },
  CANCELLATION_REQUESTED: { label: 'Cancelación solicitada', tone: 'warning' },
  CANCELLED: { label: 'Cancelada', tone: 'neutral' },
  USED: { label: 'Utilizado', tone: 'success' },
  NOT_USED: { label: 'No utilizado', tone: 'neutral' },
  EXPIRED: { label: 'Vencida', tone: 'danger' },
}

export function canCancelRequest(status: RequestStatus) {
  return [
    'PENDING_TEAM_LEADER',
    'RETURNED_FOR_CORRECTION',
    'APPROVED_BY_TEAM_LEADER',
    'PENDING_PORTFOLIO',
    'FINAL_APPROVED',
  ].includes(status)
}

export const activeRequestStatuses: RequestStatus[] = [
  'DRAFT',
  'PENDING_TEAM_LEADER',
  'RETURNED_FOR_CORRECTION',
  'APPROVED_BY_TEAM_LEADER',
  'PENDING_PORTFOLIO',
  'CANCELLATION_REQUESTED',
  'FINAL_APPROVED',
]

export const terminalRequestStatuses: RequestStatus[] = [
  'REJECTED_BY_TEAM_LEADER',
  'REJECTED_BY_PORTFOLIO',
  'CANCELLED',
  'USED',
  'NOT_USED',
  'EXPIRED',
]

export function isActiveRequest(status: RequestStatus) {
  return activeRequestStatuses.includes(status)
}

export function isTerminalRequest(status: RequestStatus) {
  return terminalRequestStatuses.includes(status)
}

export function requestStageSummary(request: {
  status: RequestStatus
  requestedDate?: string
  endTime?: string
  teamLeaderName?: string
  portfolioManagerName?: string
}) {
  switch (request.status) {
    case 'DRAFT':
      return { stage: 'Borrador', responsible: 'ti' }
    case 'PENDING_TEAM_LEADER':
      return {
        stage: 'Revisión del jefe directo',
        responsible: request.teamLeaderName ?? 'Jefe directo',
      }
    case 'RETURNED_FOR_CORRECTION':
      return { stage: 'Corrección requerida', responsible: 'ti' }
    case 'APPROVED_BY_TEAM_LEADER':
    case 'PENDING_PORTFOLIO':
      return {
        stage: 'Revisión de Portfolio',
        responsible: request.portfolioManagerName ?? 'Portfolio Manager',
      }
    case 'CANCELLATION_REQUESTED':
      return {
        stage: 'Revisión de cancelación',
        responsible: request.portfolioManagerName ?? 'Portfolio Manager',
      }
    case 'FINAL_APPROVED':
      return isUsageConfirmationDue(request.requestedDate, request.endTime)
        ? { stage: 'Confirmación de uso', responsible: 'ti' }
        : { stage: 'Beneficio programado', responsible: 'Sin acción hasta el viernes solicitado' }
    default:
      return { stage: 'Proceso finalizado', responsible: 'Sin acción pendiente' }
  }
}

export function isUsageConfirmationDue(
  requestedDate?: string,
  endTimeOrToday: string | Date = '23:59:59',
  today = new Date(),
) {
  if (!requestedDate) return false
  const endTime = endTimeOrToday instanceof Date ? '00:00:00' : endTimeOrToday
  const reference = endTimeOrToday instanceof Date ? endTimeOrToday : today
  return reference.getTime() >= new Date(`${requestedDate}T${endTime}`).getTime()
}
