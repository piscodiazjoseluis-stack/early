import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, CheckCircle2, ChevronRight, History, XCircle } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { requestPreviewData } from '@/features/requests/data/request-preview-data'
import { getMyRequests } from '@/features/requests/services/request-service'
import type { RequestView } from '@/features/requests/types'
import { sortRequestsByRecency } from '@/features/requests/utils/request-calendar'
import {
  isActiveRequest,
  requestStageSummary,
  requestStatusPresentation,
} from '@/features/requests/utils/request-status'

export function HistoryPage({ preview = false }: { preview?: boolean }) {
  const navigate = useNavigate()
  const requestsQuery = useQuery({
    queryKey: ['my-requests', 'history'],
    queryFn: getMyRequests,
    enabled: !preview,
  })
  const allRequests = useMemo(
    () => (preview ? requestPreviewData : (requestsQuery.data ?? [])),
    [preview, requestsQuery.data],
  )
  const requests = useMemo(() => sortRequestsByRecency(allRequests), [allRequests])
  const active = requests.filter((request) => isActiveRequest(request.status)).length
  const used = requests.filter((request) => request.status === 'USED').length
  const rejected = requests.filter((request) => request.status.includes('REJECTED')).length

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1280px]">
        <header>
          <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">Mi historial</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Trazabilidad completa de todas tus solicitudes, desde el registro hasta su resultado.
          </p>
        </header>

        <section
          className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4"
          aria-label="Resumen histórico"
        >
          <HistoryMetric
            label="Solicitudes registradas"
            value={requests.length}
            icon={<History />}
            tone="info"
          />
          <HistoryMetric
            label="Procesos activos"
            value={active}
            icon={<CalendarCheck />}
            tone="info"
          />
          <HistoryMetric label="Utilizados" value={used} icon={<CheckCircle2 />} tone="success" />
          <HistoryMetric label="Rechazados" value={rejected} icon={<XCircle />} tone="danger" />
        </section>

        <Card className="mt-5 overflow-hidden">
          <div className="border-border border-b p-5 sm:p-6">
            <CardHeader
              title="Resultados anteriores"
              description="Incluye procesos activos y finalizados. Abre un registro para consultar su tracking completo."
              icon={<CalendarCheck className="size-5" />}
            />
          </div>
          {requests.length === 0 && !requestsQuery.isLoading ? (
            <div className="p-10 text-center">
              <History className="text-electric-blue mx-auto size-9" />
              <p className="text-primary mt-3 font-extrabold">Aún no hay solicitudes registradas</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Cuando registres una solicitud aparecerá aquí desde el primer momento.
              </p>
            </div>
          ) : null}
          <div
            className="bounded-records divide-border divide-y"
            aria-label="Historial completo de solicitudes"
          >
            {requests.map((request) => (
              <HistoryRow
                key={request.id}
                request={request}
                onView={() =>
                  void navigate(
                    preview
                      ? `/sistema-visual/solicitudes/${request.id}`
                      : `/solicitudes/${request.id}`,
                    { state: { from: 'history' } },
                  )
                }
              />
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}

export function HistoryPreviewPage() {
  return <HistoryPage preview />
}

function HistoryRow({ request, onView }: { request: RequestView; onView: () => void }) {
  const status = requestStatusPresentation[request.status]
  const decision = getFinalDecision(request)
  return (
    <article className="hover:bg-info-soft/30 group grid gap-4 p-5 transition md:grid-cols-[145px_minmax(0,1fr)_210px_auto] md:items-center">
      <div>
        <p className="text-primary text-sm font-extrabold">{formatDate(request.requestedDate)}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Hora de salida: {request.startTime.slice(0, 5)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-primary text-sm font-bold">
          {request.reason || 'Sin comentario adicional'}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{request.teamName}</p>
        <p className="text-electric-blue mt-1 text-[11px] font-bold">{decision}</p>
      </div>
      <Badge tone={status.tone} className="w-fit">
        {status.label}
      </Badge>
      <button
        type="button"
        onClick={onView}
        className="text-electric-blue hover:bg-info-soft grid size-10 place-items-center rounded-xl transition"
        aria-label={`Ver tracking del ${formatDate(request.requestedDate)}`}
        title="Ver tracking completo"
      >
        <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" />
      </button>
    </article>
  )
}

function getFinalDecision(request: RequestView) {
  if (isActiveRequest(request.status)) {
    const summary = requestStageSummary(request)
    return `${summary.stage} · ${summary.responsible}`
  }
  const lastDecision = request.approvalHistory?.findLast((approval) =>
    ['REJECTED', 'APPROVED'].includes(approval.decision),
  )
  if (request.status === 'USED')
    return lastDecision
      ? `Aprobada por ${lastDecision.approverName}`
      : 'Aprobación final completada'
  if (request.status.includes('REJECTED'))
    return lastDecision ? `Rechazada por ${lastDecision.approverName}` : 'Solicitud rechazada'
  if (request.status === 'CANCELLED') return 'Cancelación aprobada'
  if (request.status === 'NOT_USED') return 'Beneficio confirmado como no utilizado'
  return 'Solicitud vencida sin uso'
}

function HistoryMetric({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: number
  icon: React.ReactNode
  tone: 'info' | 'success' | 'danger' | 'neutral'
}) {
  return (
    <Card className="hover:border-electric-blue/30 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs font-bold">{label}</p>
          <p className="text-primary mt-2 text-3xl font-extrabold">{value}</p>
        </div>
        <span className="text-electric-blue [&>svg]:size-7">{icon}</span>
      </div>
      <Badge tone={tone} className="mt-3">
        Período actual
      </Badge>
    </Card>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}
