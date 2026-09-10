import { supabase } from '@/lib/supabase/client'

import { getPortfolioApprovalRequests } from '@/features/approvals/services/approval-service'
import { getTeams } from '@/features/teams/services/team-service'

export async function getPortfolioWorkspace() {
  const [requests, teams] = await Promise.all([getPortfolioApprovalRequests(), getTeams()])
  return { requests, teams }
}

export async function getPortfolioAudit() {
  const { data, error } = await supabase
    .from('request_approvals')
    .select(
      `
      id, level, decision, reason_code, comment, decided_at,
      approver:profiles!request_approvals_approver_user_id_fkey(full_name),
      requester:profiles!request_approvals_requester_user_id_fkey(full_name),
      request:early_friday_requests!request_approvals_request_id_fkey(requested_date)
    `,
    )
    .order('decided_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data
}

export async function getClientErrorEvents() {
  const { data, error } = await supabase
    .from('client_error_events')
    .select('id, occurred_at, route, source, message, release, user:profiles(full_name)')
    .order('occurred_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data
}
