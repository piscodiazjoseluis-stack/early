import { useQuery } from '@tanstack/react-query'
import { Check, Crown, ShieldCheck, UsersRound } from 'lucide-react'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getTeams } from '@/features/teams/services/team-service'
import type { TeamMemberView } from '@/features/teams/types'

import { collaboratorPreviewTeam } from '../data/collaborator-preview-data'

export function MyTeamPage({ preview = false }: { preview?: boolean }) {
  const { access } = useAuth()
  const teamsQuery = useQuery({
    queryKey: ['teams', 'my-team'],
    queryFn: getTeams,
    enabled: !preview && Boolean(access),
  })
  const team = preview
    ? collaboratorPreviewTeam
    : teamsQuery.data?.find(
        (item) =>
          item.leaderUserId === access?.profile.id ||
          item.members.some((member) => member.userId === access?.profile.id),
      )
  const currentUserId = preview ? 'preview-jose' : access?.profile.id

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1120px]">
        <header>
          <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">Mi equipo</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Consulta tu jefatura, integrantes y estado general de rotación.
          </p>
        </header>
        {team ? (
          <>
            <Card className="mt-6 p-5 sm:p-6">
              <CardHeader
                title={team.name}
                description={team.description ?? 'Equipo activo de PMO'}
                icon={<UsersRound className="size-5" />}
              />
              <div className="bg-info-soft mt-5 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
                <Avatar name={team.leaderName} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-primary font-extrabold">{team.leaderName}</p>
                    <Badge tone="info">
                      <Crown className="size-3" /> Jefe directo
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">{team.leaderJobTitle}</p>
                </div>
              </div>
            </Card>
            <Card className="mt-5 overflow-hidden">
              <div className="border-border border-b p-5 sm:p-6">
                <CardHeader
                  title="Integrantes"
                  description={`${team.members.length} personas en el equipo`}
                  icon={<UsersRound className="size-5" />}
                />
              </div>
              <div className="divide-border divide-y">
                {team.members.map((member) => (
                  <TeamMemberRow
                    key={member.userId}
                    member={member}
                    isCurrentUser={member.userId === currentUserId}
                  />
                ))}
              </div>
            </Card>
            <p className="text-muted-foreground mt-4 text-xs">
              Esta vista es informativa. Solo la jefatura o administración puede cambiar la
              configuración del equipo.
            </p>
          </>
        ) : (
          <Card className="mt-6 p-12 text-center">
            <UsersRound className="text-electric-blue mx-auto size-10" />
            <p className="text-primary mt-3 font-extrabold">Aún no tienes un equipo asignado</p>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}

function eligibilityPresentation(
  status: 'eligible' | 'not_eligible' | 'under_review' | undefined,
  eligible: boolean,
) {
  if (status === 'under_review') return { label: 'En evaluación', tone: 'warning' as const }
  if (status === 'not_eligible' || !eligible)
    return { label: 'No elegible', tone: 'danger' as const }
  return { label: 'Elegible', tone: 'success' as const }
}

export function MyTeamPreviewPage() {
  return <MyTeamPage preview />
}

function TeamMemberRow({
  member,
  isCurrentUser,
}: {
  member: TeamMemberView
  isCurrentUser: boolean
}) {
  const eligibility = eligibilityPresentation(member.eligibilityStatus, member.isEligible)
  return (
    <article className="hover:bg-info-soft/30 grid gap-4 p-5 transition sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <Avatar name={member.fullName} />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-primary text-sm font-extrabold">{member.fullName}</p>
          {isCurrentUser ? <Badge tone="info">Tú</Badge> : null}
        </div>
        <p className="text-muted-foreground mt-1 text-xs">{member.jobTitle}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge tone={eligibility.tone}>
          <ShieldCheck className="size-3" />
          {eligibility.label}
        </Badge>
        <Badge tone="neutral">Prioridad {member.priority}</Badge>
      </div>
    </article>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
  return (
    <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-[#f0e7e3] text-sm font-extrabold text-[#704435]">
      {initials}
      <span className="border-surface bg-success absolute right-0 bottom-0 grid size-4 place-items-center rounded-full border-2 text-white">
        <Check className="size-2.5" />
      </span>
    </span>
  )
}
