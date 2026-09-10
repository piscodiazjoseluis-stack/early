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

export type RequestedFridayEvolutionPoint = {
  date: string
  label: string
  solicitudes: number
  aprobaciones: number
}

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

export function resolvedApprovalRate(
  requests: Array<Pick<TeamApprovalRequest, 'status'>>,
) {
  const { approved, rejected } = summarizeRequestStatuses(requests)
  const resolved = approved + rejected
  return resolved ? Math.round((approved / resolved) * 100) : 0
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

export function requestedFridayEvolution(requests: TeamApprovalRequest[]) {
  if (!requests.length) return []

  const byRequestedDate = new Map<string, { solicitudes: number; aprobaciones: number }>()
  requests.forEach((request) => {
    const current = byRequestedDate.get(request.requestedDate) ?? {
      solicitudes: 0,
      aprobaciones: 0,
    }
    current.solicitudes += 1
    if (approvedStatuses.has(request.status)) current.aprobaciones += 1
    byRequestedDate.set(request.requestedDate, current)
  })

  const requestedDates = [...byRequestedDate.keys()].sort()
  const firstIsoDate = requestedDates[0]
  const lastIsoDate = requestedDates[requestedDates.length - 1]
  if (!firstIsoDate || !lastIsoDate) return []
  const first = parseIsoDate(firstIsoDate)
  const last = parseIsoDate(lastIsoDate)
  const result: RequestedFridayEvolutionPoint[] = []

  for (const date = first; date <= last; date.setUTCDate(date.getUTCDate() + 7)) {
    const isoDate = date.toISOString().slice(0, 10)
    const values = byRequestedDate.get(isoDate) ?? { solicitudes: 0, aprobaciones: 0 }
    result.push({
      date: isoDate,
      label: new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: 'short',
        timeZone: 'UTC',
      }).format(date),
      ...values,
    })
  }

  return result
}

function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}
