import { useQuery } from '@tanstack/react-query'
import { Check, Eye, Filter, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { requestStatusPresentation } from '@/features/requests/utils/request-status'

import { approvalPreviewRequests } from '../data/approval-preview-data'
import { getPortfolioApprovalRequests, getTeamApprovalRequests } from '../services/approval-service'
import type { TeamApprovalRequest } from '../types'

type StatusFilter = TeamApprovalRequest['status'] | 'ALL'
type PriorityFilter = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNSCORED'

export function ApprovalsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { access } = useAuth()
  const preview = location.pathname.startsWith('/sistema-visual')
  const isPortfolio = Boolean(access?.roles.includes('PORTFOLIO_MANAGER'))
  const initialStatus: StatusFilter = isPortfolio ? 'PENDING_PORTFOLIO' : 'PENDING_TEAM_LEADER'
  const [draftSearch, setDraftSearch] = useState('')
  const [draftStatus, setDraftStatus] = useState<StatusFilter>(initialStatus)
  const [draftPriority, setDraftPriority] = useState<PriorityFilter>('ALL')
  const [filters, setFilters] = useState<{
    search: string
    status: StatusFilter
    priority: PriorityFilter
  }>({ search: '', status: initialStatus, priority: 'ALL' })
  const query = useQuery({
    queryKey: ['approval-requests', isPortfolio ? 'portfolio' : 'leader'],
    queryFn: isPortfolio ? getPortfolioApprovalRequests : getTeamApprovalRequests,
    enabled: !preview && Boolean(access),
  })
  const requests = useMemo(
    () => (preview ? approvalPreviewRequests : (query.data ?? [])),
    [preview, query.data],
  )
  const filtered = useMemo(
    () =>
      requests.filter((request) => {
        const matchesSearch = `${request.requesterName} ${request.teamName}`
          .toLowerCase()
          .includes(filters.search.toLowerCase())
        const matchesStatus = filters.status === 'ALL' || request.status === filters.status
        const matchesPriority = priorityMatches(request.priority, filters.priority)
        return matchesSearch && matchesStatus && matchesPriority
      }),
    [filters, requests],
  )
  const pending = requests.filter((request) => request.status === 'PENDING_TEAM_LEADER').length
  const portfolio = requests.filter((request) =>
    ['APPROVED_BY_TEAM_LEADER', 'PENDING_PORTFOLIO'].includes(request.status),
  ).length
  const to = (id: string) =>
    preview ? `/sistema-visual/jefe/aprobaciones/${id}` : `/aprobaciones/${id}`

  return (
    <AppLayout>
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <div className="flex items-center gap-4">
            <span className="grid size-16 place-items-center rounded-full bg-[#efdce8] text-xl font-extrabold text-[#77355f]">
              {isPortfolio ? 'ML' : 'HR'}
            </span>
            <div>
              <h1 className="text-primary text-3xl font-extrabold">
                Hola, {isPortfolio ? 'María Luisa' : 'Hugo'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isPortfolio
                  ? 'Revisa y resuelve las solicitudes que requieren la decisión final del portfolio.'
                  : 'Revisa y gestiona las solicitudes que requieren tu aprobación.'}
              </p>
            </div>
          </div>

          <Card className="p-5">
            <form
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]"
              onSubmit={(event) => {
                event.preventDefault()
                setFilters({
                  search: draftSearch.trim(),
                  status: draftStatus,
                  priority: draftPriority,
                })
              }}
            >
              <label className="text-primary text-xs font-extrabold">
                Estado
                <select
                  value={draftStatus}
                  onChange={(event) => setDraftStatus(event.target.value as StatusFilter)}
                  className="border-border text-primary mt-2 min-h-11 w-full rounded-xl border bg-white px-3 text-sm"
                >
                  <option value="PENDING_TEAM_LEADER">Pendientes del jefe</option>
                  <option value="ALL">Todos</option>
                  <option value="PENDING_PORTFOLIO">Pendientes de Portfolio</option>
                  <option value="APPROVED_BY_TEAM_LEADER">Aprobadas por el jefe</option>
                  <option value="FINAL_APPROVED">Aprobadas finalmente</option>
                  <option value="USED">Utilizadas</option>
                  <option value="RETURNED_FOR_CORRECTION">Devueltas</option>
                  <option value="REJECTED_BY_TEAM_LEADER">Rechazadas</option>
                  <option value="REJECTED_BY_PORTFOLIO">Rechazadas por Portfolio</option>
                  <option value="CANCELLATION_REQUESTED">Cancelación solicitada</option>
                  <option value="CANCELLED">Canceladas</option>
                  <option value="NOT_USED">No utilizadas</option>
                  <option value="EXPIRED">Vencidas</option>
                </select>
              </label>
              <label className="text-primary text-xs font-extrabold">
                Prioridad
                <select
                  value={draftPriority}
                  onChange={(event) => setDraftPriority(event.target.value as PriorityFilter)}
                  className="border-border text-primary mt-2 min-h-11 w-full rounded-xl border bg-white px-3 text-sm"
                >
                  <option value="ALL">Todas</option>
                  <option value="HIGH">Alta</option>
                  <option value="MEDIUM">Media</option>
                  <option value="LOW">Baja</option>
                  <option value="UNSCORED">Sin calcular</option>
                </select>
              </label>
              <label className="text-primary text-xs font-extrabold">
                Buscar colaborador
                <span className="border-border mt-2 flex min-h-11 items-center gap-2 rounded-xl border px-3">
                  <Search className="text-muted-foreground size-4" />
                  <input
                    value={draftSearch}
                    onChange={(event) => setDraftSearch(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    placeholder="Escribe un nombre..."
                  />
                </span>
              </label>
              <button
                type="submit"
                className="bg-primary hover:bg-electric-blue mt-auto flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-extrabold text-white transition"
              >
                <Filter className="size-4" /> Aplicar filtros
              </button>
            </form>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
              <p className="text-primary text-sm font-extrabold">Solicitudes de colaboradores</p>
              <p className="text-muted-foreground text-xs" aria-live="polite">
                {query.isLoading && !preview
                  ? 'Cargando solicitudes…'
                  : `Mostrando ${filtered.length} de ${requests.length}`}
              </p>
            </div>
            <div className="bounded-records hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-background text-primary text-xs">
                  <tr>
                    <th className="px-5 py-4">Solicitante</th>
                    <th className="px-4 py-4">Equipo</th>
                    <th className="px-4 py-4">Viernes solicitado</th>
                    <th className="px-4 py-4">Hora propuesta</th>
                    <th className="px-4 py-4">Estado</th>
                    <th className="px-4 py-4">Prioridad</th>
                    <th className="px-5 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((request) => (
                    <RequestRow
                      key={request.id}
                      request={request}
                      isPortfolio={isPortfolio}
                      onOpen={() => void navigate(to(request.id))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bounded-records space-y-3 p-4 lg:hidden">
              {filtered.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onOpen={() => void navigate(to(request.id))}
                />
              ))}
            </div>
            {!filtered.length && !(query.isLoading && !preview) ? (
              <div className="p-10 text-center">
                <p className="text-primary font-extrabold">No encontramos solicitudes</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Ajusta los filtros o vuelve más tarde.
                </p>
              </div>
            ) : null}
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <h2 className="text-primary font-extrabold">Resumen de aprobaciones</h2>
            <p className="text-muted-foreground mt-1 text-xs">Datos actualizados en tiempo real</p>
            <div className="mt-5 grid grid-cols-2 divide-x">
              <Summary
                value={query.isLoading && !preview ? '—' : isPortfolio ? portfolio : pending}
                label={isPortfolio ? 'Pendientes finales' : 'Pendientes del jefe'}
                tone="text-[#d88a00]"
              />
              <Summary
                value={
                  query.isLoading && !preview
                    ? '—'
                    : isPortfolio
                      ? requests.filter((request) => request.status === 'FINAL_APPROVED').length
                      : portfolio
                }
                label={isPortfolio ? 'Aprobadas finalmente' : 'Pendientes de Portfolio'}
                tone="text-electric-blue"
              />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-primary font-extrabold">Alertas importantes</h2>
            <div className="bg-warning-soft mt-4 rounded-2xl p-4">
              <p className="text-primary text-sm font-extrabold">
                {isPortfolio ? portfolio : pending} solicitudes por revisar
              </p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                {isPortfolio
                  ? 'La decisión final vuelve a validar elegibilidad, horario, límite anual y cupo del equipo.'
                  : 'Responde oportunamente para que Portfolio tenga tiempo de completar el flujo.'}
              </p>
            </div>
          </Card>
          <Card className="border-electric-blue/20 bg-gradient-to-br from-white to-[#f5f8ff] p-5">
            <div className="flex items-center gap-2">
              <h2 className="text-primary font-extrabold">Sugerencia de IA</h2>
              <Badge tone="info">Próxima etapa</Badge>
            </div>
            <p className="text-muted-foreground mt-3 text-sm leading-6">
              La recomendación mostrará evidencia y nunca tomará la decisión por ti.
            </p>
          </Card>
        </aside>
      </div>
    </AppLayout>
  )
}

