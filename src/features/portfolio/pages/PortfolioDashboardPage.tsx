import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Sparkles,
  UserRoundCheck,
  UserRoundX,
  Users,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/hooks/useAuth'

import { getPortfolioWorkspace } from '../services/portfolio-service'
import {
  approvalSla,
  approvedStatuses,
  pendingStatuses,
  portfolioPeople,
  rejectedStatuses,
  requestedFridayEvolution,
  summarizeRequestStatuses,
  teamParticipation,
} from '../utils/portfolio-analysis'

export function PortfolioDashboardPage() {
  const navigate = useNavigate()
  const { access } = useAuth()
  const query = useQuery({
    queryKey: ['portfolio-workspace'],
    queryFn: getPortfolioWorkspace,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
  const requests = query.data?.requests ?? []
  const teams = query.data?.teams ?? []
  const people = portfolioPeople(teams)
  const pending = requests.filter((request) => request.status === 'PENDING_PORTFOLIO')
  const approved = requests.filter((request) => approvedStatuses.has(request.status))
  const rejected = requests.filter((request) => rejectedStatuses.has(request.status))
  const operationalPending = requests.filter((request) => pendingStatuses.has(request.status))
  const other = requests.length - approved.length - rejected.length - operationalPending.length
  const benefited = people.filter((person) =>
    requests.some((request) => request.requesterId === person.userId && request.status === 'USED'),
  )
  const critical = pending
    .map((request) => ({ request, sla: approvalSla(request) }))
    .filter(({ sla }) => sla.critical)
    .sort((a, b) => b.sla.elapsedHours - a.sla.elapsedHours)
  const participation = teams
    .map((team) => ({ name: team.name, value: teamParticipation(team, requests) }))
    .sort((a, b) => a.value - b.value)
  const firstName = access?.profile.full_name.split(' ')[0] ?? 'María Luisa'
  const evolution = requestedFridayEvolution(requests)

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1540px] space-y-5">
        <header>
          <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">
            ¡Buenos días, {firstName}!
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Resumen ejecutivo del portfolio · datos operativos en tiempo real.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
          <Kpi
            icon={<FileText />}
            label="Solicitudes totales"
            value={requests.length}
            detail="Histórico visible"
            tone="blue"
          />
          <Kpi
            icon={<Clock3 />}
            label="Pendientes finales"
            value={pending.length}
            detail="Revisión de Portfolio"
            tone="amber"
          />
          <Kpi
            icon={<CheckCircle2 />}
            label="Aprobadas"
            value={approved.length}
            detail={percent(approved.length, requests.length)}
            tone="green"
          />
          <Kpi
            icon={<XCircle />}
            label="Rechazadas"
            value={rejected.length}
            detail={percent(rejected.length, requests.length)}
            tone="red"
          />
          <Kpi
            icon={<UsersRound />}
            label="Equipos"
            value={teams.length}
            detail="Configurados"
            tone="purple"
          />
          <Kpi
            icon={<UserRoundCheck />}
            label="Beneficiadas"
            value={benefited.length}
            detail="Uso confirmado"
            tone="green"
          />
          <Kpi
            icon={<UserRoundX />}
            label="Aún sin uso"
            value={Math.max(0, people.length - benefited.length)}
            detail="Incluye líderes"
            tone="amber"
          />
          <Kpi
            icon={<AlertTriangle />}
            label="Pendientes críticos"
            value={critical.length}
            detail="SLA mayor a 24 h"
            tone="red"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.7fr)]">
          <Card className="p-5">
            <Title
              title="Equipos globales"
              action="Ver todos los equipos"
              onClick={() => void navigate('/equipos')}
            />
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {teams.map((team, index) => {
                const teamRequests = requests.filter((request) => request.teamName === team.name)
                const statusSummary = summarizeRequestStatuses(teamRequests)
                const participationValue = teamParticipation(team, requests)
                const teamPeople = [
                  team.leaderUserId,
                  ...team.members.map((member) => member.userId),
                ].filter(Boolean).length
                const peopleWithConfirmedUse = new Set(
                  teamRequests
                    .filter((request) => request.status === 'USED')
                    .map((request) => request.requesterId),
                ).size
                const accents = [
                  'bg-[#eef4ff] text-electric-blue',
                  'bg-[#fff0eb] text-[#dc6544]',
                  'bg-[#f2edff] text-[#7857d5]',
                ]
                return (
                  <article
                    key={team.id}
                    className="border-border hover:border-electric-blue/40 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-11 shrink-0 place-items-center rounded-full ${accents[index % accents.length]}`}
                      >
                        <Users className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-primary text-sm leading-5 font-extrabold">
                          {team.name}
                        </h3>
                        <p className="text-muted-foreground mt-0.5 truncate text-xs">
                          {team.leaderName || 'Jefatura por asignar'}
                        </p>
                      </div>
                      <span
                        className="bg-electric-blue size-2.5 rounded-full"
                        aria-label="Equipo activo"
                      />
                    </div>
                    <div className="border-border mt-4 grid grid-cols-3 border-t pt-4 text-center">
                      <TeamMetric label="Solicitudes" value={statusSummary.total} />
                      <TeamMetric label="Aprobadas" value={statusSummary.approved} tone="success" />
                      <TeamMetric label="En curso" value={statusSummary.inProgress} />
                    </div>
                    <div className="border-border mt-3 grid grid-cols-2 gap-2 border-y py-3">
                      <TeamStatusDetail
                        label="Rechazadas"
                        value={statusSummary.rejected}
                        tone="danger"
                      />
                      <TeamStatusDetail
                        label="Canceladas o vencidas"
                        value={statusSummary.closedWithoutBenefit}
                        tone="muted"
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <span>
                        <strong className="text-primary block text-xs">Uso confirmado</strong>
                        <small className="text-muted-foreground mt-0.5 block text-[10px]">
                          {peopleWithConfirmedUse} de {teamPeople} personas
                        </small>
                      </span>
                      <ParticipationRing
                        value={participationValue}
                        hasPeople={Boolean(team.leaderUserId || team.members.length)}
                      />
                    </div>
                  </article>
                )
              })}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-primary flex items-center gap-2 font-extrabold">
                <AlertTriangle className="text-danger size-5" /> Pendientes críticos
              </h2>
              <Badge tone={critical.length ? 'danger' : 'success'}>{critical.length}</Badge>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Crítico cuando Portfolio lleva más de 24 horas sin decidir.
            </p>
            <div className="mt-3 max-h-72 overflow-y-auto pr-1">
              {critical.slice(0, 4).map(({ request, sla }) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => void navigate(`/aprobaciones/${request.id}`)}
                  className="border-danger/20 hover:bg-danger-soft/40 flex w-full items-center gap-3 border-b py-3 text-left transition last:border-b-0"
                >
                  <Avatar name={request.requesterName} />
                  <span className="min-w-0 flex-1">
                    <span className="text-primary block truncate text-sm font-extrabold">
                      {request.requesterName}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {request.teamName} · {formatDate(request.requestedDate)}
                    </span>
                  </span>
                  <span className="text-danger text-right text-xs font-bold">
                    {Math.floor(sla.elapsedHours)} h<br />
                    en espera
                  </span>
                </button>
              ))}
              {!critical.length ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No hay decisiones fuera del SLA.
                </p>
              ) : null}
            </div>
            <LinkButton
              label="Ver aprobaciones finales"
              onClick={() => void navigate('/aprobaciones')}
              full
            />
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr_1.2fr_1fr]">
          <Card className="p-5">
            <h2 className="text-primary flex items-center gap-2 font-extrabold">
              <CalendarDays className="text-electric-blue size-5" /> Calendario global
            </h2>
            <p className="text-muted-foreground mt-2 text-xs">
              La hora indica la salida Early solicitada, no la hora de aprobación.
            </p>
            <div className="mt-4 space-y-2">
              {requests
                .filter((request) => new Date(`${request.requestedDate}T23:59:59`) >= new Date())
                .slice(0, 4)
                .map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => void navigate(`/aprobaciones/${request.id}`)}
                    className="border-border hover:border-electric-blue/40 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition"
                  >
                    <span className="bg-info-soft text-electric-blue grid size-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold">
                      {request.requestedDate.slice(8, 10)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="text-primary block truncate text-xs">
                        {request.requesterName}
                      </strong>
                      <span className="text-muted-foreground text-[11px]">
                        Salida {formatTime(request.startTime)}
                      </span>
                    </span>
                    <span
                      className={`size-2 rounded-full ${request.status === 'USED' ? 'bg-success' : request.status === 'FINAL_APPROVED' ? 'bg-electric-blue' : 'bg-warning'}`}
                    />
                  </button>
                ))}
            </div>
            <LinkButton
              label="Ver calendario completo"
              onClick={() => void navigate('/calendario')}
              full
            />
          </Card>

          <Card className="p-5">
            <h2 className="text-primary font-extrabold">Distribución por estado</h2>
            <div className="relative mt-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    isAnimationActive={false}
                    data={[
                      { name: 'Aprobadas', value: approved.length },
                      { name: 'Pendientes', value: operationalPending.length },
                      { name: 'Rechazadas', value: rejected.length },
                      { name: 'Canceladas', value: other },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={43}
                    outerRadius={62}
                    paddingAngle={2}
                  >
                    {['#12ad69', '#ffb020', '#ff5d67', '#9aa8bd'].map((color) => (
                      <Cell key={color} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <span>
                  <strong className="text-primary block text-xl">{requests.length}</strong>
                  <small className="text-muted-foreground">Total</small>
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatusSummary
                color="bg-success"
                label="Aprobadas"
                value={approved.length}
                total={requests.length}
              />
              <StatusSummary
                color="bg-warning"
                label="Pendientes"
                value={operationalPending.length}
                total={requests.length}
              />
              <StatusSummary
                color="bg-danger"
                label="Rechazadas"
                value={rejected.length}
                total={requests.length}
              />
              <StatusSummary
                color="bg-[#9aa8bd]"
                label="Canceladas"
                value={other}
                total={requests.length}
              />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-primary font-extrabold">Uso confirmado por equipo</h2>
            <p className="text-muted-foreground mt-2 text-xs">
              Personas con al menos un uso confirmado.
            </p>
            <div className="mt-6 space-y-5">
              {participation.map((team) => (
                <Bar key={team.name} label={team.name} value={team.value} />
              ))}
            </div>
          </Card>

          <Card className="border-electric-blue/30 bg-gradient-to-br from-white to-[#f2f7ff] p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="text-electric-blue size-5" />
              <h2 className="text-primary font-extrabold">Resumen inteligente</h2>
            </div>
            <Badge tone="info" className="mt-3">
              Motor de reglas explicables
            </Badge>
            <p className="text-primary mt-4 text-sm leading-6 font-bold">
              {critical.length
                ? `${critical.length} solicitudes superaron el SLA de 24 horas y requieren decisión inmediata.`
                : 'No existen solicitudes fuera del SLA de Portfolio.'}
            </p>
            <p className="text-muted-foreground mt-3 text-xs leading-5">
              {participation[0]
                ? `${participation[0].name} tiene la menor cobertura de uso confirmado (${participation[0].value}%). Prioriza personas elegibles sin usos.`
                : 'Aún no hay equipos con personas asignadas para comparar participación.'}
            </p>
            <LinkButton
              label="Ver análisis completo"
              onClick={() => void navigate('/analisis-inteligente')}
              full
            />
          </Card>
        </section>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-primary font-extrabold">
                Solicitudes por viernes solicitado
              </h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Historial completo según la fecha solicitada del beneficio.
              </p>
            </div>
            <div className="flex gap-3 text-xs">
              <Legend color="bg-electric-blue" label="Solicitudes registradas" />
              <Legend color="bg-success" label="Aprobadas finalmente" />
            </div>
          </div>
          <div className="mt-5 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolution} margin={{ left: 8, right: 18, bottom: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#dbe5f2" vertical={false} />
                <XAxis
                  dataKey="label"
                  interval="preserveStartEnd"
                  tick={{ fontSize: 11, fill: '#6b7b97' }}
                  tickMargin={12}
                />
                <YAxis allowDecimals={false} width={34} tick={{ fontSize: 11, fill: '#6b7b97' }} />
                <Tooltip />
                <Line
                  name="Solicitudes registradas"
                  type="monotone"
                  dataKey="solicitudes"
                  stroke="#1769ff"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  name="Aprobadas finalmente"
                  type="monotone"
                  dataKey="aprobaciones"
                  stroke="#12ad69"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}

function Kpi({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  detail: string
  tone: 'blue' | 'green' | 'red' | 'amber' | 'purple'
}) {
  const colors = {
    blue: 'bg-info-soft text-electric-blue',
    green: 'bg-success-soft text-success',
    red: 'bg-danger-soft text-danger',
    amber: 'bg-warning-soft text-warning',
    purple: 'bg-[#f1edff] text-[#7557d5]',
  }
  return (
    <Card className="group hover:border-electric-blue/35 p-4 transition hover:-translate-y-1 hover:shadow-lg">
      <span className={`grid size-9 place-items-center rounded-xl [&>svg]:size-4 ${colors[tone]}`}>
        {icon}
      </span>
      <p className="text-muted-foreground mt-3 min-h-8 text-xs font-bold">{label}</p>
      <p className="text-primary text-2xl leading-none font-extrabold">{value}</p>
      <p className="text-muted-foreground mt-2 text-[11px]">{detail}</p>
    </Card>
  )
}

function Title({ title, action, onClick }: { title: string; action: string; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-primary font-extrabold">{title}</h2>
      <button
        type="button"
        onClick={onClick}
        className="text-electric-blue hover:text-primary flex items-center gap-1 text-xs font-extrabold transition"
      >
        {action}
        <ArrowRight className="size-4" />
      </button>
    </div>
  )
}
function TeamMetric({ label, value, tone }: { label: string; value: number; tone?: 'success' }) {
  return (
    <div className="px-2">
      <span className="text-muted-foreground block text-[10px]">{label}</span>
      <strong
        className={`mt-1 block text-lg ${tone === 'success' ? 'text-success' : 'text-primary'}`}
      >
        {value}
      </strong>
    </div>
  )
}
function TeamStatusDetail({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'danger' | 'muted'
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2">
      <span className="text-muted-foreground text-[10px] leading-4">{label}</span>
      <strong className={`text-xs ${tone === 'danger' ? 'text-danger' : 'text-primary'}`}>
        {value}
      </strong>
    </div>
  )
}
function ParticipationRing({ value, hasPeople }: { value: number; hasPeople: boolean }) {
  return (
    <div
      className="relative grid size-16 place-items-center rounded-full"
      style={{ background: `conic-gradient(#1769ff ${value * 3.6}deg, #e5ebf4 0)` }}
    >
      <div className="grid size-12 place-items-center rounded-full bg-white">
        <strong className="text-primary text-xs">{hasPeople ? `${value}%` : '0%'}</strong>
      </div>
    </div>
  )
}
function StatusSummary({
  color,
  label,
  value,
  total,
}: {
  color: string
  label: string
  value: number
  total: number
}) {
  return (
    <div className="bg-background rounded-xl p-2">
      <span className="text-muted-foreground flex items-center gap-1.5 text-[10px]">
        <i className={`size-2 rounded-full ${color}`} />
        {label}
      </span>
      <strong className="text-primary mt-1 block text-xs">
        {value} · {ratio(value, total)}%
      </strong>
    </div>
  )
}
function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f7ece7] text-xs font-extrabold text-[#8a4d3b]">
      {name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')}
    </span>
  )
}
function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs">
        <span className="text-primary font-bold">{label}</span>
        <strong className="text-electric-blue">{value}%</strong>
      </div>
      <div className="bg-background h-2 overflow-hidden rounded-full">
        <div
          className="bg-electric-blue h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${color}`} />
      {label}
    </span>
  )
}
function LinkButton({
  label,
  onClick,
  full = false,
}: {
  label: string
  onClick: () => void
  full?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-electric-blue hover:text-primary mt-5 inline-flex items-center justify-center gap-1 text-xs font-extrabold transition ${full ? 'w-full' : ''}`}
    >
      {label}
      <ArrowRight className="size-4" />
    </button>
  )
}
function percent(value: number, total: number) {
  return `${ratio(value, total)}% del total`
}
function ratio(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' }).format(
    new Date(`${value}T12:00:00`),
  )
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat('es-PE', { hour: 'numeric', minute: '2-digit' }).format(
    new Date(`2026-01-01T${value}`),
  )
}
