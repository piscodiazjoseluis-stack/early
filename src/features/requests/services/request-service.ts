import { supabase } from '@/lib/supabase/client'

import type {
  EligibilityResult,
  CorrectedDepartureRequestInput,
  NewDepartureRequestInput,
  RequestFormContext,
  RequestView,
} from '../types'

type RequestQueryRow = {
  id: string
  requester_user_id: string
  requested_date: string
  requested_start_time: string
  requested_end_time: string
  reason: string | null
  status: RequestView['status']
  current_approval_level: RequestView['approvalLevel']
  rotation_priority: number | null
  created_at: string
  submitted_at: string | null
  cancellation_reason: string | null
  team: { name: string } | null
}

type RequestTrackingRow = {
  request_id: string
  team_leader_name: string | null
  portfolio_manager_name: string | null
  approvals: Array<{
    level: RequestView['approvalLevel']
    decision: NonNullable<RequestView['approvalHistory']>[number]['decision']
    comment: string | null
    decided_at: string
    approver_name: string
  }>
}

const requestSelection = `
  id,
  requester_user_id,
  requested_date,
  requested_start_time,
  requested_end_time,
  reason,
  status,
  current_approval_level,
  rotation_priority,
  created_at,
  submitted_at,
  cancellation_reason,
  team:teams!early_friday_requests_team_id_fkey(name)
`

export async function getMyRequests(): Promise<RequestView[]> {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) throw authError ?? new Error('Debe iniciar sesión')
  const [requestsResult, trackingResult] = await Promise.all([
    supabase
      .from('early_friday_requests')
      .select(requestSelection)
      .eq('requester_user_id', authData.user.id)
      .is('deleted_at', null)
      .order('requested_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.rpc('get_my_request_tracking', {}),
  ])

  if (requestsResult.error) throw requestsResult.error
  if (trackingResult.error) throw trackingResult.error
  return mergeTracking(
    (requestsResult.data as unknown as RequestQueryRow[]).map(mapRequest),
    trackingResult.data as unknown as RequestTrackingRow[],
  )
}

export async function getRequestById(requestId: string): Promise<RequestView> {
  const [requestResult, trackingResult] = await Promise.all([
    supabase
      .from('early_friday_requests')
      .select(requestSelection)
      .eq('id', requestId)
      .is('deleted_at', null)
      .single(),
    supabase.rpc('get_my_request_tracking', { target_request: requestId }),
  ])

  if (requestResult.error) throw requestResult.error
  if (trackingResult.error) throw trackingResult.error
  return mergeTracking(
    [mapRequest(requestResult.data as unknown as RequestQueryRow)],
    trackingResult.data as unknown as RequestTrackingRow[],
  )[0]
}

export async function getEligibility(userId: string, requestedDate: string) {
  const [eligibilityResult, priorityResult] = await Promise.all([
    supabase.rpc('get_user_eligibility', {
      target_user: userId,
      target_date: requestedDate,
    }),
    supabase.rpc('calculate_rotation_priority', {
      target_user: userId,
      target_date: requestedDate,
    }),
  ])
  if (eligibilityResult.error) throw eligibilityResult.error
  if (priorityResult.error) throw priorityResult.error
  return {
    ...(eligibilityResult.data as unknown as EligibilityResult),
    ...(priorityResult.data as unknown as EligibilityResult),
  }
}

export async function getRequestFormContext(
  requestedDate: string,
  departureTime: string,
): Promise<RequestFormContext> {
  const { data, error } = await supabase.rpc('get_request_form_context', {
    target_date: requestedDate,
    departure_time: departureTime,
  })
  if (error) throw new Error(translateRequestError(error.message))
  return data as unknown as RequestFormContext
}

export async function createRequest(input: NewDepartureRequestInput) {
  const { data, error } = await supabase.rpc('create_early_friday_departure_request', {
    target_date: input.requestedDate,
    departure_time: input.departureTime,
    request_reason: input.reason || undefined,
  })
  if (error) throw new Error(translateRequestError(error.message))
  return data
}

export async function cancelRequest(requestId: string, reason: string) {
  const { data, error } = await supabase.rpc('request_cancellation', {
    target_request: requestId,
    cancellation_reason: reason,
  })
  if (error) throw new Error(translateRequestError(error.message))
  return data
}

export async function confirmRequestUsage(
  requestId: string,
  usage: 'USED' | 'NOT_USED',
  notes?: string,
) {
  const { data, error } = await supabase.rpc('confirm_early_friday_usage', {
    target_request: requestId,
    usage_value: usage,
    usage_notes: notes?.trim() || undefined,
  })
  if (error) throw new Error(translateRequestError(error.message))
  return data
}

export async function resubmitReturnedRequest(
  requestId: string,
  input: CorrectedDepartureRequestInput,
) {
  const { data, error } = await supabase.rpc('resubmit_returned_departure_request', {
    target_request: requestId,
    target_date: input.requestedDate,
    departure_time: input.departureTime,
    request_reason: input.reason || undefined,
  })
  if (error) throw new Error(translateRequestError(error.message))
  return data
}

function mapRequest(row: RequestQueryRow): RequestView {
  return {
    id: row.id,
    requesterId: row.requester_user_id,
    requestedDate: row.requested_date,
    startTime: row.requested_start_time,
    endTime: row.requested_end_time,
    reason: row.reason,
    status: row.status,
    approvalLevel: row.current_approval_level,
    priority: row.rotation_priority,
    createdAt: row.created_at,
    submittedAt: row.submitted_at,
    cancellationReason: row.cancellation_reason,
    teamName: row.team?.name ?? 'Equipo no disponible',
  }
}

function mergeTracking(requests: RequestView[], tracking: RequestTrackingRow[]) {
  const trackingByRequest = new Map(tracking.map((item) => [item.request_id, item]))
  return requests.map((request) => {
    const item = trackingByRequest.get(request.id)
    if (!item) return request
    return {
      ...request,
      teamLeaderName: item.team_leader_name ?? undefined,
      portfolioManagerName: item.portfolio_manager_name ?? undefined,
      approvalHistory: item.approvals.map((approval) => ({
        level: approval.level,
        decision: approval.decision,
        comment: approval.comment,
        decidedAt: approval.decided_at,
        approverName: approval.approver_name,
      })),
    }
  })
}

function translateRequestError(message: string) {
  const knownErrors = [
    'Debe iniciar sesión',
    'No tiene una membresía de equipo activa',
    'No es elegible para la fecha seleccionada',
    'No existe un periodo activo para esa fecha',
    'La solicitud no puede cancelarse en su estado actual',
    'Solo puede corregir solicitudes propias devueltas',
    'La solicitud no está disponible para corrección',
    'El horario debe estar entre 13:00 y 15:30',
    'La hora propuesta debe estar dentro del horario permitido',
    'La hora propuesta debe ser anterior al límite del horario permitido',
    'Ya existe una solicitud activa para esa fecha',
    'La solicitud está fuera del plazo establecido',
  ]
  return (
    knownErrors.find((known) => message.includes(known)) ?? 'No pudimos completar la solicitud.'
  )
}
