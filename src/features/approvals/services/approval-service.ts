import { supabase } from '@/lib/supabase/client'

import type { TeamApprovalRequest } from '../types'

type ApprovalQueryRow = {
  id: string
  requester_user_id: string
  requested_date: string
  requested_start_time: string
  requested_end_time: string
  reason: string | null
  status: TeamApprovalRequest['status']
  current_approval_level: TeamApprovalRequest['approvalLevel']
  rotation_priority: number | null
  created_at: string
  updated_at: string
  submitted_at: string | null
  final_decided_at: string | null
  usage_confirmed_at: string | null
  requester: { full_name: string; job_title: string; avatar_url: string | null } | null
  team: { name: string } | null
  period: { default_start_time: string; default_end_time: string } | null
}

const approvalSelection = `
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
  updated_at,
  submitted_at,
  final_decided_at,
  usage_confirmed_at,
  requester:profiles!early_friday_requests_requester_user_id_fkey(full_name, job_title, avatar_url),
  team:teams!early_friday_requests_team_id_fkey(name),
  period:early_friday_periods!early_friday_requests_period_id_fkey(default_start_time, default_end_time)
`

export async function getTeamApprovalRequests(): Promise<TeamApprovalRequest[]> {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) throw authError ?? new Error('Debe iniciar sesión')

  const { data, error } = await supabase
    .from('early_friday_requests')
    .select(approvalSelection)
    .neq('requester_user_id', authData.user.id)
    .is('deleted_at', null)
    .order('requested_date', { ascending: true })

  if (error) throw error
  return (data as unknown as ApprovalQueryRow[]).map(mapApprovalRequest)
}

export async function getTeamWorkspaceRequests(): Promise<TeamApprovalRequest[]> {
  const { data, error } = await supabase
    .from('early_friday_requests')
    .select(approvalSelection)
    .is('deleted_at', null)
    .order('requested_date', { ascending: true })

  if (error) throw error
  return (data as unknown as ApprovalQueryRow[]).map(mapApprovalRequest)
}

export async function getPortfolioApprovalRequests(): Promise<TeamApprovalRequest[]> {
  const { data, error } = await supabase
    .from('early_friday_requests')
    .select(approvalSelection)
    .is('deleted_at', null)
    .order('requested_date', { ascending: true })

  if (error) throw error
  return (data as unknown as ApprovalQueryRow[]).map(mapApprovalRequest)
}

export async function getTeamApprovalRequest(requestId: string) {
  const { data, error } = await supabase
    .from('early_friday_requests')
    .select(approvalSelection)
    .eq('id', requestId)
    .is('deleted_at', null)
    .single()

  if (error) throw error
  return mapApprovalRequest(data as unknown as ApprovalQueryRow)
}

export async function approveAsTeamLeader(requestId: string) {
  const { data, error } = await supabase.rpc('approve_request_as_team_leader', {
    target_request: requestId,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function approveAsPortfolio(requestId: string) {
  const { data, error } = await supabase.rpc('approve_request_as_portfolio', {
    target_request: requestId,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function rejectAsTeamLeader(requestId: string, reason: string, comment: string) {
  const { data, error } = await supabase.rpc('reject_request', {
    target_request: requestId,
    rejection_reason: reason,
    rejection_comment: comment,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function returnForCorrectionAsTeamLeader(
  requestId: string,
  reason: string,
  comment: string,
) {
  const { data, error } = await supabase.rpc('return_request_for_correction', {
    target_request: requestId,
    return_reason: reason,
    return_comment: comment,
  })
  if (error) throw new Error(error.message)
  return data
}

function mapApprovalRequest(row: ApprovalQueryRow): TeamApprovalRequest {
  return {
    id: row.id,
    requesterId: row.requester_user_id,
    requesterName: row.requester?.full_name ?? 'Colaborador',
    requesterJobTitle: row.requester?.job_title ?? 'Sin cargo registrado',
    requesterAvatarUrl: row.requester?.avatar_url ?? null,
    teamName: row.team?.name ?? 'Equipo no disponible',
    requestedDate: row.requested_date,
    startTime: row.requested_start_time,
    endTime: row.requested_end_time,
    permittedStartTime: row.period?.default_start_time ?? '13:00:00',
    permittedEndTime: row.period?.default_end_time ?? '15:00:00',
    reason: row.reason,
    status: row.status,
    approvalLevel: row.current_approval_level,
    priority: row.rotation_priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    finalDecidedAt: row.final_decided_at,
    usageConfirmedAt: row.usage_confirmed_at,
  }
}
