import { supabase } from '@/lib/supabase/client'

import type { TeamView } from '../types'

type TeamQueryRow = {
  id: string
  code: string
  name: string
  description: string | null
  leader_user_id: string | null
  leader: { full_name: string; job_title: string; avatar_url: string | null } | null
  team_members: Array<{
    id: string
    user_id: string
    is_eligible: boolean
    participates_in_rotation: boolean
    profile: { full_name: string; job_title: string; avatar_url: string | null } | null
  }>
}

export async function getTeams(): Promise<TeamView[]> {
  const { data, error } = await supabase
    .from('teams')
    .select(
      `
        id,
        code,
        name,
        description,
        leader_user_id,
        leader:profiles!teams_leader_user_id_fkey(full_name, job_title, avatar_url),
        team_members!team_members_team_id_fkey(
          id,
          user_id,
          is_eligible,
          participates_in_rotation,
          profile:profiles!team_members_user_id_fkey(full_name, job_title, avatar_url)
        )
      `,
    )
    .eq('is_active', true)
    .is('deleted_at', null)
    .is('team_members.valid_until', null)
    .order('name')

  if (error) throw error

  return (data as unknown as TeamQueryRow[]).map((team) => ({
    id: team.id,
    code: team.code,
    name: team.name,
    description: team.description,
    leaderUserId: team.leader_user_id,
    leaderName: team.leader?.full_name ?? 'Jefatura por asignar',
    leaderJobTitle: team.leader?.job_title ?? 'Sin cargo registrado',
    leaderAvatarUrl: team.leader?.avatar_url ?? null,
    members: team.team_members
      .filter((member) => member.user_id !== team.leader_user_id)
      .map((member, index) => ({
        membershipId: member.id,
        userId: member.user_id,
        fullName: member.profile?.full_name ?? 'Perfil no disponible',
        jobTitle: member.profile?.job_title ?? 'Sin cargo registrado',
        avatarUrl: member.profile?.avatar_url ?? null,
        isEligible: member.is_eligible,
        eligibilityStatus: member.is_eligible ? 'eligible' : 'not_eligible',
        participatesInRotation: member.participates_in_rotation,
        priority: index === 0 ? 'alta' : index === 1 ? 'media' : 'baja',
      })),
  }))
}

export async function assignOrMoveTeamMember(input: {
  teamId: string
  userId: string
  isEligible: boolean
  participatesInRotation: boolean
}) {
  const { data, error } = await supabase.rpc('assign_or_move_team_member', {
    target_team: input.teamId,
    target_user: input.userId,
    eligible: input.isEligible,
    joins_rotation: input.participatesInRotation,
  })
  if (error) throw error
  return data
}

export async function configureTeamMember(input: {
  membershipId: string
  isEligible: boolean
  participatesInRotation: boolean
}) {
  const { data, error } = await supabase.rpc('configure_team_member', {
    target_membership: input.membershipId,
    eligible: input.isEligible,
    joins_rotation: input.participatesInRotation,
  })
  if (error) throw error
  return data
}

export async function assignTeamLeader(teamId: string, userId: string) {
  const { data, error } = await supabase.rpc('assign_team_leader', {
    target_team: teamId,
    target_user: userId,
  })
  if (error) throw error
  return data
}

export async function createTeam(input: { code: string; name: string; description?: string }) {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      code: input.code.trim().toUpperCase().replaceAll(/\s+/g, '_'),
      name: input.name.trim(),
      description: input.description?.trim() || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTeam(
  teamId: string,
  input: { name: string; description?: string; isActive?: boolean },
) {
  const { data, error } = await supabase
    .from('teams')
    .update({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      is_active: input.isActive ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', teamId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getAvailableProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, job_title')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('full_name')
  if (error) throw error
  return data
}
