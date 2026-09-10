import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  ChevronRight,
  CircleHelp,
  FilePlus2,
  FileText,
  Search,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'

import { requestPreviewData } from '../data/request-preview-data'
import { cancelRequest, getMyRequests } from '../services/request-service'
import type { RequestView } from '../types'
import {
  canCancelRequest,
  isActiveRequest,
  isUsageConfirmationDue,
  requestStageSummary,
  requestStatusPresentation,
} from '../utils/request-status'

export function MyRequestsPage({ preview = false }: { preview?: boolean }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [cancelTarget, setCancelTarget] = useState<RequestView | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [previewMessage, setPreviewMessage] = useState<string | null>(null)
  const requestsQuery = useQuery({
    queryKey: ['my-requests'],
    queryFn: getMyRequests,
    enabled: !preview,
  })
  const allRequests = useMemo(
    () => (preview ? requestPreviewData : (requestsQuery.data ?? [])),
    [preview, requestsQuery.data],
  )
  const requests = useMemo(
    () => allRequests.filter((request) => isActiveRequest(request.status)),
    [allRequests],
  )
  const filteredRequests = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es')
    if (!normalized) return requests
    return requests.filter((request) => {
      const status = requestStatusPresentation[request.status].label
      return `${request.teamName} ${status} ${request.reason ?? ''}`
        .toLocaleLowerCase('es')
        .includes(normalized)
    })
  }, [query, requests])

  const cancellationMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
      cancelRequest(requestId, reason),
    onSuccess: async () => {
      setCancelTarget(null)
      setCancelReason('')
      await queryClient.invalidateQueries({ queryKey: ['my-requests'] })
    },
  })

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1420px]">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">
              Mis solicitudes
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Gestiona solicitudes activas, revisiones y correcciones pendientes.
            </p>
          </div>
          <Button
            onClick={() =>
              void navigate(preview ? '/sistema-visual/solicitudes/nueva' : '/solicitudes/nueva')
            }
          >
            <FilePlus2 className="size-4" />
            Nueva solicitud
          </Button>
        </header>

        <section
          className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4"
          aria-label="Resumen de solicitudes"
        >
          <SummaryCard label="Activas" value={requests.length} tone="info" />
          <SummaryCard
            label="Pendientes de aprobación"
            value={
              requests.filter(
                (request) =>
                  request.status.startsWith('PENDING') ||
                  request.status === 'APPROVED_BY_TEAM_LEADER',
              ).length
            }
            tone="warning"
          />
          <SummaryCard
            label="Requieren tu acción"
            value={
              requests.filter((request) => request.status === 'RETURNED_FOR_CORRECTION').length
            }
            tone="warning"
          />
          <SummaryCard
            label="Pendientes de confirmar uso"
            value={
              requests.filter(
                (request) =>
                  request.status === 'FINAL_APPROVED' &&
                  isUsageConfirmationDue(request.requestedDate, request.endTime),
              ).length
            }
            tone="success"
          />
        </section>

        <details className="group border-border mt-4 rounded-2xl border bg-white px-4 py-3 shadow-sm">
          <summary className="text-primary hover:text-electric-blue flex cursor-pointer list-none items-center gap-2 text-sm font-bold transition">
            <CircleHelp className="text-electric-blue size-4" />
            ¿Qué significa cada estado?
            <ChevronRight className="ml-auto size-4 transition-transform group-open:rotate-90" />
          </summary>
          <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4">
            <StatusMeaning tone="warning" label="Requiere corrección:">
              El aprobador devolvió la solicitud. Puedes editarla y reenviarla.
            </StatusMeaning>
            <StatusMeaning tone="info" label="Pendiente del jefe:">
              Tu jefe directo debe revisar y decidir la solicitud.
            </StatusMeaning>
            <StatusMeaning tone="warning" label="Pendiente de Portfolio:">
              El jefe directo ya aprobó; falta la decisión de Portfolio.
            </StatusMeaning>
            <StatusMeaning tone="success" label="Aprobada:">
              El flujo terminó y solo falta confirmar si utilizaste el beneficio.
            </StatusMeaning>
          </div>
        </details>

        <Card className="mt-5 overflow-hidden">
          <div className="border-border flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FileText className="text-electric-blue size-5" />
              <h2 className="text-primary font-extrabold">Solicitudes activas</h2>
            </div>
            <label className="border-border focus-within:border-electric-blue flex h-11 items-center gap-2 rounded-xl border px-3">
              <Search className="text-muted-foreground size-4" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar solicitudes"
                className="min-w-0 bg-transparent text-sm outline-none"
              />
            </label>
          </div>
          {requestsQuery.isLoading && !preview ? (
            <p className="text-muted-foreground p-8 text-center text-sm">Cargando solicitudes...</p>
          ) : null}
          {!requestsQuery.isLoading && filteredRequests.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarDays className="text-electric-blue mx-auto size-9" />
              <p className="text-primary mt-3 font-extrabold">No tienes solicitudes activas</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Los procesos terminados permanecen disponibles en Mi historial.
              </p>
            </div>
          ) : null}
          <div className="bounded-records divide-border divide-y" aria-label="Solicitudes activas">
            {filteredRequests.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                onView={() =>
                  void navigate(
                    preview
                      ? `/sistema-visual/solicitudes/${request.id}`
                      : `/solicitudes/${request.id}`,
                    { state: { from: 'requests' } },
                  )
                }
                onCancel={() => setCancelTarget(request)}
              />
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={Boolean(cancelTarget)}
        title="Cancelar solicitud"
        onClose={() => setCancelTarget(null)}
        showFooter={false}
      >
        <p className="text-muted-foreground text-sm">
          Indica el motivo. La autorización requerida dependerá del estado actual.
        </p>
        <textarea
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          rows={4}
          placeholder="Motivo de cancelación"
          className="border-border focus:border-electric-blue mt-4 w-full rounded-xl border p-3 text-sm outline-none"
        />
        {cancellationMutation.error ? (
          <p className="text-danger mt-2 text-xs">{cancellationMutation.error.message}</p>
        ) : null}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setCancelTarget(null)}>
            Volver
          </Button>
          <Button
            variant="danger"
            disabled={cancelReason.trim().length < 5 || cancellationMutation.isPending}
            onClick={() => {
              if (!cancelTarget) return
              if (preview) {
                setPreviewMessage(
                  'Demostración completada: se enviaría una solicitud de cancelación; el registro no se elimina.',
                )
                setCancelTarget(null)
                setCancelReason('')
                return
              }
              cancellationMutation.mutate({
                requestId: cancelTarget.id,
                reason: cancelReason.trim(),
              })
            }}
          >
            Confirmar cancelación
          </Button>
        </div>
        {preview ? (
          <p className="text-muted-foreground mt-3 text-center text-[11px]">
            Esta confirmación es demostrativa y no modifica datos.
          </p>
        ) : null}
      </Modal>
      {previewMessage ? (
        <button
          type="button"
          onClick={() => setPreviewMessage(null)}
          className="bg-primary fixed right-5 bottom-5 z-40 max-w-sm rounded-2xl px-4 py-3 text-left text-sm font-bold text-white shadow-xl"
        >
          {previewMessage}
        </button>
      ) : null}
    </AppLayout>
  )
}