function RequestRow({
  request,
  isPortfolio,
  onOpen,
}: {
  request: TeamApprovalRequest
  isPortfolio: boolean
  onOpen: () => void
}) {
  const status = requestStatusPresentation[request.status]
  const isActionable = isPortfolio
    ? request.status === 'PENDING_PORTFOLIO'
    : request.status === 'PENDING_TEAM_LEADER'
  return (
    <tr className="border-border hover:bg-background/70 border-t transition">
      <td className="px-5 py-4">
        <Person request={request} />
      </td>
      <td className="text-muted-foreground px-4 py-4">{request.teamName}</td>
      <td className="text-primary px-4 py-4 font-bold">{formatDate(request.requestedDate)}</td>
      <td className="text-muted-foreground px-4 py-4">
        {request.startTime.slice(0, 5)}–{request.endTime.slice(0, 5)}
      </td>
      <td className="px-4 py-4">
        <Badge tone={status.tone}>{status.label}</Badge>
      </td>
      <td className="px-4 py-4">
        <Badge tone={priorityTone(request.priority)}>{priorityLabel(request.priority)}</Badge>
      </td>
      <td className="px-5 py-4">
        <div className="flex justify-center gap-2">
          {isActionable ? (
            <>
              <Action icon={<Check />} label="Revisar aprobación" tone="success" onClick={onOpen} />
              <Action icon={<X />} label="Revisar rechazo" tone="danger" onClick={onOpen} />
            </>
          ) : null}
          <Action
            icon={<Eye />}
            label={`Ver solicitud de ${request.requesterName}`}
            tone="info"
            onClick={onOpen}
          />
        </div>
      </td>
    </tr>
  )
}
function RequestCard({ request, onOpen }: { request: TeamApprovalRequest; onOpen: () => void }) {
  const status = requestStatusPresentation[request.status]
  return (
    <article className="border-border rounded-2xl border p-4">
      <div className="flex items-center gap-3">
        <Person request={request} />
        <button
          type="button"
          onClick={onOpen}
          className="border-border text-primary ml-auto grid size-10 place-items-center rounded-xl border"
          aria-label={`Ver solicitud de ${request.requesterName}`}
        >
          <Eye className="size-4" />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={status.tone}>{status.label}</Badge>
        <Badge tone={priorityTone(request.priority)}>{priorityLabel(request.priority)}</Badge>
        <Badge>{formatDate(request.requestedDate)}</Badge>
      </div>
    </article>
  )
}
function Person({ request }: { request: TeamApprovalRequest }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f0e7e3] text-xs font-extrabold text-[#6e4436]">
        {request.requesterName
          .split(' ')
          .slice(0, 2)
          .map((part) => part[0])
          .join('')}
      </span>
      <div className="min-w-0">
        <p className="text-primary truncate font-extrabold">{request.requesterName}</p>
        <p className="text-muted-foreground truncate text-xs">{request.requesterJobTitle}</p>
      </div>
    </div>
  )
}
function Action({
  icon,
  label,
  tone,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  tone: 'success' | 'danger' | 'info'
  onClick: () => void
}) {
  const colors = {
    success: 'border-success/30 text-success hover:bg-success-soft',
    danger: 'border-danger/30 text-danger hover:bg-danger-soft',
    info: 'border-border text-primary hover:bg-info-soft',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid size-9 place-items-center rounded-lg border transition [&>svg]:size-4 ${colors[tone]}`}
      aria-label={label}
    >
      {icon}
    </button>
  )
}
function Summary({ value, label, tone }: { value: number | string; label: string; tone: string }) {
  return (
    <div className="px-3 text-center">
      <p className={`text-3xl font-extrabold ${tone}`}>{value}</p>
      <p className="text-muted-foreground mt-1 text-xs leading-4">{label}</p>
    </div>
  )
}
function priorityLabel(value: number | null) {
  return value === null ? 'Sin calcular' : value >= 70 ? 'Alta' : value >= 45 ? 'Media' : 'Baja'
}
function priorityTone(value: number | null): 'danger' | 'warning' | 'neutral' {
  return value !== null && value >= 70
    ? 'danger'
    : value !== null && value >= 45
      ? 'warning'
      : 'neutral'
}
function priorityMatches(value: number | null, filter: PriorityFilter) {
  if (filter === 'ALL') return true
  if (filter === 'UNSCORED') return value === null
  if (value === null) return false
  if (filter === 'HIGH') return value >= 70
  if (filter === 'MEDIUM') return value >= 45 && value < 70
  return value < 45
}
function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}
