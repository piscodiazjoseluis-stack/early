import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Lightbulb,
  RotateCcw,
  Sparkles,
  UserRoundX,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
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
import { Modal } from '@/components/ui/Modal'

import { getPortfolioWorkspace } from '../services/portfolio-service'
import {
  approvalSla,
  approvedStatuses,
  filterPortfolioRequests,
  lowParticipationThreshold,
  pendingStatuses,
  portfolioPeople,
  recommendPortfolioCandidate,
  rejectedStatuses,
  requestedFridayEvolution,
  resolvedApprovalRate,
  summarizeRequestStatuses,
  teamParticipation,
} from '../utils/portfolio-analysis'

type Tone = 'blue' | 'green' | 'red' | 'amber' | 'purple'
const chartColors = ['#12ad69', '#ff5d67', '#ffb020', '#94a3b8', '#8b5cf6']

export function PortfolioAnalyticsPage({ insightsOnly = false }: { insightsOnly?: boolean }) {
  const [peopleModalOpen, setPeopleModalOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [renderedAt] = useState(() => Date.now())
  const query = useQuery({
    queryKey: ['portfolio-workspace'],
    queryFn: getPortfolioWorkspace,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
  const allRequests = query.data?.requests ?? []
  const invalidDateRange = Boolean(dateFrom && dateTo && dateFrom > dateTo)
  const requests = invalidDateRange ? [] : filterPortfolioRequests(allRequests, dateFrom, dateTo)
  const teams = query.data?.teams ?? []
  const people = portfolioPeople(teams)
  const approved = requests.filter((request) => approvedStatuses.has(request.status))
  const rejected = requests.filter((request) => rejectedStatuses.has(request.status))
  const pending = requests.filter((request) => pendingStatuses.has(request.status))
  const used = requests.filter((request) => request.status === 'USED')
  const pendingUsage = requests.filter(
    (request) =>
      request.status === 'FINAL_APPROVED' &&
      isPastEnd(request.requestedDate, request.endTime, renderedAt),
  )
  const critical = requests.filter(
    (request) => request.status === 'PENDING_PORTFOLIO' && approvalSla(request).critical,
  )
  const evolution = requestedFridayEvolution(requests)
  const statusSummary = summarizeRequestStatuses(requests)
  const approvalRate = resolvedApprovalRate(requests)
  const allTeamData = teams.map((team) => ({
    name: team.name.replace(/^Team\s+/i, ''),
    value: teamParticipation(team, requests),
  }))
  const teamData = allTeamData
  const personUsage = people
    .map((person) => ({
      ...person,
      usos: used.filter((request) => request.requesterId === person.userId).length,
      lastRequest: requests
        .filter((request) => request.requesterId === person.userId)
        .sort((a, b) => b.requestedDate.localeCompare(a.requestedDate))[0]?.requestedDate,
    }))
    .sort((a, b) => b.usos - a.usos)
  const neverUsed = personUsage.filter((person) => person.usos === 0)
  const visibleNeverUsed = neverUsed.slice(0, 3)
  const stateData = [
    { name: 'Aprobadas', value: approved.length },
    { name: 'Rechazadas', value: rejected.length },
    { name: 'Pendientes', value: pending.length },
    { name: 'Canceladas o vencidas', value: statusSummary.closedWithoutBenefit },
    ...(statusSummary.unclassified
      ? [{ name: 'Sin clasificar', value: statusSummary.unclassified }]
      : []),
  ]
  const decisionData = [
    { name: 'Aprobadas', value: approved.length },
    { name: 'Rechazadas', value: rejected.length },
  ]
  const resolvedTotal = approved.length + rejected.length
  const lowTeams = [...allTeamData]
    .sort((a, b) => a.value - b.value)
    .filter((team) => team.value < lowParticipationThreshold)
  const recommendedCandidate = recommendPortfolioCandidate(people, requests, allTeamData)

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1540px] space-y-5">
        <header className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">
              {insightsOnly ? 'Análisis inteligente' : 'BI y analítica'}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Indicadores calculados con las solicitudes y usos confirmados del portfolio.
            </p>
          </div>
          {!insightsOnly ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <fieldset className="border-border flex flex-wrap items-end gap-2 rounded-xl border bg-white p-2">
                <legend className="sr-only">Filtrar por fecha solicitada</legend>
                <DateField label="Desde" value={dateFrom} onChange={setDateFrom} />
                <span className="text-muted-foreground hidden pb-2 sm:block">—</span>
                <DateField label="Hasta" value={dateTo} min={dateFrom} onChange={setDateTo} />
                {dateFrom || dateTo ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDateFrom('')
                      setDateTo('')
                    }}
                    className="text-muted-foreground hover:bg-info-soft hover:text-electric-blue grid size-10 place-items-center rounded-lg transition"
                    aria-label="Limpiar filtro de fechas"
                  >
                    <RotateCcw className="size-4" />
                  </button>
                ) : null}
              </fieldset>
              <ExportPdfButton
                requests={requests}
                dateFrom={dateFrom}
                dateTo={dateTo}
                disabled={invalidDateRange || requests.length === 0}
              />
            </div>
          ) : (
            <Badge tone="info">
              <Sparkles className="size-3.5" /> Motor de reglas explicables
            </Badge>
          )}
        </header>

        {invalidDateRange ? (
          <p
            role="alert"
            className="border-danger/25 bg-danger-soft text-danger rounded-xl border px-4 py-3 text-xs font-bold"
          >
            La fecha “Desde” no puede ser posterior a la fecha “Hasta”.
          </p>
        ) : null}
        {!insightsOnly && !invalidDateRange ? (
          <p className="text-muted-foreground -mt-2 text-[11px]">
            {dateFrom || dateTo
              ? `${requests.length} solicitud${requests.length === 1 ? '' : 'es'} en el período seleccionado.`
              : 'Mostrando todo el historial disponible.'}
          </p>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Kpi
            icon={<FileText />}
            label="Solicitudes"
            value={requests.length}
            detail="Total registrado"
            tone="blue"
          />
          <Kpi
            icon={<CheckCircle2 />}
            label="Aprobadas"
            value={approved.length}
            detail={`${ratio(approved.length, requests.length)}% del total`}
            tone="green"
          />
          <Kpi
            icon={<XCircle />}
            label="Rechazadas"
            value={rejected.length}
            detail={`${ratio(rejected.length, requests.length)}% del total`}
            tone="red"
          />
          <Kpi
            icon={<Clock3 />}
            label="Pendientes"
            value={pending.length}
            detail="En cualquier nivel"
            tone="amber"
          />
          <Kpi
            icon={<BarChart3 />}
            label="Early utilizados"
            value={used.length}
            detail="Beneficio confirmado"
            tone="blue"
          />
          <Kpi
            icon={<UserRoundX />}
            label="Sin uso"
            value={neverUsed.length}
            detail="Personas en rotación"
            tone="purple"
          />
        </section>

        {!insightsOnly ? (
          <>
            <section className="grid gap-5 xl:grid-cols-3">
              <ChartCard
                title="Uso confirmado por equipo"
                subtitle="Personas con uso confirmado sobre el total del equipo."
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamData} margin={{ left: 0, right: 18, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#dbe5f2" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#6b7b97' }}
                      tickMargin={10}
                    />
                    <YAxis domain={[0, 100]} width={34} tick={{ fontSize: 10, fill: '#6b7b97' }} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Uso confirmado']} />
                    <Bar dataKey="value" fill="#1769ff" radius={[8, 8, 0, 0]}>
                      <LabelList
                        dataKey="value"
                        position="top"
                        formatter={(value: number) => `${value}%`}
                        fill="#1769ff"
                        fontSize={11}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard
                title="Tasa de aprobación"
                subtitle="Aprobadas sobre decisiones finales; excluye pendientes y canceladas."
              >
                <DonutBreakdown
                  data={decisionData}
                  center={`${approvalRate}%`}
                  centerLabel="Aprobación"
                  total={resolvedTotal}
                />
              </ChartCard>
              <ChartCard
                title="Solicitudes por viernes solicitado"
                subtitle="Demanda y aprobaciones finales según la fecha solicitada del beneficio."
              >
                <div className="mb-2 flex justify-end gap-4 text-[11px]">
                  <Dot color="bg-electric-blue" label="Solicitudes registradas" />
                  <Dot color="bg-success" label="Aprobadas finalmente" />
                </div>
                <div className="h-[calc(100%-1.5rem)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolution} margin={{ left: 4, right: 16, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#dbe5f2" />
                      <XAxis
                        dataKey="label"
                        interval="preserveStartEnd"
                        tick={{ fontSize: 9, fill: '#6b7b97' }}
                        tickMargin={10}
                      />
                      <YAxis
                        allowDecimals={false}
                        width={32}
                        tick={{ fontSize: 10, fill: '#6b7b97' }}
                      />
                      <Tooltip />
                      <Line
                        name="Solicitudes registradas"
                        type="monotone"
                        dataKey="solicitudes"
                        stroke="#1769ff"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />
                      <Line
                        name="Aprobadas finalmente"
                        type="monotone"
                        dataKey="aprobaciones"
                        stroke="#12ad69"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.08fr_1.08fr_1fr] 2xl:grid-cols-[1.12fr_1.08fr_0.9fr]">
              <ChartCard
                title="Distribución de Early utilizados por persona"
                subtitle="Solo cuenta registros con uso confirmado."
              >
                <div className="flex h-full items-center py-4">
                  <div className="h-[248px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={personUsage}
                        layout="vertical"
                        margin={{ left: 2, right: 34 }}
                      >
                        <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#dbe5f2" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="fullName"
                          width={118}
                          tick={{ fontSize: 10, fill: '#6b7b97' }}
                        />
                        <Tooltip />
                        <Bar dataKey="usos" fill="#1769ff" radius={[0, 8, 8, 0]}>
                          <LabelList dataKey="usos" position="right" fill="#09255a" fontSize={11} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </ChartCard>
              <ChartCard
                title="Distribución por estado"
                subtitle="Conciliación completa de todas las solicitudes del período."
              >
                <DonutBreakdown
                  data={stateData}
                  center={String(requests.length)}
                  centerLabel="Total"
                  total={requests.length}
                />
              </ChartCard>
              <Card className="flex min-h-[360px] flex-col p-5">
                <h2 className="text-primary font-extrabold">
                  Personas que aún no utilizaron el beneficio
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Incluye colaboradores y jefes directos; Portfolio no solicita el beneficio.
                </p>
                <div className="mt-4 flex-1 space-y-2">
                  {visibleNeverUsed.map((person) => (
                    <article
                      key={person.userId}
                      className="border-border hover:border-electric-blue/35 rounded-xl border p-3 transition"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={person.fullName} />
                        <div className="min-w-0 flex-1">
                          <strong className="text-primary block truncate text-sm">
                            {person.fullName}
                          </strong>
                          <span className="text-muted-foreground block truncate text-[11px]">
                            {person.role} · {person.teamName}
                          </span>
                        </div>
                        <Badge tone="warning">Nunca</Badge>
                      </div>
                      <p className="text-muted-foreground mt-2 text-[11px]">
                        Última solicitud:{' '}
                        <strong className="text-primary">
                          {person.lastRequest ? formatDate(person.lastRequest) : 'Sin solicitudes'}
                        </strong>
                      </p>
                    </article>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPeopleModalOpen(true)}
                  className="border-border text-electric-blue hover:border-electric-blue mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border text-xs font-extrabold transition"
                >
                  Ver todas las personas
                  <ArrowRight className="size-4" />
                </button>
              </Card>
            </section>
          </>
        ) : null}

        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="bg-info-soft text-electric-blue grid size-10 place-items-center rounded-xl">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="text-primary text-xl font-extrabold">Insights e IA</h2>
              <p className="text-muted-foreground text-xs">
                Recomendaciones inteligentes basadas en los datos.
              </p>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            <Insight icon={<Lightbulb />} title="Hallazgo principal" tone="blue">
              {critical.length
                ? `${critical.length} solicitudes de Portfolio superaron el SLA de 24 horas y requieren atención inmediata.`
                : `La tasa de aprobación sobre decisiones finales es ${approvalRate}% y no hay casos fuera del SLA.`}
            </Insight>
            <Insight icon={<CheckCircle2 />} title="Recomendación semanal" tone="green">
              {recommendedCandidate
                ? `Considera a ${recommendedCandidate.fullName} (${recommendedCandidate.teamName}): participa en la rotación, está elegible y registra ${recommendedCandidate.usos} usos confirmados. La aprobación sigue sujeta a cobertura y reglas de la fecha.`
                : 'No hay integrantes elegibles en rotación para recomendar esta semana.'}
            </Insight>
            <Insight icon={<AlertTriangle />} title="Riesgos" tone="amber">
              {pendingUsage.length
                ? `${pendingUsage.length} beneficios aprobados ya terminaron y aún requieren confirmar si fueron utilizados.`
                : `${pending.length} solicitudes permanecen pendientes en los distintos niveles del flujo.`}
            </Insight>
            <Insight icon={<UsersRound />} title="Equipos con baja cobertura de uso" tone="purple">
              {lowTeams.length
                ? `Menos de ${lowParticipationThreshold}% de sus integrantes registra uso confirmado: ${lowTeams.map((team) => `${team.name}: ${team.value}%`).join(' · ')}`
                : `Ningún equipo activo está por debajo del umbral de ${lowParticipationThreshold}%.`}
            </Insight>
          </div>
        </section>

        <Card className="border-electric-blue/25 bg-info-soft/35 p-5">
          <div className="flex gap-3">
            <Sparkles className="text-electric-blue mt-0.5 size-5 shrink-0" />
            <div>
              <h2 className="text-primary font-extrabold">Cómo se generan estos insights</h2>
              <p className="text-muted-foreground mt-2 text-xs leading-5">
                Alcance: todo el portfolio ({teams.length} equipos visibles). Actualmente son
                análisis determinísticos y auditables sobre datos reales de Supabase: estados,
                SLA de 24 horas, fechas, equipo y confirmación de uso. No se está invocando un
                modelo generativo ni se inventan conclusiones.
              </p>
            </div>
          </div>
        </Card>
        <PeopleWithoutUsageModal
          open={peopleModalOpen}
          people={neverUsed}
          onClose={() => setPeopleModalOpen(false)}
        />
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
  tone: Tone
}) {
  const styles: Record<Tone, string> = {
    blue: 'bg-info-soft text-electric-blue',
    green: 'bg-success-soft text-success',
    red: 'bg-danger-soft text-danger',
    amber: 'bg-warning-soft text-warning',
    purple: 'bg-[#f1edff] text-[#7557d5]',
  }
  return (
    <Card className="hover:border-electric-blue/35 p-4 transition hover:-translate-y-1 hover:shadow-lg">
      <span className={`grid size-10 place-items-center rounded-xl [&>svg]:size-5 ${styles[tone]}`}>
        {icon}
      </span>
      <p className="text-muted-foreground mt-3 text-xs font-bold">{label}</p>
      <p className="text-primary mt-1 text-2xl font-extrabold">{value}</p>
      <p className="text-muted-foreground text-[11px]">{detail}</p>
    </Card>
  )
}
function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <Card className="p-5">
      <h2 className="text-primary font-extrabold">{title}</h2>
      <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
      <div className="mt-4 h-72">{children}</div>
    </Card>
  )
}
function DonutBreakdown({
  data,
  center,
  centerLabel,
  total,
}: {
  data: { name: string; value: number }[]
  center: string
  centerLabel: string
  total: number
}) {
  return (
    <div className="grid h-full grid-cols-1 items-center gap-1 sm:grid-cols-[minmax(170px,1fr)_minmax(132px,0.85fr)]">
      <div className="relative h-52 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              isAnimationActive={false}
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={72}
              paddingAngle={2}
            >
              {data.map((item, index) => (
                <Cell key={item.name} fill={chartColors[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <span>
            <strong className="text-primary block text-2xl">{center}</strong>
            <small className="text-muted-foreground">{centerLabel}</small>
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-1 sm:space-y-2">
        {data.map((item, index) => (
          <div key={item.name} className="min-w-0">
            <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <i
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: chartColors[index] }}
              />
              <span className="truncate">{item.name}</span>
            </span>
            <strong className="text-primary mt-1 block pl-4 text-xs sm:text-sm">
              {item.value} ({ratio(item.value, total)}%)
            </strong>
          </div>
        ))}
      </div>
    </div>
  )
}
function Insight({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode
  title: string
  tone: Tone
  children: React.ReactNode
}) {
  const styles: Record<Tone, string> = {
    blue: 'border-electric-blue/25 bg-info-soft/45 text-electric-blue',
    green: 'border-success/25 bg-success-soft/45 text-success',
    red: 'border-danger/25 bg-danger-soft/40 text-danger',
    amber: 'border-warning/25 bg-warning-soft/45 text-warning',
    purple: 'border-[#8b5cf6]/25 bg-[#f5f1ff] text-[#7557d5]',
  }
  return (
    <Card className={`p-5 ${styles[tone]}`}>
      <span className="[&>svg]:size-5">{icon}</span>
      <h3 className="mt-3 font-extrabold">{title}</h3>
      <p className="text-primary/80 mt-2 text-xs leading-5">{children}</p>
    </Card>
  )
}
function Dot({ color, label }: { color: string; label: string }) {
  return (
    <span className="text-muted-foreground flex items-center gap-1.5">
      <i className={`size-2 rounded-full ${color}`} />
      {label}
    </span>
  )
}
function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f7ece7] text-[11px] font-extrabold text-[#8a4d3b]">
      {name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')}
    </span>
  )
}
function ratio(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}
function isPastEnd(date: string, time: string, reference: number) {
  return reference >= new Date(`${date}T${time}`).getTime()
}

function DateField({
  label,
  value,
  min,
  onChange,
}: {
  label: string
  value: string
  min?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="group min-w-[138px]">
      <span className="text-muted-foreground mb-1 flex items-center gap-1 text-[10px] font-bold">
        <CalendarDays className="size-3.5" />
        {label}
      </span>
      <input
        type="date"
        value={value}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        className="text-primary focus:border-electric-blue h-8 w-full rounded-lg border border-transparent bg-transparent px-1 text-xs font-bold transition outline-none"
      />
    </label>
  )
}
function ExportPdfButton({
  requests,
  dateFrom,
  dateTo,
  disabled,
}: {
  requests: Array<{
    requestedDate: string
    requesterName: string
    teamName: string
    status: string
    priority: number | null
    startTime: string
    endTime: string
  }>
  dateFrom: string
  dateTo: string
  disabled: boolean
}) {
  const [exporting, setExporting] = useState(false)
  const exportPdf = async () => {
    setExporting(true)
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ])
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      pdf.setFillColor(9, 37, 90)
      pdf.rect(0, 0, 297, 28, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(18)
      pdf.text('Early Fridays PMO - BI y analítica', 14, 13)
      pdf.setFontSize(9)
      pdf.text(
        `Período: ${dateFrom || 'inicio'} al ${dateTo || 'actual'} · ${requests.length} solicitudes`,
        14,
        21,
      )
      autoTable(pdf, {
        startY: 36,
        head: [['Fecha', 'Persona', 'Equipo', 'Estado', 'Prioridad', 'Horario']],
        body: requests.map((request) => [
          request.requestedDate,
          request.requesterName,
          request.teamName,
          request.status,
          request.priority ?? 'Sin calcular',
          `${request.startTime.slice(0, 5)}-${request.endTime.slice(0, 5)}`,
        ]),
        headStyles: { fillColor: [23, 105, 255] },
        styles: { fontSize: 8, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [244, 248, 255] },
        didDrawPage: ({ pageNumber }) => {
          pdf.setTextColor(107, 123, 151)
          pdf.setFontSize(8)
          pdf.text(`Página ${pageNumber}`, 276, 202)
        },
      })
      pdf.save(`early-fridays-${dateFrom || 'inicio'}-${dateTo || 'actual'}.pdf`)
    } finally {
      setExporting(false)
    }
  }
  return (
    <button
      type="button"
      disabled={disabled || exporting}
      onClick={() => void exportPdf()}
      className="bg-primary hover:bg-electric-blue inline-flex min-h-[58px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-extrabold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Download className="size-4" />
      {exporting ? 'Generando…' : 'Exportar PDF'}
    </button>
  )
}

