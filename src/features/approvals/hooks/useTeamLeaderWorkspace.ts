import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { getTeams } from '@/features/teams/services/team-service'
import type { TeamView } from '@/features/teams/types'

import { approvalPreviewRequests } from '../data/approval-preview-data'
import { getTeamWorkspaceRequests } from '../services/approval-service'
import type { TeamApprovalRequest } from '../types'

const previewTeam: TeamView = {
  id: 'team-hugo-preview',
  code: 'TEAM_HUGO',
  name: 'Team Hugo Ramirez',
  description: 'Equipo de Project Management Office',
  leaderUserId: 'hugo-preview',
  leaderName: 'Hugo Ramirez',
  leaderJobTitle: 'Project Analyst',
  leaderAvatarUrl: null,
  members: [
    {
      membershipId: 'jose-membership',
      userId: 'jose',
      fullName: 'Jose Pisco',
      jobTitle: 'Project Associate',
      avatarUrl: null,
      isEligible: true,
      eligibilityStatus: 'eligible',
      participatesInRotation: true,
      priority: 'alta',
    },
    {
      membershipId: 'valeria-membership',
      userId: 'valeria',
      fullName: 'Valeria Cabrera',
      jobTitle: 'Practicante / PMO',
      avatarUrl: null,
      isEligible: true,
      eligibilityStatus: 'under_review',
      participatesInRotation: true,
      priority: 'media',
    },
  ],
}

export function useTeamLeaderWorkspace(preview = false) {
  const { access } = useAuth()
  const query = useQuery({
    queryKey: ['team-leader-workspace', access?.profile.id],
    queryFn: async () => {
      const [requests, teams] = await Promise.all([getTeamWorkspaceRequests(), getTeams()])
      return {
        requests,
        team: teams.find((team) => team.leaderUserId === access?.profile.id),
      }
    },
    enabled: !preview && Boolean(access?.profile.id),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })

  return {
    requests: preview ? approvalPreviewRequests : (query.data?.requests ?? []),
    team: preview ? previewTeam : query.data?.team,
    isLoading: !preview && query.isLoading,
    error: query.error,
  } satisfies {
    requests: TeamApprovalRequest[]
    team: TeamView | undefined
    isLoading: boolean
    error: Error | null
  }
}
