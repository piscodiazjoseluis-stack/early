import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'

import { requestPreviewData } from '../data/request-preview-data'
import { confirmRequestUsage, getRequestById } from '../services/request-service'
import type { RequestApprovalView, RequestView } from '../types'
import { requestStatusPresentation } from '../utils/request-status'

type TimelineState = 'completed' | 'active' | 'pending' | 'stopped' | 'skipped'
type TimelineItem = {
  title: string
  detail: string
  state: TimelineState
  approvals?: RequestApprovalView[]
}

export function RequestDetailPage({ preview = false }: { preview?: boolean }) {
  const { requestId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [usageModalOpen, setUsageModalOpen] = useState(false)
  const [usage, setUsage] = useState<'USED' | 'NOT_USED'>('USED')
  const [usageNotes, setUsageNotes] = useState('')
  const requestQuery = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => getRequestById(requestId),
    enabled: !preview && Boolean(requestId),
  })
  const request = preview
    ? (requestPreviewData.find((item) => item.id === requestId) ??
      requestPreviewData.find((item) => item.id === 'preview-23-may'))
    : requestQuery.data
  const usageMutation = useMutation({
    mutationFn: () => confirmRequestUsage(request?.id ?? '', usage, usageNotes),
    onSuccess: async () => {
      setUsageModalOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['request', request?.id] }),
        queryClient.invalidateQueries({ queryKey: ['my-requests'] }),
      ])
    },
  })

  if (!request) {
    return (
      <AppLayout>
        <Card className="mx-auto max-w-2xl p-10 text-center">
          <p className="text-primary font-extrabold">Solicitud no disponible</p>
        </Card>
      </AppLayout>
    )
  }

  const status = requestStatusPresentation[request.status]
  const timeline = buildTimeline(request)
  const observation = request.approvalHistory?.findLast(
    (approval) => approval.decision === 'RETURNED_FOR_CORRECTION',
  )
  const canConfirmUsage =
    request.status === 'FINAL_APPROVED' &&
    new Date(`${request.requestedDate}T${request.endTime}`) <= new Date()
  const returnTarget = getReturnTarget(location.state, preview)

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1280px]">
        <Button variant="ghost" onClick={() => void navigate(returnTarget.path)}>
          <ArrowLeft className="size-4" />
          {returnTarget.label}
        </Button>

        <Card className="mt-4 p-5 sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <p className="text-muted-foreground text-xs font-bold">Detalle de solicitud</p>
              <h1 className="text-primary-strong mt-1 text-2xl font-extrabold">
                Early Friday del {formatDate(request.requestedDate)}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Registrada el {formatDateTime(request.createdAt)}
              </p>
            </div>
            <Badge tone={status.tone} className="h-fit w-fit">
              {status.label}
            </Badge>
          </div>

          <div className="border-border mt-6 grid gap-4 border-t pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <DetailMetric icon={<UsersRound />} label="Equipo" value={request.teamName} />
            <DetailMetric
              icon={<CalendarDays />}
              label="Viernes solicitado"
              value={formatDate(request.requestedDate)}
            />
            <DetailMetric
              icon={<Clock3 />}
              label="Hora de salida propuesta"
              value={request.startTime.slice(0, 5)}
            />
            <DetailMetric
              icon={<ShieldCheck />}
              label="Prioridad"
              value={priorityLabel(request.priority)}
            />
          </div>

          {request.status === 'RETURNED_FOR_CORRECTION' ? (
            <div className="border-warning/30 bg-warning-soft mt-6 rounded-2xl border p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <AlertTriangle className="text-warning size-5 shrink-0" />
                  <div>
                    <p className="text-primary text-sm font-extrabold">
                      Esta solicitud requiere corrección
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      {observation?.comment ??
                        'Revisa la observación, actualiza los datos y vuelve a enviarla.'}
                    </p>
                    {observation ? (
                      <p className="text-primary/70 mt-2 text-[11px] font-bold">
                        Observada por {observation.approverName} ·{' '}
                        {formatDateTime(observation.decidedAt)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Button
                  onClick={() =>
                    void navigate(
                      preview
                        ? `/sistema-visual/solicitudes/${request.id}/corregir`
                        : `/solicitudes/${request.id}/corregir`,
                    )
                  }
                >
                  Corregir solicitud
                </Button>
              </div>
            </div>
          ) : null}
          {canConfirmUsage ? (
            <div className="border-success/30 bg-success-soft mt-6 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-primary text-sm font-extrabold">Confirma el uso del beneficio</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Esta confirmación cierra el proceso y actualiza tu rotación real.
                </p>
              </div>
              <Button onClick={() => setUsageModalOpen(true)}>Confirmar uso</Button>
            </div>
          ) : null}
          {request.status === 'USED' || request.status === 'NOT_USED' ? (
            <div
              className={`mt-6 rounded-2xl border p-4 ${request.status === 'USED' ? 'border-success/30 bg-success-soft' : 'border-border bg-background'}`}
            >
              <p className="text-primary text-sm font-extrabold">
                {request.status === 'USED'
                  ? 'Beneficio utilizado y contabilizado'
                  : 'Beneficio no utilizado'}
              </p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                {request.status === 'USED'
                  ? 'Cuenta como un uso en tu límite anual y en la rotación del equipo.'
                  : 'No consume tu límite anual. Puedes solicitar otro viernes si cumples las reglas vigentes.'}
              </p>
            </div>
          ) : null}
        </Card>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="p-5 sm:p-6">
            <CardHeader title="Información adicional" icon={<FileText className="size-5" />} />
            <dl className="text-muted-foreground mt-5 space-y-4 text-sm">
              <DetailRow label="Motivo" value={request.reason || 'Sin comentario adicional'} />
              <DetailRow label="Nivel actual" value={approvalLevelLabel(request.approvalLevel)} />
              <DetailRow
                label="Fecha de envío"
                value={request.submittedAt ? formatDateTime(request.submittedAt) : 'Borrador'}
              />
            </dl>
          </Card>

          <Card className="p-5 sm:p-6">
            <CardHeader
              title="Seguimiento de la solicitud"
              icon={<ShieldCheck className="size-5" />}
            />
            <p className="text-muted-foreground mt-2 text-xs">
              Selecciona una etapa para consultar su responsable y resultado.
            </p>
            <div className="mt-5 space-y-2">
              {timeline.map((item, index) => (
                <TimelineStep
                  key={item.title}
                  item={item}
                  expanded={expandedStep === index}
                  onToggle={() => setExpandedStep(expandedStep === index ? null : index)}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>
      <Modal
        open={usageModalOpen}
        title="Confirmar uso del beneficio"
        onClose={() => setUsageModalOpen(false)}
        showFooter={false}
      >
        <p className="text-muted-foreground text-sm">
          Indica el resultado real una vez terminado el horario aprobado.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(['USED', 'NOT_USED'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setUsage(option)}
              className={`rounded-xl border p-4 text-sm font-extrabold transition ${usage === option ? 'border-electric-blue bg-info-soft text-electric-blue' : 'border-border text-primary hover:border-electric-blue/50'}`}
            >
              {option === 'USED' ? 'Sí, lo utilicé' : 'No lo utilicé'}
            </button>
          ))}
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          {usage === 'USED'
            ? 'Se contará como un uso anual y actualizará tu rotación.'
            : 'No consumirá cupo anual. Registra el motivo para mantener trazabilidad.'}
        </p>
        <textarea
          value={usageNotes}
          onChange={(event) => setUsageNotes(event.target.value)}
          rows={3}
          maxLength={300}
          placeholder={
            usage === 'NOT_USED'
              ? 'Motivo obligatorio (mínimo 10 caracteres)'
              : 'Comentario opcional'
          }
          className="border-border hover:border-primary/40 focus:border-electric-blue mt-4 w-full rounded-xl border p-3 text-sm transition outline-none"
        />
        {usageMutation.error ? (
          <p className="text-danger mt-2 text-xs">{usageMutation.error.message}</p>
        ) : null}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setUsageModalOpen(false)}>
            Volver
          </Button>
          <Button
            disabled={
              usageMutation.isPending || (usage === 'NOT_USED' && usageNotes.trim().length < 10)
            }
            onClick={() => usageMutation.mutate()}
          >
            {usageMutation.isPending ? 'Guardando...' : 'Confirmar'}
          </Button>
        </div>
      </Modal>
    </AppLayout>
  )
}

export function RequestDetailPreviewPage() {
  return <RequestDetailPage preview />
}

function TimelineStep({
  item,
  expanded,
  onToggle,
}: {
  item: TimelineItem
  expanded: boolean
  onToggle: () => void
}) {
  const complete = item.state === 'completed'
  const active = item.state === 'active'
  const stopped = item.state === 'stopped'
  const skipped = item.state === 'skipped'
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`group w-full rounded-xl border p-3 text-left transition ${active ? 'border-electric-blue/35 bg-info-soft/55' : stopped ? 'border-danger/25 bg-danger-soft/45' : skipped ? 'border-border bg-slate-50/70' : 'hover:border-electric-blue/25 hover:bg-info-soft/30 border-transparent'}`}
      aria-expanded={expanded}
    >
      <span className="flex gap-3">
        <span
          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${complete ? 'border-electric-blue bg-electric-blue text-white' : active ? 'border-electric-blue bg-white' : stopped ? 'border-danger bg-danger-soft text-danger' : skipped ? 'border-slate-300 bg-slate-100 text-slate-500' : 'border-border bg-white'}`}
        >
          {complete ? (
            <Check className="size-3" strokeWidth={3} />
          ) : stopped ? (
            '!'
          ) : skipped ? (
            '—'
          ) : active ? (
            <span className="bg-electric-blue size-1.5 rounded-full" />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2">
            <span className="text-primary flex-1 text-sm font-extrabold">{item.title}</span>
            <ChevronDown
              className={`text-muted-foreground size-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </span>
          <span className="text-muted-foreground mt-1 block text-xs">{item.detail}</span>
          {expanded ? (
            <span className="border-border mt-3 block border-t pt-3 text-xs leading-5">
              {item.approvals?.length ? (
                <span className="space-y-3">
                  {item.approvals.map((approval, index) => (
                    <span key={`${approval.decidedAt}-${index}`} className="block">
                      <strong className="text-primary block">
                        {decisionLabel(approval.decision)} por {approval.approverName}
                      </strong>
                      <span className="text-muted-foreground">
                        {formatDateTime(approval.decidedAt)}
                      </span>
                      {approval.comment ? (
                        <span className="text-primary mt-1 block">“{approval.comment}”</span>
                      ) : null}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Esta etapa todavía no registra una decisión.
                </span>
              )}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  )
}

function buildTimeline(request: RequestView): TimelineItem[] {
  const leaderApprovals =
    request.approvalHistory?.filter((item) => item.level === 'TEAM_LEADER') ?? []
  const portfolioApprovals =
    request.approvalHistory?.filter((item) => item.level === 'PORTFOLIO') ?? []
  const leader = leaderApprovals.at(-1)
  const portfolio = portfolioApprovals.at(-1)
  const rejectedByLeader = request.status === 'REJECTED_BY_TEAM_LEADER'
  const rejectedByPortfolio = request.status === 'REJECTED_BY_PORTFOLIO'
  const rejected = rejectedByLeader || rejectedByPortfolio
  const returned = request.status === 'RETURNED_FOR_CORRECTION'
  const resubmittedToLeader =
    request.status === 'PENDING_TEAM_LEADER' &&
    request.approvalLevel === 'TEAM_LEADER' &&
    leader?.decision === 'RETURNED_FOR_CORRECTION'
  const leaderDone = Boolean(leader?.decision === 'APPROVED')
  const leaderReviewSkipped = !leader && ['PORTFOLIO', 'COMPLETED'].includes(request.approvalLevel)
  const portfolioDone = Boolean(portfolio?.decision === 'APPROVED')
  const finalDone = ['FINAL_APPROVED', 'USED', 'NOT_USED'].includes(request.status)
  const terminalWithoutUse = [
    'REJECTED_BY_TEAM_LEADER',
    'REJECTED_BY_PORTFOLIO',
    'CANCELLED',
    'EXPIRED',
  ].includes(request.status)
  const notified = [
    'FINAL_APPROVED',
    'USED',
    'NOT_USED',
    'REJECTED_BY_TEAM_LEADER',
    'REJECTED_BY_PORTFOLIO',
    'CANCELLED',
    'EXPIRED',
  ].includes(request.status)

  return [
    {
      title: 'Solicitud registrada',
      detail: formatDateTime(request.createdAt),
      state: 'completed',
    },
    {
      title: 'Revisión del jefe directo',
      detail: resubmittedToLeader
        ? `Reenviada · En revisión por ${request.teamLeaderName ?? 'el jefe directo'}`
        : leaderReviewSkipped
          ? 'No aplica · enviada directamente a Portfolio'
          : leader
            ? `${decisionLabel(leader.decision)} · ${leader.approverName}`
            : request.approvalLevel === 'TEAM_LEADER'
              ? `En revisión por ${request.teamLeaderName ?? 'el jefe directo'}`
              : 'Pendiente',
      state: resubmittedToLeader
        ? 'active'
        : leaderReviewSkipped
          ? 'skipped'
          : leaderDone
            ? 'completed'
            : returned
              ? 'active'
              : rejectedByLeader
                ? 'stopped'
                : request.approvalLevel === 'TEAM_LEADER'
                  ? 'active'
                  : 'pending',
      approvals: leaderApprovals,
    },
    {
      title: 'Revisión de Portfolio',
      detail: portfolio
        ? `${decisionLabel(portfolio.decision)} · ${portfolio.approverName}`
        : rejectedByLeader
          ? 'No aplica · el flujo terminó con el rechazo del jefe directo'
          : returned
            ? 'Se reanudará después de la corrección'
            : request.approvalLevel === 'PORTFOLIO'
              ? `En revisión por ${request.portfolioManagerName ?? 'Portfolio Manager'}`
              : 'Pendiente',
      state: rejectedByLeader
        ? 'skipped'
        : portfolioDone
          ? 'completed'
          : rejectedByPortfolio
            ? 'stopped'
            : request.approvalLevel === 'PORTFOLIO' && !returned
              ? 'active'
              : 'pending',
      approvals: portfolioApprovals,
    },
    {
      title: 'Aprobación final',
      detail: finalDone
        ? 'Beneficio aprobado'
        : rejected
          ? 'No aplica · la solicitud fue rechazada'
          : terminalWithoutUse
            ? 'No aplica · el proceso se cerró sin aprobación final'
            : 'Pendiente de las revisiones',
      state: finalDone ? 'completed' : rejected || terminalWithoutUse ? 'skipped' : 'pending',
    },
    {
      title: 'Notificación y calendario',
      detail: notified
        ? finalDone
          ? 'Resultado comunicado y calendario actualizado'
          : 'Resultado comunicado al solicitante'
        : 'Se ejecutará al finalizar el flujo',
      state: notified ? 'completed' : 'pending',
    },
    {
      title: 'Confirmación de uso',
      detail:
        request.status === 'USED'
          ? 'Utilizado · cuenta en el límite anual'
          : request.status === 'NOT_USED'
            ? 'No utilizado · no consume cupo anual'
            : terminalWithoutUse
              ? 'No aplica · el beneficio no quedó habilitado para uso'
              : finalDone
                ? 'Se habilita después del horario aprobado'
                : 'Requiere aprobación final',
      state: ['USED', 'NOT_USED'].includes(request.status)
        ? 'completed'
        : terminalWithoutUse
          ? 'skipped'
          : finalDone
            ? 'active'
            : 'pending',
    },
  ]
}

function DetailMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3">
      <span className="text-electric-blue [&>svg]:size-5">{icon}</span>
      <div>
        <p className="text-muted-foreground text-[11px] font-bold">{label}</p>
        <p className="text-primary mt-1 text-sm font-extrabold">{value}</p>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border flex justify-between gap-4 border-b pb-3">
      <dt>{label}</dt>
      <dd className="text-primary text-right font-bold">{value}</dd>
    </div>
  )
}

function priorityLabel(priority: number | null) {
  if (priority === null) return 'Por calcular'
  if (priority >= 70) return `Alta · ${priority}`
  if (priority >= 45) return `Media · ${priority}`
  return `Baja · ${priority}`
}

function approvalLevelLabel(level: RequestView['approvalLevel']) {
  return {
    NONE: 'Sin revisión activa',
    TEAM_LEADER: 'Jefe directo',
    PORTFOLIO: 'Portfolio',
    COMPLETED: 'Completado',
  }[level]
}

function decisionLabel(decision: RequestApprovalView['decision']) {
  return {
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    RETURNED_FOR_CORRECTION: 'Devuelta para corrección',
    CANCELLATION_REQUESTED: 'Cancelación solicitada',
    CANCELLATION_APPROVED: 'Cancelación aprobada',
  }[decision]
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

function getReturnTarget(state: unknown, preview: boolean) {
  const from = typeof state === 'object' && state && 'from' in state ? state.from : 'requests'
  const prefix = preview ? '/sistema-visual' : ''
  if (from === 'history') return { path: `${prefix}/historial`, label: 'Volver a mi historial' }
  if (from === 'calendar') return { path: `${prefix}/calendario`, label: 'Volver a mi calendario' }
  if (from === 'notifications')
    return { path: `${prefix}/notificaciones`, label: 'Volver a notificaciones' }
  return { path: `${prefix}/solicitudes`, label: 'Volver a mis solicitudes' }
}