function PeopleWithoutUsageModal({
  open,
  people,
  onClose,
}: {
  open: boolean
  people: Array<{
    userId: string
    fullName: string
    role: string
    teamName: string
    lastRequest?: string
  }>
  onClose: () => void
}) {
  return (
    <Modal
      open={open}
      title="Personas que aún no utilizaron el beneficio"
      onClose={onClose}
      showFooter={false}
      className="max-w-2xl"
    >
      <p className="text-muted-foreground text-xs">
        Listado completo calculado con usos confirmados. Las aprobaciones todavía no cuentan como
        uso.
      </p>
      <div className="border-border mt-4 max-h-[55vh] space-y-2 overflow-y-auto rounded-2xl border p-2">
        {people.map((person) => (
          <article
            key={person.userId}
            className="hover:bg-info-soft/45 flex items-center gap-3 rounded-xl p-3 transition"
          >
            <Avatar name={person.fullName} />
            <div className="min-w-0 flex-1">
              <strong className="text-primary block truncate text-sm">{person.fullName}</strong>
              <span className="text-muted-foreground block truncate text-[11px]">
                {person.role} · {person.teamName}
              </span>
              <span className="text-muted-foreground mt-1 block text-[10px]">
                Última solicitud:{' '}
                {person.lastRequest ? formatDate(person.lastRequest) : 'Sin solicitudes'}
              </span>
            </div>
            <Badge tone="warning">Nunca</Badge>
          </article>
        ))}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="bg-primary hover:bg-electric-blue mt-4 min-h-11 w-full rounded-xl text-sm font-extrabold text-white transition"
      >
        Cerrar
      </button>
    </Modal>
  )
}
