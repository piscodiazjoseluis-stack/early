export type TeamMemberView = {
  membershipId: string
  userId: string
  fullName: string
  jobTitle: string
  avatarUrl: string | null
  isEligible: boolean
  eligibilityStatus?: 'eligible' | 'not_eligible' | 'under_review'
  participatesInRotation: boolean
  priority: 'alta' | 'media' | 'baja'
}

export type TeamView = {
  id: string
  code: string
  name: string
  description: string | null
  leaderUserId: string | null
  leaderName: string
  leaderJobTitle: string
  leaderAvatarUrl: string | null
  members: TeamMemberView[]
}
