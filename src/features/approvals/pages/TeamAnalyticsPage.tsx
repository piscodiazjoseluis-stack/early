import {
  ArchiveX,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Sparkles,
  UserRoundX,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { downloadRequestsCsv, filterHistoricalRequests } from '@/features/reports/request-report'
import {
  resolvedApprovalRate,
  summarizeRequestStatuses,
} from '@/features/portfolio/utils/portfolio-analysis'

import { useTeamLeaderWorkspace } from '../hooks/useTeamLeaderWorkspace'
import type { TeamApprovalRequest } from '../types'

const teamReportStatuses: TeamApprovalRequest['status'][] = [
  'PENDING_TEAM_LEADER',
  'RETURNED_FOR_CORRECTION',
  'PENDING_PORTFOLIO',
  'REJECTED_BY_TEAM_LEADER',
  'REJECTED_BY_PORTFOLIO',
  'FINAL_APPROVED',
  'CANCELLED',
  'USED',
  'NOT_USED',
  'EXPIRED',
]

export function TeamAnalyticsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const preview = location.pathname.startsWith('/sistema-visual')
  const { requests: allRequests, team } = useTeamLeaderWorkspace(preview)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [status, setStatus] = useState<TeamApprovalRequest['status'] | ''>('')
  const invalidRange = Boolean(dateFrom && dateTo && dateFrom > dateTo)
  const requests = invalidRange
    ? []
    : filterHistoricalRequests(allRequests, { dateFrom, dateTo, status })
  const statusSummary = summarizeRequestStatuses(requests)
  const approved = statusSummary.approved
  const rejected = statusSummary.rejected
  const pending = statusSummary.inProgress
  const used = requests.filter((r) => r.status === 'USED').length
  const total = requests.length
  const rate = resolvedApprovalRate(requests)
  const byMember = (team?.members ?? []).map((member) => ({
    member,
    total: requests.filter((r) => r.requesterId === member.userId).length,
    used: requests.filter((r) => r.requesterId === member.userId && r.status === 'USED').length,
  }))
  return (
    <AppLayout>
      <div className="leader-page leader-analytics-page mx-auto max-w-[1420px] space-y-5">
        <header className="leader-page-heading flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">
              BI del equipo
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Indicadores operativos limitados a {team?.name ?? 'tu equipo'}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void navigate(
                  preview ? '/sistema-visual/jefe/analisis-inteligente' : '/analisis-inteligente',
                )
              }
              className="bg-primary hover:bg-electric-blue flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-extrabold text-white transition"
            >
              <Sparkles className="size-4" />
              Interpretar resultados
            </button>
            <button
              type="button"
              disabled={preview || invalidRange || requests.length === 0}
              onClick={() => downloadRequestsCsv(requests, 'early-fridays-mi-equipo.csv')}
              className="border-border text-primary hover:border-electric-blue flex h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-extrabold transition disabled:opacity-50"
            >
              <Download className="size-4" /> Exportar CSV
            </button>
          </div>
        </header>
        <Card className="leader-filter-panel p-4">
          <fieldset className="grid gap-3 sm:grid-cols-3">
            <legend className="sr-only">Filtros del reporte histórico del equipo</legend>
            <ReportField label="Desde" type="date" value={dateFrom} onChange={setDateFrom} />
            <ReportField label="Hasta" type="date" value={dateTo} onChange={setDateTo} />
            <label className="text-primary text-xs font-extrabold">
              Estado
              <select
                className="input-control mt-2"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as TeamApprovalRequest['status'] | '')
                }
              >
                <option value="">Todos los estados</option>
                {teamReportStatuses.map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
          {invalidRange ? (
            <p className="text-danger mt-3 text-xs font-bold" role="alert">
              La fecha “Desde” no puede ser posterior a la fecha “Hasta”.
            </p>
          ) : (
            <p className="text-muted-foreground mt-3 text-xs">
              {requests.length} solicitudes visibles para el reporte de {team?.name ?? 'tu equipo'}.
            </p>
          )}
        </Card>
        <section className="leader-analytics-metrics grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          <Kpi
            icon={<FileText />}
            label="Total solicitadas"
            value={total}
            detail="En el periodo visible"
            tone="blue"
          />
          <Kpi
            icon={<CheckCircle2 />}
            label="Aprobadas"
            value={approved}
            detail={`${rate}% de decisiones finales`}
            tone="green"
          />
          <Kpi
            icon={<XCircle />}
            label="Rechazadas"
            value={rejected}
            detail={total ? `${Math.round((rejected / total) * 100)}% del total` : '0% del total'}
            tone="red"
          />
          <Kpi
            icon={<Clock3 />}
            label="Pendientes"
            value={pending}
            detail="Requieren seguimiento"
            tone="amber"
          />
          <Kpi
            icon={<BarChart3 />}
            label="Early utilizados"
            value={used}
            detail="Uso confirmado"
            tone="blue"
          />
          <Kpi
            icon={<UserRoundX />}
            label="No beneficiados"
            value={byMember.filter((x) => x.used === 0).length}
            detail="Integrantes sin uso"
            tone="purple"
          />
          <Kpi
            icon={<ArchiveX />}
            label="Cerradas sin beneficio"
            value={statusSummary.closedWithoutBenefit}
            detail="Canceladas o vencidas"
            tone="neutral"
          />
        </section>
        <section className="leader-charts-grid grid gap-5 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-primary font-extrabold">Participación por integrante</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Early utilizados / solicitudes registradas
            </p>
            <div className="mt-6 space-y-5">
              {byMember.map(({ member, total: count, used: memberUsed }) => (
                <div key={member.userId}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-primary font-extrabold">{member.fullName}</span>
                    <span className="text-muted-foreground">
                      {memberUsed} / {count}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="bg-electric-blue h-full rounded-full"
                      style={{ width: `${count ? Math.max(8, (memberUsed / count) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="text-primary font-extrabold">Tasa de aprobación</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Aprobadas sobre decisiones finales; no mezcla solicitudes aún pendientes.
            </p>
            <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
              <div
                className="grid size-44 place-items-center rounded-full"
                style={{ background: `conic-gradient(#14a765 0 ${rate}%, #e9eef6 ${rate}% 100%)` }}
              >
                <div className="grid size-28 place-items-center rounded-full bg-white text-center">
                  <div>
                    <p className="text-primary text-3xl font-extrabold">{rate}%</p>
                    <p className="text-muted-foreground text-xs">Aprobación</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <SummaryDot tone="bg-success" label="Aprobadas" value={approved} />
                <SummaryDot tone="bg-danger" label="Rechazadas" value={rejected} />
                <SummaryDot tone="bg-warning" label="Pendientes" value={pending} />
                <SummaryDot
                  tone="bg-slate-400"
                  label="Cerradas sin beneficio"
                  value={statusSummary.closedWithoutBenefit}
                />
                {statusSummary.unclassified ? (
                  <SummaryDot
                    tone="bg-purple-500"
                    label="Sin clasificar"
                    value={statusSummary.unclassified}
                  />
                ) : null}
              </div>
            </div>
          </Card>
        </section>
        <Card className="p-6">
          <h2 className="text-primary font-extrabold">
            Personas que aún no han utilizado el beneficio
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {byMember
              .filter((item) => item.used === 0)
              .map(({ member }) => (
                <div
                  key={member.userId}
                  className="border-border hover:border-electric-blue/40 flex items-center gap-3 rounded-2xl border p-4 transition"
                >
                  <span className="bg-warning-soft grid size-10 place-items-center rounded-full text-xs font-extrabold text-[#a96800]">
                    {member.fullName
                      .split(' ')
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join('')}
                  </span>
                  <div>
                    <p className="text-primary text-sm font-extrabold">{member.fullName}</p>
                    <p className="text-muted-foreground text-xs">
                      {member.jobTitle} · Nunca utilizado
                    </p>
                  </div>
                </div>
              ))}
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
  tone: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'neutral'
}) {
  const colors = {
    blue: 'bg-info-soft text-electric-blue',
    green: 'bg-success-soft text-success',
    red: 'bg-danger-soft text-danger',
    amber: 'bg-warning-soft text-[#ad6a00]',
    purple: 'bg-[#f2ecff] text-[#7951bd]',
    neutral: 'bg-slate-100 text-slate-600',
  }
  return (
    <Card className="leader-analytics-kpi group min-h-44 p-5">
      <div className={`grid size-11 place-items-center rounded-xl [&>svg]:size-5 ${colors[tone]}`}>
        {icon}
      </div>
      <p className="text-muted-foreground mt-3 min-h-8 text-xs font-bold">{label}</p>
      <p className="text-primary text-3xl leading-none font-extrabold">{value}</p>
      <p className="text-electric-blue mt-3 text-[10px] font-extrabold whitespace-nowrap">
        {detail}
      </p>
    </Card>
  )
}
function SummaryDot({ tone, label, value }: { tone: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground flex items-center gap-2">
        <span className={`size-2.5 rounded-full ${tone}`} />
        {label}
      </span>
      <strong className="text-primary">{value}</strong>
    </div>
  )
}

function ReportField({
  label,
  type,
  value,
  onChange,
}: {
  label: string
  type: 'date'
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="text-primary text-xs font-extrabold">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-control mt-2"
      />
    </label>
  )
}
