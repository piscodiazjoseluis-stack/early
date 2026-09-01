import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, CalendarDays, Clock3, FileText, Send } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'

import { requestPreviewData } from '../data/request-preview-data'
import { getRequestById, resubmitReturnedRequest } from '../services/request-service'
import type { RequestView } from '../types'

export function CorrectReturnedRequestPage({ preview = false }: { preview?: boolean }) {
  const { requestId = '' } = useParams()
  const query = useQuery({
    queryKey: ['request', requestId, 'correction'],
    queryFn: () => getRequestById(requestId),
    enabled: !preview && Boolean(requestId),
  })
  const request = preview
    ? (requestPreviewData.find((item) => item.id === requestId) ??
      requestPreviewData.find((item) => item.status === 'RETURNED_FOR_CORRECTION'))
    : query.data

  if (!request) {
    return (
      <AppLayout>
        <Card className="mx-auto max-w-2xl p-10 text-center">
          <p className="text-primary font-extrabold">
            {query.isLoading ? 'Cargando solicitud...' : 'Solicitud no disponible'}
          </p>
        </Card>
      </AppLayout>
    )
  }
  return <CorrectionForm key={request.id} request={request} preview={preview} />
}

function CorrectionForm({ request, preview }: { request: RequestView; preview: boolean }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [requestedDate, setRequestedDate] = useState(request.requestedDate)
  const [departureTime, setDepartureTime] = useState(request.startTime.slice(0, 5))
  const [reason, setReason] = useState(request.reason ?? '')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'danger'>('danger')
  const observation = request.approvalHistory?.findLast(
    (item) => item.decision === 'RETURNED_FOR_CORRECTION',
  )
  const changed =
    requestedDate !== request.requestedDate ||
    departureTime !== request.startTime.slice(0, 5) ||
    reason.trim() !== (request.reason ?? '').trim()
  const valid = Boolean(
    requestedDate &&
    new Date(`${requestedDate}T12:00:00`).getDay() === 5 &&
    departureTime >= '13:00' &&
    departureTime < '15:00' &&
    reason.trim().length <= 500,
  )

  const mutation = useMutation({
    mutationFn: () => resubmitReturnedRequest(request.id, { requestedDate, departureTime, reason }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-requests'] })
      void navigate(`/solicitudes/${request.id}`)
    },
    onError: (error) => {
      setFeedbackTone('danger')
      setFeedback(error.message)
    },
  })

  function submitCorrection() {
    if (preview) {
      setFeedbackTone('success')
      setFeedback(
        'Demostración completada: la solicitud corregida volvería al jefe directo y conservaría el historial anterior.',
      )
      return
    }
    mutation.mutate()
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1080px]">
        <Button
          variant="ghost"
          onClick={() =>
            void navigate(
              preview ? `/sistema-visual/solicitudes/${request.id}` : `/solicitudes/${request.id}`,
            )
          }
        >
          <ArrowLeft className="size-4" /> Volver al detalle
        </Button>
        <header className="mt-4">
          <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">
            Corregir solicitud
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Compara la información original, corrige lo observado y vuelve a enviarla.
          </p>
        </header>

        <div className="border-warning/30 bg-warning-soft mt-5 flex gap-3 rounded-2xl border p-4">
          <AlertTriangle className="text-warning size-5 shrink-0" />
          <div>
            <p className="text-primary text-sm font-extrabold">Observación del aprobador</p>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              {observation?.comment ??
                'El horario debe comenzar a partir de la 1:00 p. m. Ajusta la hora propuesta antes de reenviar.'}
            </p>
            {observation ? (
              <p className="text-primary/70 mt-2 text-[11px] font-bold">
                {observation.approverName} · {formatDateTime(observation.decidedAt)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
          <Card className="h-fit p-5 sm:p-6">
            <CardHeader title="Información original" icon={<FileText className="size-5" />} />
            <dl className="mt-5 space-y-4 text-sm">
              <OriginalRow label="Viernes solicitado" value={formatDate(request.requestedDate)} />
              <OriginalRow label="Hora de salida" value={request.startTime.slice(0, 5)} />
              <OriginalRow
                label="Comentario"
                value={request.reason || 'Sin comentario adicional'}
              />
            </dl>
            <p className="text-muted-foreground mt-5 text-xs leading-5">
              Este bloque conserva el registro recibido por el aprobador y no puede editarse.
            </p>
          </Card>

          <Card className="p-5 sm:p-6">
            <CardHeader title="Información corregida" icon={<CalendarDays className="size-5" />} />
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="text-primary text-xs font-extrabold">
                Viernes solicitado
                <input
                  type="date"
                  value={requestedDate}
                  onChange={(event) => setRequestedDate(event.target.value)}
                  className="input-control mt-2"
                />
                {requestedDate && new Date(`${requestedDate}T12:00:00`).getDay() !== 5 ? (
                  <span className="text-danger mt-1 block font-medium">Selecciona un viernes.</span>
                ) : null}
              </label>
              <label className="text-primary text-xs font-extrabold">
                Hora de salida propuesta
                <input
                  type="time"
                  min="13:00"
                  max="14:59"
                  value={departureTime}
                  onInput={(event) => setDepartureTime(event.currentTarget.value)}
                  className="input-control mt-2"
                />
                <span className="text-muted-foreground mt-1 block font-medium">
                  Horario permitido: 13:00 a 15:00.
                </span>
              </label>
              <label className="text-primary text-xs font-extrabold sm:col-span-2">
                Comentario
                <textarea
                  rows={4}
                  maxLength={500}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="border-border hover:border-primary/40 focus:border-electric-blue focus:ring-electric-blue/10 mt-2 w-full rounded-xl border p-3 text-sm transition outline-none focus:ring-4"
                />
                <span className="text-muted-foreground mt-1 block text-right font-medium">
                  {reason.length}/500
                </span>
              </label>
            </div>

            <div className="bg-info-soft text-primary mt-5 flex gap-3 rounded-xl p-4 text-xs leading-5">
              <Clock3 className="text-electric-blue size-5 shrink-0" />
              Al reenviar, la solicitud regresará al jefe directo. Se conservarán la versión
              original, la observación y el registro de esta corrección.
            </div>
            {feedback ? (
              <p
                className={`mt-3 text-sm font-bold ${feedbackTone === 'success' ? 'text-success' : 'text-danger'}`}
              >
                {feedback}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end">
              <Button
                disabled={!valid || !changed || mutation.isPending}
                onClick={submitCorrection}
                title={!changed ? 'Realiza al menos un cambio antes de reenviar' : undefined}
              >
                <Send className="size-4" />{' '}
                {mutation.isPending ? 'Reenviando...' : 'Reenviar solicitud'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

export function CorrectReturnedRequestPreviewPage() {
  return <CorrectReturnedRequestPage preview />
}

function OriginalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border border-b pb-3">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-primary mt-1 font-bold">{value}</dd>
    </div>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(date),
  )
}