export function MyRequestsPreviewPage() {
  return <MyRequestsPage preview />
}

function RequestRow({
  request,
  onView,
  onCancel,
}: {
  request: RequestView
  onView: () => void
  onCancel: () => void
}) {
  const presentation = requestStatusPresentation[request.status]
  const stage = requestStageSummary(request)
  const stageDetail = stage.responsible.startsWith('Sin acción')
    ? stage.responsible
    : `Pendiente de ${stage.responsible}`
  return (
    <article className="hover:bg-info-soft/35 grid gap-4 p-5 transition sm:grid-cols-[145px_minmax(0,1fr)_210px_auto] sm:items-center">
      <div>
        <p className="text-primary text-sm font-extrabold">{formatDate(request.requestedDate)}</p>
        <p className="text-muted-foreground mt-1 text-[11px]">
          Hora de salida: {request.startTime.slice(0, 5)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-primary truncate text-sm font-bold">
          {request.reason || 'Sin comentario adicional'}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{request.teamName}</p>
        <p className="text-electric-blue mt-1 text-[11px] font-bold">
          {stage.stage} · {stageDetail}
        </p>
      </div>
      <Badge tone={presentation.tone} className="w-fit">
        {presentation.label}
      </Badge>
      <div className="flex justify-end gap-2">
        {canCancelRequest(request.status) ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-muted-foreground hover:bg-danger-soft hover:text-danger grid size-9 place-items-center rounded-lg transition"
            aria-label={`Cancelar solicitud del ${formatDate(request.requestedDate)}`}
            title="Cancelar solicitud"
          >
            <XCircle className="size-4" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onView}
          className="text-electric-blue hover:bg-info-soft grid size-9 place-items-center rounded-lg transition"
          aria-label={`Ver solicitud del ${formatDate(request.requestedDate)}`}
          title="Ver detalle y seguimiento"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </article>
  )
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'info' | 'warning' | 'success' | 'danger'
}) {
  return (
    <Card className="p-5">
      <p className="text-muted-foreground text-xs font-bold">{label}</p>
      <p className="text-primary mt-2 text-3xl font-extrabold">{value}</p>
      <Badge tone={tone} className="mt-3">
        Solicitudes
      </Badge>
    </Card>
  )
}

function StatusMeaning({
  tone,
  label,
  children,
}: {
  tone: 'info' | 'warning' | 'success'
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="hover:border-electric-blue/35 rounded-xl border border-transparent p-2 transition">
      <Badge tone={tone}>{label}</Badge>
      <p className="text-muted-foreground mt-2 leading-5">{children}</p>
    </div>
  )
}
function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}
