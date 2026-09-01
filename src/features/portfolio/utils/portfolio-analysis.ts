import type { TeamApprovalRequest } from '@/features/approvals/types'
import type { TeamView } from '@/features/teams/types'

export const approvedStatuses = new Set(['FINAL_APPROVED', 'USED', 'NOT_USED'])
export const rejectedStatuses = new Set(['REJECTED_BY_TEAM_LEADER', 'REJECTED_BY_PORTFOLIO'])
export const pendingStatuses = new Set([
  'PENDING_TEAM_LEADER',
  'APPROVED_BY_TEAM_LEADER',
  'PENDING_PORTFOLIO',
  'RETURNED_FOR_CORRECTION',
  'CANCELLATION_REQUESTED',
])
export const closedWithoutBenefitStatuses = new Set(['CANCELLED', 'EXPIRED'])
export const lowParticipationThreshold = 50

export function summarizeRequestStatuses(requests: Array<Pick<TeamApprovalRequest, 'status'>>) {
  const approved = requests.filter((request) => approvedStatuses.has(request.status)).length
  const inProgress = requests.filter((request) => pendingStatuses.has(request.status)).length
  const rejected = requests.filter((request) => rejectedStatuses.has(request.status)).length
  const closedWithoutBenefit = requests.filter((request) =>
    closedWithoutBenefitStatuses.has(request.status),
  ).length

  return {
    total: requests.length,
    approved,
    inProgress,
    rejected,
    closedWithoutBenefit,
    unclassified: requests.length - approved - inProgress - rejected - closedWithoutBenefit,
  }
}

export function filterPortfolioRequests(
  requests: TeamApprovalRequest[],
  dateFrom = '',
  dateTo = '',
) {
  return requests.filter(
    (request) =>
      (!dateFrom || request.requestedDate >= dateFrom) &&
      (!dateTo || request.requestedDate <= dateTo),
  )
}

export function portfolioPeople(teams: TeamView[]) {
  const people = teams.flatMap((team) => [
    ...(team.leaderUserId
      ? [
          {
            userId: team.leaderUserId,
            fullName: team.leaderName,
            jobTitle: team.leaderJobTitle,
            teamName: team.name,
            role: 'Jefe directo',
            isEligible: false,
            participatesInRotation: false,
          },
        ]
      : []),
    ...team.members.map((member) => ({
      userId: member.userId,
      fullName: member.fullName,
      jobTitle: member.jobTitle,
      teamName: team.name,
      role: 'Colaborador',
      isEligible: member.isEligible,
      participatesInRotation: member.participatesInRotation,
    })),
  ])
  return [...new Map(people.map((person) => [person.userId, person])).values()]
}

export function recommendPortfolioCandidate(
  people: ReturnType<typeof portfolioPeople>,
  requests: TeamApprovalRequest[],
  participation: Array<{ name: string; value: number }>,
) {
  const participationByTeam = new Map(
    participation.map((team) => [team.name.replace(/^Team\s+/i, ''), team.value]),
  )
  return people
    .filter((person) => person.isEligible && person.participatesInRotation)
    .map((person) => ({
      ...person,
      usos: requests.filter(
        (request) => request.requesterId === person.userId && request.status === 'USED',
      ).length,
      participation: participationByTeam.get(person.teamName.replace(/^Team\s+/i, '')) ?? 0,
    }))
    .toSorted(
      (left, right) =>
        left.usos - right.usos ||
        left.participation - right.participation ||
        left.fullName.localeCompare(right.fullName, 'es'),
    )[0]
}

export function teamParticipation(team: TeamView, requests: TeamApprovalRequest[]) {
  const people = [team.leaderUserId, ...team.members.map((member) => member.userId)].filter(Boolean)
  const benefited = new Set(
    requests
      .filter((request) => request.teamName === team.name && request.status === 'USED')
      .map((request) => request.requesterId),
  )
  return people.length ? Math.round((benefited.size / people.length) * 100) : 0
}

export function approvalSla(request: TeamApprovalRequest) {
  const enteredPortfolioAt = new Date(request.updatedAt ?? request.submittedAt ?? request.createdAt)
  const deadline = new Date(enteredPortfolioAt.getTime() + 24 * 60 * 60 * 1000)
  const elapsedHours = Math.max(0, (Date.now() - enteredPortfolioAt.getTime()) / 3_600_000)
  return { deadline, elapsedHours, critical: elapsedHours >= 24 }
}

export function weeklyEvolution(requests: TeamApprovalRequest[], weeks = 8) {
  const anchor = startOfWeek(new Date())
  return Array.from({ length: weeks }, (_, index) => {
    const start = new Date(anchor)
    start.setDate(anchor.getDate() - (weeks - index - 1) * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return {
      label: `${String(start.getDate()).padStart(2, '0')} ${new Intl.DateTimeFormat('es-PE', { month: 'short' }).format(start)}`,
      solicitudes: requests.filter((request) =>
        within(request.submittedAt ?? request.createdAt, start, end),
      ).length,
      aprobaciones: requests.filter(
        (request) =>
          approvedStatuses.has(request.status) &&
          request.finalDecidedAt &&
          within(request.finalDecidedAt, start, end),
      ).length,
    }
  })
}

function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = (result.getDay() + 6) % 7
  result.setDate(result.getDate() - day)
  result.setHours(0, 0, 0, 0)
  return result
}

function within(value: string, start: Date, end: Date) {
  const date = new Date(value)
  return date >= start && date < end
}
