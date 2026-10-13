import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  ShieldCheck,
  UsersRound,
  Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getMyTeamWeeklyAssignment } from '@/features/collaborator/services/collaborator-service'
import { requestPreviewData } from '@/features/requests/data/request-preview-data'
import { getEligibility, getMyRequests } from '@/features/requests/services/request-service'
import type { RequestView } from '@/features/requests/types'
import { requestStatusPresentation } from '@/features/requests/utils/request-status'
import {
  isActiveRequest,
  isUsageConfirmationDue,
  requestStageSummary,
} from '@/features/requests/utils/request-status'
import { getTeams } from '@/features/teams/services/team-service'

const previewRecentRequests = requestPreviewData.slice(0, 4)

export function VisualSystemPage({ preview = false }: { preview?: boolean }) {
  const navigate = useNavigate()
  const { access } = useAuth()
  const nextFriday = preview ? '2025-05-23' : getUpcomingFriday()
  const teamsQuery = useQuery({
    queryKey: ['teams', 'collaborator-dashboard'],
    queryFn: getTeams,
    enabled: !preview && Boolean(access),
  })
  const currentTeam = teamsQuery.data?.find(
    (team) =>
      team.leaderUserId === access?.profile.id ||
      team.members.some((member) => member.userId === access?.profile.id),
  )
  const requestsQuery = useQuery({
    queryKey: ['my-requests', 'collaborator-dashboard'],
    queryFn: getMyRequests,
    enabled: !preview && Boolean(access),
  })
  const eligibilityQuery = useQuery({
    queryKey: ['eligibility', access?.profile.id, nextFriday, 'dashboard'],
    queryFn: () => getEligibility(access?.profile.id ?? '', nextFriday),
    enabled: !preview && Boolean(access?.profile.id),
  })
  const assignmentQuery = useQuery({
    queryKey: ['my-team-weekly-assignment'],
    queryFn: getMyTeamWeeklyAssignment,
    enabled: !preview && Boolean(access),
  })
  const dashboardRequests = preview ? requestPreviewData : (requestsQuery.data ?? [])
  const recentRequests = preview ? previewRecentRequests : dashboardRequests.slice(0, 4)
  const usedRequests = dashboardRequests.filter((request) => request.status === 'USED')
  const latestUsed = usedRequests[0]
  const eligible = preview ? true : eligibilityQuery.data?.eligible
  const assignment = preview
    ? {
        date: '2025-05-16',
        person_name: 'Valeria Cabrera',
        person_job_title: 'Practicante / PMO',
        approved_by_name: 'Hugo Ramirez',
        approved_at: '2025-05-12T14:15:00Z',
      }
    : assignmentQuery.data?.assignment

  const activeRequests = dashboardRequests.filter((request) => isActiveRequest(request.status))
  const correctionRequest = activeRequests.find(
    (request) => request.status === 'RETURNED_FOR_CORRECTION',
  )
  const usageRequest = activeRequests.find(
    (request) =>
      request.status === 'FINAL_APPROVED' &&
      isUsageConfirmationDue(request.requestedDate, request.endTime),
  )
  const priorityRequest = correctionRequest ?? usageRequest ?? activeRequests[0]
  const firstName = preview
    ? 'Jose'
    : (access?.profile.full_name?.trim().split(/\s+/)[0] ?? 'Colaborador')
  const primaryActionLabel = correctionRequest
    ? 'Corregir solicitud'
    : usageRequest
      ? 'Confirmar uso'
      : 'Crear solicitud'
  const primaryActionPath = priorityRequest
    ? preview
      ? `/sistema-visual/solicitudes/${priorityRequest.id}`
      : `/solicitudes/${priorityRequest.id}`
    : preview
      ? '/sistema-visual/solicitudes/nueva'
      : '/solicitudes/nueva'

  return (
    <AppLayout>
      <div className="collab-dashboard mx-auto max-w-[1420px]">
        <header className="collab-page-heading">
          <div>
            <h1>Hola, {firstName}</h1>
            <p>Revisa tu próxima acción y el avance de tus solicitudes.</p>
          </div>
          <button
            type="button"
            className="collab-quiet-link"
            onClick={() =>
              void navigate(preview ? '/sistema-visual/reglas-ayuda' : '/reglas-ayuda')
            }
          >
            Consultar reglas <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </header>

        <section className="collab-command-panel" aria-labelledby="collab-command-title">
          <div className="collab-command-copy">
            <span className={`collab-command-symbol ${eligible ? 'is-success' : 'is-warning'}`}>
              {eligible ? <CheckCircle2 aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
            </span>
            <div>
              <h2 id="collab-command-title">
                {correctionRequest
                  ? 'Tienes una solicitud por corregir'
                  : usageRequest
                    ? 'Confirma si utilizaste tu Early Friday'
                    : eligible
                      ? 'Estás listo para solicitar'
                      : 'Revisa tu elegibilidad antes de solicitar'}
              </h2>
              <p>
                {correctionRequest
                  ? 'El flujo está pausado hasta que revises la observación y reenvíes la solicitud.'
                  : usageRequest
                    ? 'La aprobación ya terminó. Falta registrar el uso real del beneficio.'
                    : `La próxima fecha disponible es ${formatShortDate(nextFriday)}.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="collab-primary-action"
            onClick={() => void navigate(primaryActionPath, { state: { from: 'dashboard' } })}
          >
            {primaryActionLabel} <ArrowRight className="size-4" aria-hidden="true" />
          </button>
          <dl className="collab-command-facts">
            <div>
              <dt>Solicitudes activas</dt>
              <dd>{activeRequests.length}</dd>
            </div>
            <div>
              <dt>Usos confirmados</dt>
              <dd>{preview ? 2 : usedRequests.length}</dd>
            </div>
            <div>
              <dt>Último uso</dt>
              <dd>
                {preview
                  ? '09 may.'
                  : latestUsed
                    ? formatCompactDate(latestUsed.requestedDate)
                    : 'Sin uso'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="collab-dashboard-grid">
          <Card className="collab-request-stream">
            <div className="collab-section-heading">
              <div>
                <h2>Solicitudes recientes</h2>
                <p>Cada registro muestra la etapa y quién tiene la siguiente decisión.</p>
              </div>
              <button
                type="button"
                className="collab-quiet-link"
                onClick={() =>
                  void navigate(preview ? '/sistema-visual/solicitudes' : '/solicitudes')
                }
              >
                Ver todas <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="collab-request-list">
              {recentRequests.map((request) => {
                const stage = requestStageSummary(request)
                const presentation = requestStatusPresentation[request.status]
                return (
                  <button
                    key={request.id}
                    type="button"
                    className="collab-request-item"
                    onClick={() =>
                      void navigate(
                        preview
                          ? `/sistema-visual/solicitudes/${request.id}`
                          : `/solicitudes/${request.id}`,
                        { state: { from: 'dashboard' } },
                      )
                    }
                  >
                    <span className="collab-date-block">
                      <strong>{new Date(`${request.requestedDate}T12:00:00`).getDate()}</strong>
                      <span>{formatMonthYear(request.requestedDate)}</span>
                    </span>
                    <span className="collab-request-copy">
                      <strong>{request.reason || 'Solicitud de Early Friday'}</strong>
                      <span>
                        {stage.stage} · {approvalActor(request)}
                      </span>
                    </span>
                    <Badge tone={presentation.tone}>{presentation.label}</Badge>
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          </Card>

          <div className="collab-dashboard-side">
            <Card className="collab-week-card">
              <div className="collab-section-heading is-compact">
                <div>
                  <h2>Asignación del equipo</h2>
                </div>
                <CalendarCheck className="size-5" aria-hidden="true" />
              </div>
              <div className="collab-week-assignment">
                <div className="collab-week-date">
                  <strong>
                    {new Date(
                      `${assignment?.date ?? assignmentQuery.data?.date ?? nextFriday}T12:00:00`,
                    ).getDate()}
                  </strong>
                  <span>
                    {formatMonthYear(assignment?.date ?? assignmentQuery.data?.date ?? nextFriday)}
                  </span>
                </div>
                <div>
                  <p>{assignment?.person_name ?? 'Sin asignación confirmada'}</p>
                  <span>
                    {assignment?.person_job_title ?? 'El cupo aún no tiene aprobación final.'}
                  </span>
                  {assignment ? <Badge tone="success">Aprobado</Badge> : null}
                </div>
              </div>
              <button
                type="button"
                className="collab-quiet-link"
                onClick={() =>
                  void navigate(preview ? '/sistema-visual/calendario' : '/calendario')
                }
              >
                Abrir calendario <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </Card>

            <Card className="collab-team-card">
              <div className="collab-section-heading is-compact">
                <div>
                  <h2>{preview ? 'Team Hugo Ramirez' : (currentTeam?.name ?? 'Mi equipo')}</h2>
                  <p>
                    Jefe directo:{' '}
                    {preview ? 'Hugo Ramirez' : (currentTeam?.leaderName ?? 'Por asignar')}
                  </p>
                </div>
                <UsersRound className="size-5" aria-hidden="true" />
              </div>
              <div className="collab-team-stack">
                {preview ? (
                  <>
                    <TeamMember
                      initials="HR"
                      name="Hugo Ramirez"
                      role="Project Analyst"
                      badge="Jefe"
                    />
                    <TeamMember
                      initials="JP"
                      name="Jose Pisco"
                      role="Practicante / PMO"
                      badge="Tú"
                    />
                    <TeamMember
                      initials="VC"
                      name="Valeria Cabrera"
                      role="Practicante / PMO"
                      presence="away"
                    />
                  </>
                ) : (
                  currentTeam?.members
                    .slice(0, 3)
                    .map((member) => (
                      <TeamMember
                        key={member.membershipId}
                        initials={getInitials(member.fullName)}
                        name={member.fullName}
                        role={member.jobTitle}
                        badge={
                          member.userId === access?.profile.id
                            ? 'Tú'
                            : member.userId === currentTeam.leaderUserId
                              ? 'Jefe'
                              : undefined
                        }
                      />
                    ))
                )}
              </div>
              <button
                type="button"
                className="collab-quiet-link"
                onClick={() => void navigate(preview ? '/sistema-visual/mi-equipo' : '/mi-equipo')}
              >
                Ver mi equipo <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </Card>
          </div>
        </section>

        <footer className="border-border text-muted-foreground mt-6 flex flex-col items-center justify-center gap-3 border-t py-5 text-xs sm:flex-row sm:gap-10">
          <span className="flex items-center gap-2">
            <ShieldCheck className="text-electric-blue size-4" />
            Acceso seguro y protegido con Supabase Authentication.
          </span>
          <span className="bg-border hidden h-5 w-px sm:block" />
          <span className="flex items-center gap-2">
            <Zap className="text-success size-4 fill-current" />
            Supabase
          </span>
        </footer>
      </div>
    </AppLayout>
  )
}

export function VisualSystemPreviewPage() {
  return <VisualSystemPage preview />
}

function PresenceAvatar({
  initials,
  tone = 'sand',
  presence = 'online',
}: {
  initials: string
  tone?: 'sand' | 'coral'
  presence?: 'online' | 'away'
}) {
  return (
    <span
      className={`relative grid size-11 shrink-0 place-items-center rounded-full text-sm font-extrabold ${
        tone === 'coral' ? 'bg-[#ffe1d9] text-[#934631]' : 'bg-[#f0e7e3] text-[#704435]'
      }`}
    >
      {initials}
      <span
        className={`border-surface absolute right-0 bottom-0 grid size-4 place-items-center rounded-full border-2 text-white ${
          presence === 'online' ? 'bg-success' : 'bg-warning'
        }`}
        aria-label={presence === 'online' ? 'Disponible' : 'Ausente'}
        title={presence === 'online' ? 'Disponible' : 'Ausente'}
      >
        {presence === 'online' ? <Check className="size-2.5" strokeWidth={3} /> : null}
      </span>
    </span>
  )
}

function TeamMember({
  initials,
  name,
  role,
  badge,
  presence = 'online',
}: {
  initials: string
  name: string
  role: string
  badge?: string
  presence?: 'online' | 'away'
}) {
  return (
    <div className="border-border hover:border-electric-blue/35 hover:bg-info-soft/30 flex items-center gap-3 rounded-xl border p-3 transition">
      <PresenceAvatar initials={initials} presence={presence} />
      <div className="min-w-0">
        <p className="text-primary truncate text-sm font-extrabold">{name}</p>
        <p className="text-muted-foreground truncate text-xs">{role}</p>
      </div>
      {badge ? (
        <Badge tone="info" className="ml-auto">
          {badge}
        </Badge>
      ) : null}
    </div>
  )
}

function getUpcomingFriday() {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + ((5 - date.getDay() + 7) % 7))
  return date.toISOString().slice(0, 10)
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function formatCompactDate(date: string) {
  const value = date.includes('T') ? new Date(date) : new Date(`${date}T12:00:00`)
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value)
}

function formatMonthYear(date: string) {
  return new Intl.DateTimeFormat('es-PE', { month: 'short', year: 'numeric' })
    .format(new Date(`${date}T12:00:00`))
    .toUpperCase()
}

function approvalActor(request: RequestView) {
  const approval = request.approvalHistory?.findLast((item) =>
    ['APPROVED', 'REJECTED', 'RETURNED_FOR_CORRECTION'].includes(item.decision),
  )
  if (approval) return approval.approverName
  if (request.status === 'PENDING_TEAM_LEADER') return request.teamLeaderName ?? 'Jefe directo'
  if (['PENDING_PORTFOLIO', 'APPROVED_BY_TEAM_LEADER'].includes(request.status))
    return request.portfolioManagerName ?? 'Portfolio Manager'
  return 'Sin decisión registrada'
}
