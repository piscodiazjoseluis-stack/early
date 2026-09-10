import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  FileClock,
  Sparkles,
  UserX,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getTeams } from '@/features/teams/services/team-service'

import { approvalPreviewRequests } from '../data/approval-preview-data'
import { getTeamApprovalRequests } from '../services/approval-service'

export function TeamLeaderDashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { access } = useAuth()
  const preview = location.pathname.startsWith('/sistema-visual')
  const requestsQuery = useQuery({
    queryKey: ['team-leader-requests'],
    queryFn: getTeamApprovalRequests,
    enabled: !preview && Boolean(access),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
  const teamsQuery = useQuery({
    queryKey: ['teams', 'leader-dashboard'],
    queryFn: getTeams,
    enabled: !preview && Boolean(access),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
  const requests = preview ? approvalPreviewRequests : (requestsQuery.data ?? [])
  const pending = requests.filter((request) => request.status === 'PENDING_TEAM_LEADER')
  const approved = requests.filter((request) =>
    ['APPROVED_BY_TEAM_LEADER', 'PENDING_PORTFOLIO', 'FINAL_APPROVED', 'USED'].includes(
      request.status,
    ),
  )
  const rejected = requests.filter((request) => request.status === 'REJECTED_BY_TEAM_LEADER')
  const used = requests.filter((request) => request.status === 'USED')
  const team = preview
    ? {
        name: 'Team Hugo Ramirez',
        members: [
          {
            userId: 'jose',
            fullName: 'Jose Pisco',
            jobTitle: 'Practicante / PMO',
            isEligible: true,
            participatesInRotation: true,
          },
          {
            userId: 'valeria',
            fullName: 'Valeria Cabrera',
            jobTitle: 'Practicante / PMO',
            isEligible: true,
            participatesInRotation: true,
          },
        ],
      }
    : teamsQuery.data?.find((item) => item.leaderUserId === access?.profile.id)
  const to = (path: string) => (preview ? `/sistema-visual/jefe${path}` : path)
  const memberRows = (team?.members ?? []).map((member) => {
    const memberRequests = requests.filter((request) => request.requesterId === member.userId)
    const usedRequests = memberRequests
      .filter((request) => request.status === 'USED')
      .toSorted((left, right) => right.requestedDate.localeCompare(left.requestedDate))
    const latestPriority = memberRequests
      .toSorted((left, right) => right.requestedDate.localeCompare(left.requestedDate))
      .find((request) => request.priority !== null)?.priority
    return {
      ...member,
      lastEarly: usedRequests[0]?.requestedDate ?? null,
      totalUses: usedRequests.length,
      availability: member.isEligible && member.participatesInRotation ? 'Alta' : 'No disponible',
      suggestedPriority:
        latestPriority ?? (usedRequests.length === 0 ? 90 : 70 - usedRequests.length * 15),
    }
  })

  if (!preview && access && !access.roles.includes('TEAM_LEADER')) {
    return (
      <AppLayout>
        <Card className="p-8">
          <h1 className="text-primary text-2xl font-extrabold">Acceso restringido</h1>
          <p className="text-muted-foreground mt-2">
            Este panel está disponible únicamente para jefes directos.
          </p>
        </Card>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <section
          className="team-leader-kpi-grid grid gap-4 sm:grid-cols-2 md:grid-cols-3"
          aria-label="Indicadores del equipo"
        >
          <Kpi
            icon={<FileClock />}
            label="Solicitudes pendientes"
            value={pending.length}
            tone="info"
            onClick={() => void navigate(to('/aprobaciones'))}
          />
          <Kpi
            icon={<Clock3 />}
            label="Próximas a vencer"
            value={pending.filter((item) => daysUntil(item.requestedDate) <= 7).length}
            tone="warning"
            onClick={() => void navigate(to('/aprobaciones'))}
          />
          <Kpi
            icon={<CheckCircle2 />}
            label="Aprobadas en el período"
            value={approved.length}
            tone="success"
            onClick={() => void navigate(to('/bi-equipo'))}
          />
          <Kpi
            icon={<XCircle />}
            label="Rechazadas en el período"
            value={rejected.length}
            tone="danger"
            onClick={() => void navigate(to('/bi-equipo'))}
          />
          <Kpi
            icon={<CalendarDays />}
            label="Early utilizados"
            value={used.length}
            tone="info"
            onClick={() => void navigate(to('/calendario'))}
          />
          <Kpi
            icon={<UserX />}
            label="Integrantes aún no beneficiados"
            value={memberRows.filter((member) => member.totalUses === 0).length}
            tone="neutral"
            onClick={() => void navigate(to('/rotacion'))}
          />
        </section>

        <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(540px,0.84fr)]">
          <Card className="min-w-0 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-primary text-lg font-extrabold">Prioridad del equipo</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Orden sugerido según uso real y elegibilidad.
                </p>
              </div>
              <UsersRound className="text-electric-blue size-6" />
            </div>
            <div className="mt-5 overflow-x-auto">
              <div className="min-w-[580px]">
                <div className="border-border text-muted-foreground grid grid-cols-[minmax(180px,1.5fr)_95px_80px_110px_115px] items-center border-b px-2 pb-3 text-[10px] font-bold">
                  <span>Integrante</span>
                  <span>Último Early</span>
                  <span>Total de usos</span>
                  <span>Disponibilidad</span>
                  <span>Prioridad sugerida</span>
                </div>
                <div className="divide-border divide-y">
                  {memberRows.map((member) => (
                    <article
                      key={member.userId}
                      className="hover:bg-info-soft/25 grid grid-cols-[minmax(180px,1.5fr)_95px_80px_110px_115px] items-center px-2 py-4 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={member.fullName} />
                        <div>
                          <p className="text-primary text-sm font-extrabold">{member.fullName}</p>
                          <p className="text-muted-foreground text-[10px]">{member.jobTitle}</p>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-xs font-semibold">
                        {member.lastEarly ? formatDate(member.lastEarly) : 'Sin usos'}
                      </p>
                      <p className="text-primary text-center text-sm font-extrabold">
                        {member.totalUses}
                      </p>
                      <Badge
                        tone={member.availability === 'Alta' ? 'success' : 'danger'}
                        className="w-fit"
                      >
                        <span
                          className={
                            member.availability === 'Alta'
                              ? 'bg-success size-2 rounded-full'
                              : 'bg-danger size-2 rounded-full'
                          }
                        />
                        {member.availability}
                      </Badge>
                      <Badge
                        tone={member.suggestedPriority >= 75 ? 'info' : 'warning'}
                        className="w-fit"
                      >
                        {member.suggestedPriority >= 75
                          ? 'Muy alta ↑↑'
                          : member.suggestedPriority >= 45
                            ? 'Alta ↑'
                            : 'Media'}
                      </Badge>
                    </article>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void navigate(to('/analisis-inteligente'))}
              className="text-electric-blue hover:text-primary mx-auto mt-5 flex items-center gap-2 text-xs font-extrabold transition"
            >
              Ver análisis completo <ArrowRight className="size-4" />
            </button>
          </Card>

          <Card className="min-w-0 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-primary text-lg font-extrabold">Solicitudes pendientes</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Requieren tu decisión como jefe directo.
                </p>
              </div>
              <Badge tone="info">{pending.length}</Badge>
            </div>
            <div className="mt-5 space-y-3">
              {pending.length ? (
                pending.slice(0, 3).map((request) => (
                  <article
                    key={request.id}
                    className="border-border hover:border-electric-blue/35 grid items-center gap-3 rounded-2xl border p-3 transition sm:grid-cols-[minmax(0,1fr)_125px_auto]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={request.requesterName} />
                      <div className="min-w-0">
                        <p className="text-primary truncate text-xs font-extrabold">
                          {request.requesterName}
                        </p>
                        <p className="text-muted-foreground truncate text-[9px]">
                          {request.requesterJobTitle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="text-muted-foreground size-4" />
                      <div>
                        <p className="text-muted-foreground text-[10px] font-bold">Viernes</p>
                        <p className="text-primary text-xs font-extrabold">
                          {formatDate(request.requestedDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DecisionShortcut
                        icon={<Check />}
                        label={`Revisar aprobación de ${request.requesterName}`}
                        tone="success"
                        onClick={() => void navigate(to(`/aprobaciones/${request.id}`))}
                      />
                      <DecisionShortcut
                        icon={<X />}
                        label={`Revisar rechazo de ${request.requesterName}`}
                        tone="danger"
                        onClick={() => void navigate(to(`/aprobaciones/${request.id}`))}
                      />
                      <DecisionShortcut
                        icon={<Eye />}
                        label={`Ver solicitud de ${request.requesterName}`}
                        tone="neutral"
                        onClick={() => void navigate(to(`/aprobaciones/${request.id}`))}
                      />
                    </div>
                  </article>
                ))
              ) : (
                <p className="bg-success-soft text-success rounded-2xl p-5 text-sm font-bold">
                  No tienes solicitudes pendientes de revisión.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void navigate(to('/aprobaciones'))}
              className="text-electric-blue hover:text-primary mt-5 flex w-full items-center justify-center gap-2 text-sm font-extrabold transition"
            >
              Ver todas las solicitudes <ArrowRight className="size-4" />
            </button>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-primary font-extrabold">Calendario del equipo: Hugo</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Próximos viernes con actividad.
                </p>
              </div>
              <CalendarDays className="text-electric-blue size-5" />
            </div>
            <div className="mt-5 grid grid-cols-5 gap-2">
              {requests.slice(0, 5).map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => void navigate(to('/calendario'))}
                  className="hover:bg-info-soft rounded-xl p-2 text-center transition"
                >
                  <span className="bg-primary mx-auto grid size-9 place-items-center rounded-full text-xs font-extrabold text-white">
                    {Number(request.requestedDate.slice(-2))}
                  </span>
                  <span className="text-muted-foreground mt-1 block truncate text-[9px]">
                    {request.requesterName.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void navigate(to('/calendario'))}
              className="text-electric-blue mt-4 text-xs font-extrabold"
            >
              Ver calendario completo →
            </button>
          </Card>
          <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="bg-warning-soft grid size-11 place-items-center rounded-full text-[#ad6a00]">
                <FileCheck2 className="size-5" />
              </span>
              <div>
                <h2 className="text-primary font-extrabold">Alertas y recordatorios</h2>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {pending.length
                    ? `${pending.length} solicitud${pending.length === 1 ? '' : 'es'} requiere${pending.length === 1 ? '' : 'n'} tu decisión.`
                    : 'Tu bandeja está al día.'}
                </p>
                <button
                  type="button"
                  onClick={() => void navigate(to('/aprobaciones'))}
                  className="text-electric-blue mt-3 text-sm font-extrabold"
                >
                  Revisar ahora →
                </button>
              </div>
            </div>
          </Card>
          <Card className="border-electric-blue/25 bg-gradient-to-br from-white to-[#f4f8ff] p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="bg-info-soft text-electric-blue grid size-11 place-items-center rounded-full">
                <Sparkles className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-primary font-extrabold">Análisis inteligente</h2>
                  <Badge tone="info">Basado en reglas</Badge>
                </div>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {team?.members[0]?.fullName ?? 'El equipo'} encabeza la prioridad sugerida según
                  elegibilidad y uso visible.
                </p>
                <button
                  type="button"
                  onClick={() => void navigate(to('/analisis-inteligente'))}
                  className="text-electric-blue mt-3 text-sm font-extrabold"
                >
                  Ver recomendación completa →
                </button>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </AppLayout>
  )
}

function Kpi({
  icon,
  label,
  value,
  tone,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'info' | 'warning' | 'success' | 'danger' | 'neutral'
  onClick: () => void
}) {
  const colors = {
    info: 'bg-info-soft text-electric-blue',
    warning: 'bg-warning-soft text-[#ad6a00]',
    success: 'bg-success-soft text-success',
    danger: 'bg-danger-soft text-danger',
    neutral: 'bg-[#f2ecff] text-[#7951bd]',
  }
  return (
    <Card className="group hover:border-electric-blue/35 flex min-h-44 flex-col p-5 transition hover:-translate-y-1 hover:shadow-md">
      <span className={`grid size-11 place-items-center rounded-xl [&>svg]:size-5 ${colors[tone]}`}>
        {icon}
      </span>
      <p className="text-muted-foreground mt-3 flex min-h-10 items-start text-xs leading-5 font-bold">
        {label}
      </p>
      <p className="text-primary mt-1 text-3xl leading-none font-extrabold">{value}</p>
      <button
        type="button"
        onClick={onClick}
        className="text-electric-blue mt-auto flex items-center gap-1 pt-4 text-[11px] font-extrabold whitespace-nowrap"
      >
        Ver detalles <ArrowRight className="size-3" />
      </button>
    </Card>
  )
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-[#f0e7e3] text-xs font-extrabold text-[#6e4436]">
      {name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')}
    </span>
  )
}
function DecisionShortcut({
  icon,
  label,
  tone,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  tone: 'success' | 'danger' | 'neutral'
  onClick: () => void
}) {
  const colors = {
    success: 'border-success/30 bg-success-soft text-success hover:border-success',
    danger: 'border-danger/30 bg-danger-soft text-danger hover:border-danger',
    neutral: 'border-border text-primary hover:border-electric-blue hover:text-electric-blue',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid size-10 place-items-center rounded-xl border transition [&>svg]:size-5 ${colors[tone]}`}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  )
}
function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}
function daysUntil(date: string) {
  return Math.ceil((new Date(`${date}T12:00:00`).getTime() - Date.now()) / 86_400_000)
}
