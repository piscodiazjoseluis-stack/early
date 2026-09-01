import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  UsersRound,
  Zap,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getMyTeamWeeklyAssignment } from '@/features/collaborator/services/collaborator-service'
import { requestPreviewData } from '@/features/requests/data/request-preview-data'
import { getEligibility, getMyRequests } from '@/features/requests/services/request-service'
import type { RequestView } from '@/features/requests/types'
import { requestStatusPresentation } from '@/features/requests/utils/request-status'
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

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1420px]">
        <section
          aria-label="Indicadores principales"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <MetricCard
            title="Estado de elegibilidad"
            icon={<CheckCircle2 className="size-6" />}
            accent={eligible ? 'success' : 'blue'}
            value={
              eligibilityQuery.isLoading && !preview
                ? 'Evaluando...'
                : eligible
                  ? 'Eres elegible'
                  : 'Requiere revisión'
            }
            detail={
              preview
                ? 'Cumples con todos los requisitos para acceder al beneficio.'
                : eligible
                  ? 'Cumples con los requisitos actuales para la próxima fecha.'
                  : 'Consulta las validaciones antes de solicitar.'
            }
            action="Ver detalles"
            onClick={() =>
              void navigate(preview ? '/sistema-visual/elegibilidad' : '/elegibilidad')
            }
          />
          <MetricCard
            title="Último Early utilizado"
            icon={<CalendarDays className="size-6" />}
            accent="blue"
            value={
              preview
                ? 'vie, 09 may 2025'
                : latestUsed
                  ? formatShortDate(latestUsed.requestedDate)
                  : 'Sin registros'
            }
            detail={
              preview
                ? 'Aprobado por Hugo Ramirez'
                : latestUsed
                  ? approvalSummary(latestUsed)
                  : 'Todavía no registras beneficios utilizados.'
            }
            action="Ver historial"
            onClick={() => void navigate(preview ? '/sistema-visual/historial' : '/historial')}
          />
          <MetricCard
            title="Total utilizados en el período"
            icon={<span className="text-3xl font-extrabold">2</span>}
            accent="blue"
            value={
              <span className="flex items-baseline gap-2">
                <span className="text-electric-blue text-4xl font-extrabold">
                  {preview ? 2 : usedRequests.length}
                </span>
                <span className="text-muted-foreground text-sm font-bold">de 6</span>
              </span>
            }
            detail={
              preview
                ? 'Período: may 2025 – abr 2026'
                : 'Solo se contabilizan beneficios confirmados como utilizados.'
            }
            action="Ver detalle del período"
            hideIcon
            onClick={() => void navigate(preview ? '/sistema-visual/historial' : '/historial')}
          />
          <MetricCard
            title="Próxima oportunidad"
            icon={<Clock3 className="size-6" />}
            accent="blue"
            value={formatShortDate(nextFriday)}
            detail="Sujeto a elegibilidad y cupos."
            action="Ver mi elegibilidad"
            onClick={() =>
              void navigate(preview ? '/sistema-visual/elegibilidad' : '/elegibilidad')
            }
          />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="flex h-full flex-col p-5 sm:p-6">
            <CardHeader
              title={`Mi equipo: ${preview ? 'Team Hugo Ramirez' : (currentTeam?.name ?? 'Sin equipo asignado')}`}
              description={`Jefe de equipo: ${preview ? 'Hugo Ramirez' : (currentTeam?.leaderName ?? 'Por asignar')}`}
              icon={<UsersRound className="size-5" />}
            />
            <div className="mt-5 space-y-2.5">
              {preview ? (
                <>
                  <TeamMember
                    initials="HR"
                    name="Hugo Ramirez"
                    role="Project Analyst"
                    badge="Jefe de equipo"
                  />
                  <TeamMember initials="JP" name="Jose Pisco" role="Practicante / PMO" badge="Tú" />
                  <TeamMember
                    initials="VC"
                    name="Valeria Cabrera"
                    role="Practicante / PMO"
                    presence="away"
                  />
                </>
              ) : (
                currentTeam?.members.map((member) => (
                  <TeamMember
                    key={member.membershipId}
                    initials={member.fullName
                      .split(' ')
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')}
                    name={member.fullName}
                    role={member.jobTitle}
                    badge={
                      member.userId === currentTeam.leaderUserId
                        ? 'Jefe de equipo'
                        : member.userId === access?.profile.id
                          ? 'Tú'
                          : undefined
                    }
                  />
                ))
              )}
              {!preview && !teamsQuery.isLoading && !currentTeam ? (
                <p className="text-muted-foreground py-5 text-center text-xs">
                  Aún no tienes un equipo activo asignado.
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void navigate(preview ? '/sistema-visual/mi-equipo' : '/mi-equipo')}
              className="text-electric-blue group mt-auto flex items-center gap-1.5 pt-4 text-xs font-extrabold"
            >
              Ver todo el equipo
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </Card>

          <Card className="flex h-full flex-col p-5 sm:p-6">
            <CardHeader
              title="Early Friday asignado para esta semana"
              icon={<CalendarCheck className="size-5" />}
            />
            <div className="border-border hover:border-electric-blue/30 mt-5 grid overflow-hidden rounded-2xl border transition sm:grid-cols-[128px_1fr]">
              <div className="border-border bg-info-soft/40 grid place-items-center border-b p-5 text-center sm:border-r sm:border-b-0">
                <p className="text-electric-blue text-xs font-extrabold">VIERNES</p>
                <p className="text-electric-blue my-1 text-5xl font-extrabold">
                  {new Date(
                    `${assignment?.date ?? assignmentQuery.data?.date ?? nextFriday}T12:00:00`,
                  ).getDate()}
                </p>
                <p className="text-electric-blue text-xs font-bold">
                  {formatMonthYear(assignment?.date ?? assignmentQuery.data?.date ?? nextFriday)}
                </p>
              </div>
              <div className="flex items-center gap-4 p-5">
                {assignment ? (
                  <PresenceAvatar
                    initials={getInitials(assignment.person_name)}
                    tone="coral"
                    presence="away"
                  />
                ) : (
                  <CalendarCheck className="text-electric-blue size-9" />
                )}
                <div>
                  <p className="text-primary font-extrabold">
                    {assignment?.person_name ?? 'Sin asignación confirmada'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {assignment?.person_job_title ??
                      'El cupo semanal todavía no tiene una aprobación final.'}
                  </p>
                  {assignment ? (
                    <>
                      <Badge tone="success" className="mt-3">
                        <CheckCircle2 className="size-3.5" />
                        Aprobado
                      </Badge>
                      <p className="text-muted-foreground mt-2 max-w-[270px] text-xs leading-5">
                        {assignment.approved_by_name && assignment.approved_at
                          ? `Aprobado por ${assignment.approved_by_name} el ${formatDateTime(assignment.approved_at)}.`
                          : 'Aprobación final registrada.'}
                      </p>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void navigate(preview ? '/sistema-visual/calendario' : '/mi-equipo')}
              className="text-electric-blue group mt-auto flex items-center gap-1.5 pt-4 text-xs font-extrabold"
            >
              {preview ? 'Ver detalles' : 'Ver mi equipo'}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </Card>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="overflow-hidden">
            <div className="p-5 sm:p-6">
              <CardHeader
                title="Mis solicitudes recientes"
                icon={<FileText className="size-5" />}
                action={
                  <button
                    type="button"
                    onClick={() =>
                      void navigate(preview ? '/sistema-visual/solicitudes' : '/solicitudes')
                    }
                    className="text-electric-blue hover:text-primary rounded-lg px-2 py-1 text-xs font-extrabold transition-colors"
                  >
                    Ver todas
                  </button>
                }
              />
            </div>
            <div>
              <table className="w-full table-fixed text-left text-[11px] sm:text-xs lg:text-sm">
                <thead className="bg-background/70 text-primary text-xs">
                  <tr>
                    <th className="w-[21%] px-3 py-3 font-extrabold sm:px-4">Fecha</th>
                    <th className="w-[25%] px-3 py-3 font-extrabold sm:px-4">Fecha solicitada</th>
                    <th className="w-[21%] px-3 py-3 font-extrabold sm:px-4">Estado</th>
                    <th className="w-[27%] px-3 py-3 font-extrabold sm:px-4">
                      Responsable / decisión
                    </th>
                    <th className="w-[6%] px-1 py-3">
                      <span className="sr-only">Detalle</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {recentRequests.map((request) => (
                    <tr
                      key={request.id}
                      role="link"
                      aria-label={`Ver seguimiento de la solicitud del ${formatCompactDate(request.requestedDate)}`}
                      onClick={() =>
                        void navigate(
                          preview
                            ? `/sistema-visual/solicitudes/${request.id}`
                            : `/solicitudes/${request.id}`,
                          { state: { from: 'requests' } },
                        )
                      }
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') event.currentTarget.click()
                      }}
                      className="hover:bg-info-soft/50 group cursor-pointer transition-colors"
                    >
                      <td className="text-primary px-3 py-3 font-bold sm:px-4">
                        {formatCompactDate(request.createdAt)}
                      </td>
                      <td className="text-muted-foreground px-3 py-3 sm:px-4">
                        {formatCompactDate(request.requestedDate)}
                      </td>
                      <td className="px-3 py-3 sm:px-4">
                        <Badge tone={requestStatusPresentation[request.status].tone}>
                          {requestStatusPresentation[request.status].label}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground px-3 py-3 sm:px-4">
                        {approvalActor(request)}
                      </td>
                      <td className="px-1 py-3">
                        <ArrowRight className="text-muted-foreground group-hover:text-electric-blue size-4 transition-transform group-hover:translate-x-1" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <CardHeader title="Acciones rápidas" icon={<Zap className="size-5 fill-current" />} />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <QuickAction
                icon={<CalendarDays />}
                title="Solicitar Early Friday"
                description="Nueva solicitud"
                onClick={() =>
                  void navigate(
                    preview ? '/sistema-visual/solicitudes/nueva' : '/solicitudes/nueva',
                  )
                }
              />
              <QuickAction
                icon={<CalendarCheck />}
                title="Ver mi calendario"
                onClick={() =>
                  void navigate(preview ? '/sistema-visual/calendario' : '/calendario')
                }
                description="Próximos eventos"
              />
              <QuickAction
                icon={<FileText />}
                title="Mis solicitudes"
                description="Procesos activos"
                onClick={() =>
                  void navigate(preview ? '/sistema-visual/solicitudes' : '/solicitudes')
                }
              />
              <QuickAction
                icon={<ShieldCheck />}
                title="Ver mi elegibilidad"
                onClick={() =>
                  void navigate(preview ? '/sistema-visual/elegibilidad' : '/elegibilidad')
                }
                description="Requisitos y estado"
              />
            </div>
          </Card>
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

function MetricCard({
  title,
  icon,
  accent,
  value,
  detail,
  action,
  onClick,
  hideIcon = false,
}: {
  title: string
  icon: ReactNode
  accent: 'blue' | 'success'
  value: ReactNode
  detail: string
  action: string
  onClick?: () => void
  hideIcon?: boolean
}) {
  const accentClass =
    accent === 'success' ? 'text-success bg-success-soft' : 'text-electric-blue bg-info-soft'

  return (
    <Card className="flex min-h-[218px] flex-col p-5 sm:p-6">
      <h2 className="text-primary text-sm font-extrabold">{title}</h2>
      <div className="mt-5 flex items-center gap-3">
        {!hideIcon ? (
          <span className={`grid size-11 shrink-0 place-items-center rounded-full ${accentClass}`}>
            {icon}
          </span>
        ) : null}
        <div
          className={
            accent === 'success'
              ? 'text-success font-extrabold'
              : 'text-primary text-lg font-extrabold'
          }
        >
          {value}
        </div>
      </div>
      <p className="text-muted-foreground mt-4 text-xs leading-5">{detail}</p>
      <button
        type="button"
        onClick={onClick}
        className="text-electric-blue group mt-auto flex items-center gap-1 pt-4 text-left text-xs font-extrabold"
      >
        {action}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
      </button>
    </Card>
  )
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

function QuickAction({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode
  title: string
  description: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border hover:border-electric-blue hover:shadow-soft group flex min-h-20 items-center gap-3 rounded-xl border p-4 text-left transition hover:-translate-y-0.5"
    >
      <span className="text-electric-blue [&>svg]:size-6">{icon}</span>
      <span className="min-w-0">
        <span className="text-primary block truncate text-xs font-extrabold">{title}</span>
        <span className="text-muted-foreground mt-1 block text-[11px]">{description}</span>
      </span>
      <ArrowRight className="text-muted-foreground group-hover:text-electric-blue ml-auto size-4 shrink-0 transition-transform group-hover:translate-x-1" />
    </button>
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

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(date),
  )
}

function approvalSummary(request: RequestView) {
  const approval = request.approvalHistory?.findLast((item) => item.decision === 'APPROVED')
  return approval ? `Aprobado por ${approval.approverName}` : 'Aprobación final completada'
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
