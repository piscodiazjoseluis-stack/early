import { supabase } from '@/lib/supabase/client'

import type { NotificationView } from '../data/collaborator-preview-data'

export type TeamWeeklyAssignment = {
  date: string
  assignment: null | {
    request_id: string
    date: string
    status: 'FINAL_APPROVED' | 'USED'
    person_name: string
    person_job_title: string
    person_avatar_url: string | null
    approved_by_name: string | null
    approved_at: string | null
  }
}

export async function getMyNotifications(): Promise<NotificationView[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) throw error
}

export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)

  if (error) throw error
}

export async function getMyTeamWeeklyAssignment(): Promise<TeamWeeklyAssignment> {
  const { data, error } = await supabase.rpc('get_my_team_weekly_assignment')
  if (error) throw error
  return data as unknown as TeamWeeklyAssignment
}

export async function updateMyProfile(input: {
  userId: string
  fullName: string
  timezone: string
}) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName.trim(),
      timezone: input.timezone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.userId)
    .select()
    .single()

  if (error) throw error
  return data
}
