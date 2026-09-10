import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleHelp,
  Clock3,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { confirmRequestUsage, getEligibility } from '@/features/requests/services/request-service'
import { requestStatusPresentation } from '@/features/requests/utils/request-status'
import { getTeams } from '@/features/teams/services/team-service'

import { approvalPreviewRequests } from '../data/approval-preview-data'
import {
  approveAsTeamLeader,
  approveAsPortfolio,
  getTeamApprovalRequest,
  getTeamApprovalRequests,
  rejectAsTeamLeader,
  returnForCorrectionAsTeamLeader,
} from '../services/approval-service'

type DecisionMode = 'approve' | 'reject' | 'return' | null
type TimelineState = 'completed' | 'active' | 'pending' | 'failed' | 'skipped'

export function ApprovalDetailPage() {
  const { requestId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { access } = useAuth()
  const preview = location.pathname.startsWith('/sistema-visual')
  const isPortfolio = Boolean(access?.roles.includes('PORTFOLIO_MANAGER'))
  const [decision, setDecision] = useState<DecisionMode>(null)
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')
  const [usageModalOpen, setUsageModalOpen] = useState(false)
  const [usage, setUsage] = useState<'USED' | 'NOT_USED'>('USED')
  const [usageNotes, setUsageNotes] = useState('')
  const [renderedAt] = useState(() => Date.now())
  const requestQuery = useQuery({
    queryKey: ['team-approval-request', requestId],
    queryFn: () => getTeamApprovalRequest(requestId),
    enabled: !preview && Boolean(requestId),
  })
  const request = preview
    ? (approvalPreviewRequests.find((item) => item.id === requestId) ?? approvalPreviewRequests[0])
    : requestQuery.data
  const teamRequestsQuery = useQuery({
    queryKey: ['team-leader-requests'],
    queryFn: getTeamApprovalRequests,
    enabled: !preview,
  })
  const teamsQuery = useQuery({
    queryKey: ['teams', 'approval-detail'],
    queryFn: getTeams,
    enabled: !preview,
  })
  const eligibilityQuery = useQuery({
    queryKey: ['approval-eligibility', request?.requesterId, request?.requestedDate],
    queryFn: () =>
      request
        ? getEligibility(request.requesterId, request.requestedDate)
        : Promise.reject(new Error('Solicitud no disponible')),
    enabled: !preview && Boolean(request),
  })
  const eligibility = preview
    ? {
        eligible: true,
        reasons: [],
        score: request?.priority ?? 70,
        uses: 1,
        last_used_date: '2026-05-16',
        evidence: [
          'Membresía activa y elegible',
          'Sin conflicto de calendario',
          'Dentro del límite anual',
        ],
      }
    : eligibilityQuery.data
  const back = preview ? '/sistema-visual/jefe/aprobaciones' : '/aprobaciones'
  const mutation = useMutation({
    mutationFn: async () => {
      if (!request) throw new Error('Solicitud no disponible')
      if (decision === 'approve')
        return isPortfolio ? approveAsPortfolio(request.id) : approveAsTeamLeader(request.id)
      if (decision === 'reject') return rejectAsTeamLeader(request.id, reason, comment)
      if (decision === 'return') return returnForCorrectionAsTeamLeader(request.id, reason, comment)
      throw new Error('Selecciona una decisión')
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['approval-requests'] })
      await queryClient.invalidateQueries({ queryKey: ['portfolio-workspace'] })
      await queryClient.invalidateQueries({ queryKey: ['team-approval-request', requestId] })
      setDecision(null)
      setReason('')
      setComment('')
      void navigate(back)
    },
  })
  const usageMutation = useMutation({
    mutationFn: () => confirmRequestUsage(request?.id ?? '', usage, usageNotes.trim()),
    onSuccess: async () => {
      setUsageModalOpen(false)
      setUsageNotes('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['team-approval-request', requestId] }),
        queryClient.invalidateQueries({ queryKey: ['approval-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['portfolio-workspace'] }),
      ])
    },
  })

  if (!preview && requestQuery.isError)
    return (
      <AppLayout>
        <Card className="p-8 text-center" role="alert">
          <p className="text-primary text-lg font-extrabold">No pudimos cargar la solicitud</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Comprueba tu conexión o vuelve a la bandeja de aprobaciones.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button variant="secondary" onClick={() => void navigate(back)}>
              Volver
            </Button>
            <Button onClick={() => void requestQuery.refetch()}>Reintentar</Button>
          </div>
        </Card>
      </AppLayout>
    )

  if (!request)
    return (
      <AppLayout>
        <Card className="p-8">
          <p className="text-primary font-extrabold">Cargando solicitud…</p>
        </Card>
      </AppLayout>
    )

  const isPending = isPortfolio
    ? request.status === 'PENDING_PORTFOLIO' && request.requesterId !== access?.profile.id
    : request.status === 'PENDING_TEAM_LEADER' && request.requesterId !== access?.profile.id
  const teamRequests = preview ? approvalPreviewRequests : (teamRequestsQuery.data ?? [])
  const sameDateRequests = teamRequests.filter(
    (item) =>
      item.id !== request.id &&
      item.teamName === request.teamName &&
      item.requestedDate === request.requestedDate,
  )
  const hasFinalConflict = sameDateRequests.some((item) =>
    ['FINAL_APPROVED', 'USED', 'NOT_USED'].includes(item.status),
  )
  const competingRequests = sameDateRequests.filter((item) =>
    ['PENDING_TEAM_LEADER', 'PENDING_PORTFOLIO', 'APPROVED_BY_TEAM_LEADER'].includes(item.status),
  ).length
  const teamMemberCount = preview
    ? 2
    : (teamsQuery.data?.find((item) => item.name === request.teamName)?.members.length ?? 0)
  const requestTeam = teamsQuery.data?.find((item) => item.name === request.teamName)
  const isLeaderOwnRequest = requestTeam?.leaderUserId === request.requesterId
  const terminalOutcome = [
    'REJECTED_BY_TEAM_LEADER',
    'REJECTED_BY_PORTFOLIO',
    'CANCELLED',
    'USED',
    'NOT_USED',
    'EXPIRED',
  ].includes(request.status)
  const finalApproved = ['FINAL_APPROVED', 'USED', 'NOT_USED'].includes(request.status)
  const scheduleValid =
    request.startTime >= request.permittedStartTime &&
    request.startTime < request.permittedEndTime &&
    request.endTime === request.permittedEndTime
  const status = requestStatusPresentation[request.status]
  const usageConfirmationDue =
    request.status === 'FINAL_APPROVED' &&
    renderedAt >= new Date(`${request.requestedDate}T${request.endTime}`).getTime()

  return (
    <AppLayout>
      <div className="space-y-5 pb-24">
        <button
          type="button"
          onClick={() => void navigate(back)}
          className="text-primary hover:text-electric-blue flex items-center gap-2 text-sm font-extrabold transition"
        >
          <ArrowLeft className="size-4" /> Volver a aprobaciones
        </button>
        <Card className="p-5 sm:p-6">
          <div className="lg:divide-border grid gap-5 lg:grid-cols-[1.25fr_repeat(4,minmax(0,1fr))] lg:divide-x">
            <div className="flex items-center gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[#f1ded9] text-xl font-extrabold text-[#8a4c40]">
                {initials(request.requesterName)}
              </span>
              <div>
                <h1 className="text-primary text-2xl font-extrabold">{request.requesterName}</h1>
                <p className="text-muted-foreground mt-1 text-sm">{request.requesterJobTitle}</p>
              </div>
            </div>
            <Metric label="Equipo" value={request.teamName} icon={<UsersRound />} />
            <Metric
              label="Viernes solicitado"
              value={formatDate(request.requestedDate)}
              icon={<CalendarDays />}
            />
            <Metric
              label="Horario propuesto"
              value={`${request.startTime.slice(0, 5)}–${request.endTime.slice(0, 5)}`}
              icon={<Clock3 />}
            />
            <div className="flex flex-col justify-center lg:px-5">
              <p className="text-muted-foreground text-xs font-bold">Estado actual</p>
              <Badge tone={status.tone} className="mt-2">
                {status.label}
              </Badge>
              <p className="text-muted-foreground mt-2 text-xs">
                {isPending ? 'Esperando tu decisión' : 'Decisión registrada'}
              </p>
            </div>
          </div>
        </Card>

        {usageConfirmationDue ? (
          <Card className="border-warning/30 bg-warning-soft/45 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-primary font-extrabold">Confirmación de uso pendiente</h2>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                El horario aprobado ya terminó. Registra si el beneficio se utilizó; “no utilizado”
                no consume el cupo anual.
              </p>
            </div>
            <Button onClick={() => setUsageModalOpen(true)}>Registrar resultado</Button>
          </Card>
        ) : null}

        {request.status === 'USED' || request.status === 'NOT_USED' ? (
          <Card
            className={`p-5 ${request.status === 'USED' ? 'border-success/30 bg-success-soft/40' : 'border-border bg-background'}`}
          >
            <h2 className="text-primary font-extrabold">
              {request.status === 'USED'
                ? 'Beneficio utilizado y contabilizado'
                : 'Beneficio no utilizado'}
            </h2>
            <p className="text-muted-foreground mt-1 text-xs">
              {request.status === 'USED'
                ? 'Este registro cuenta en la rotación y en el límite anual.'
                : 'No consume el límite anual; la persona puede solicitar otro viernes sujeto a las reglas vigentes.'}
            </p>
          </Card>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr_0.95fr]">
          <div className="space-y-5">
            <Card className="border-electric-blue/20 bg-gradient-to-br from-white to-[#f5f8ff] p-5">
              <div className="flex items-center gap-3">
                <Sparkles className="text-electric-blue size-5" />
                <h2 className="text-primary font-extrabold">Recomendación explicable</h2>
                <Badge tone="info">Reglas</Badge>
              </div>
              <h3 className="text-primary mt-5 text-xl font-extrabold">
                {eligibility?.eligible
                  ? 'La solicitud cumple las reglas base'
                  : 'Requiere revisión adicional'}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                La decisión sigue siendo tuya. Esta tarjeta resume evidencia determinística y no
                aprueba automáticamente.
              </p>
              <ul className="mt-4 space-y-2">
                {(
                  eligibility?.evidence ?? [
                    'Prioridad calculada por rotación',
                    'Membresía activa en el equipo',
                  ]
                ).map((item) => (
                  <li key={item} className="text-primary flex gap-2 text-sm">
                    <Check className="text-success mt-0.5 size-4 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-5">
              <h2 className="text-primary font-extrabold">Información adicional</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <Row label="Motivo" value={request.reason ?? 'Sin comentario'} />
                <Row
                  label="Prioridad calculada"
                  value={`${priorityLabel(request.priority)}${request.priority === null ? '' : ` · ${request.priority}`}`}
                />
                <Row
                  label="Último uso registrado"
                  value={
                    eligibility?.last_used_date
                      ? formatDate(eligibility.last_used_date)
                      : 'Sin usos previos'
                  }
                />
                <Row
                  label="Fecha de envío"
                  value={request.submittedAt ? formatDateTime(request.submittedAt) : 'Sin fecha'}
                />
              </dl>
            </Card>
          </div>
          <div className="space-y-5">
            <Card className="p-5">
              <h2 className="text-primary font-extrabold">Validaciones de negocio</h2>
              <div className="mt-4 space-y-2">
                <Validation
                  label="Elegibilidad y disponibilidad"
                  valid={eligibility?.eligible ?? false}
                />
                <Validation
                  label="Límite anual de Early Fridays"
                  valid={(eligibility?.uses ?? 0) < 6}
                />
                <Validation label="Cupo final del equipo" valid={!hasFinalConflict} />
                <Validation label="Rotación del equipo" valid={request.priority !== null} />
                <Validation label="Política de horario propuesto" valid={scheduleValid} />
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-primary font-extrabold">Impacto en el equipo</h2>
              <div className="mt-5 grid grid-cols-3 divide-x text-center">
                <Impact value={String(teamMemberCount)} label="Integrantes" />
                <Impact
                  value={String(sameDateRequests.length + 1)}
                  label="Solicitudes de la fecha"
                />
                <Impact value={String(competingRequests)} label="Competidoras pendientes" />
              </div>
            </Card>
          </div>
          <Card className="p-5">
            <h2 className="text-primary font-extrabold">Línea de tiempo de la solicitud</h2>
            <div className="mt-5 space-y-5">
              <Timeline
                label="Solicitud registrada"
                detail={request.submittedAt ? formatDateTime(request.submittedAt) : 'Registrada'}
                state="completed"
              />
              <Timeline
                label="Revisión del jefe directo"
                detail={
                  isLeaderOwnRequest
                    ? 'No aplica: solicitud del jefe directo'
                    : request.status === 'REJECTED_BY_TEAM_LEADER'
                      ? 'Solicitud rechazada por el jefe directo'
                      : request.status === 'RETURNED_FOR_CORRECTION'
                        ? 'Devuelta para corrección'
                        : request.approvalLevel === 'PORTFOLIO' ||
                            request.approvalLevel === 'COMPLETED'
                          ? `Aprobada por ${request.teamName}`
                          : 'Pendiente de decisión'
                }
                state={
                  isLeaderOwnRequest
                    ? 'skipped'
                    : request.status === 'REJECTED_BY_TEAM_LEADER'
                      ? 'failed'
                      : request.status === 'RETURNED_FOR_CORRECTION' ||
                          request.status === 'PENDING_TEAM_LEADER'
                        ? 'active'
                        : request.approvalLevel === 'PORTFOLIO' ||
                            request.approvalLevel === 'COMPLETED'
                          ? 'completed'
                          : 'pending'
                }
              />
              <Timeline
                label="Decisión de Portfolio"
                detail={
                  request.status === 'REJECTED_BY_TEAM_LEADER'
                    ? 'No aplica: el flujo terminó en la revisión del jefe directo'
                    : request.status === 'REJECTED_BY_PORTFOLIO'
                      ? 'Solicitud rechazada por Portfolio'
                      : finalApproved
                        ? 'Decisión final completada'
                        : request.status === 'PENDING_PORTFOLIO' ||
                            request.status === 'APPROVED_BY_TEAM_LEADER'
                          ? isPortfolio && isPending
                            ? 'Esperando tu decisión final'
                            : 'Pendiente de decisión final'
                          : 'Siguiente etapa'
                }
                state={
                  request.status === 'REJECTED_BY_TEAM_LEADER'
                    ? 'skipped'
                    : request.status === 'REJECTED_BY_PORTFOLIO'
                      ? 'failed'
                      : finalApproved
                        ? 'completed'
                        : request.status === 'PENDING_PORTFOLIO' ||
                            request.status === 'APPROVED_BY_TEAM_LEADER'
                          ? 'active'
                          : 'pending'
                }
              />
              <Timeline
                label="Notificación al solicitante"
                detail={
                  terminalOutcome || finalApproved || request.status === 'RETURNED_FOR_CORRECTION'
                    ? 'Resultado notificado al solicitante'
                    : 'Se completará cuando exista una decisión o devolución'
                }
                state={
                  terminalOutcome || finalApproved || request.status === 'RETURNED_FOR_CORRECTION'
                    ? 'completed'
                    : 'pending'
                }
              />
              <Timeline
                label="Confirmación de uso"
                detail={
                  request.status === 'USED'
                    ? 'Uso confirmado y contabilizado'
                    : request.status === 'NOT_USED'
                      ? 'No utilizado; no consume el límite anual'
                      : [
                            'REJECTED_BY_TEAM_LEADER',
                            'REJECTED_BY_PORTFOLIO',
                            'CANCELLED',
                            'EXPIRED',
                          ].includes(request.status)
                        ? 'No aplica: el beneficio no quedó disponible para uso'
                        : request.status === 'FINAL_APPROVED'
                          ? 'Se habilita al terminar el horario aprobado'
                          : 'Requiere aprobación final'
                }
                state={
                  ['USED', 'NOT_USED'].includes(request.status)
                    ? 'completed'
                    : [
                          'REJECTED_BY_TEAM_LEADER',
                          'REJECTED_BY_PORTFOLIO',
                          'CANCELLED',
                          'EXPIRED',
                        ].includes(request.status)
                      ? 'skipped'
                      : request.status === 'FINAL_APPROVED'
                        ? 'active'
                        : 'pending'
                }
              />
            </div>
          </Card>
        </div>
      </div>

      {isPending ? (
        <div className="border-border fixed right-0 bottom-0 left-0 z-20 border-t bg-white/95 p-4 shadow-[0_-10px_30px_rgb(6_27_69/8%)] backdrop-blur lg:left-[274px]">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setDecision('return')}
              className="sm:mr-auto"
            >
              <CircleHelp className="size-5" /> Solicitar información
            </Button>
            <Button
              variant="secondary"
              onClick={() => setDecision('reject')}
              className="border-danger/40 text-danger hover:border-danger hover:text-danger"
            >
              <X className="size-5" /> Rechazar
            </Button>
            <Button onClick={() => setDecision('approve')}>
              <ShieldCheck className="size-5" /> Aprobar
            </Button>
          </div>
        </div>
      ) : null}

      <Modal
        open={decision !== null}
        title={
          decision === 'approve'
            ? 'Aprobar solicitud'
            : decision === 'reject'
              ? 'Rechazar solicitud'
              : 'Solicitar corrección'
        }
        onClose={() => setDecision(null)}
        showFooter={false}
      >
        <p className="text-muted-foreground text-sm leading-6">
          {decision === 'approve'
            ? isPortfolio
              ? 'La solicitud quedará aprobada finalmente y se registrará en el calendario global.'
              : 'La solicitud avanzará a Portfolio Manager para la decisión final.'
            : 'Registra un motivo y un comentario claro para el colaborador.'}
        </p>
        {decision !== 'approve' ? (
          <div className="mt-4 space-y-4">
            <label className="text-primary block text-sm font-extrabold">
              Motivo
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="border-border mt-2 min-h-11 w-full rounded-xl border px-3 font-normal"
                placeholder="Motivo de la decisión"
              />
            </label>
            <label className="text-primary block text-sm font-extrabold">
              Comentario
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className="border-border mt-2 min-h-24 w-full rounded-xl border p-3 font-normal"
                placeholder="Explica qué debe corregirse"
              />
            </label>
          </div>
        ) : null}
        {mutation.error ? (
          <p role="alert" className="text-danger mt-4 text-sm font-bold">
            {mutation.error.message}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDecision(null)}>
            Volver
          </Button>
          <Button
            variant={decision === 'reject' ? 'danger' : 'primary'}
            disabled={
              mutation.isPending || (decision !== 'approve' && (!reason.trim() || !comment.trim()))
            }
            onClick={() => (preview ? setDecision(null) : mutation.mutate())}
          >
            {mutation.isPending
              ? 'Procesando…'
              : decision === 'approve'
                ? isPortfolio
                  ? 'Confirmar aprobación final'
                  : 'Aprobar y enviar a Portfolio'
                : decision === 'reject'
                  ? 'Confirmar rechazo'
                  : 'Devolver para corrección'}
          </Button>
        </div>
      </Modal>
      <Modal
        open={usageModalOpen}
        title="Registrar resultado del Early Friday"
        onClose={() => setUsageModalOpen(false)}
        showFooter={false}
      >
        <p className="text-muted-foreground text-sm leading-6">
          Selecciona el resultado real después del horario aprobado. La acción queda auditada.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(['USED', 'NOT_USED'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setUsage(option)}
              className={`rounded-xl border p-4 text-sm font-extrabold transition ${usage === option ? 'border-electric-blue bg-info-soft text-electric-blue' : 'border-border text-primary hover:border-electric-blue/50'}`}
            >
              {option === 'USED' ? 'Sí, utilizado' : 'No utilizado'}
            </button>
          ))}
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          {usage === 'USED'
            ? 'Contará como un uso anual y actualizará la rotación.'
            : 'No consumirá cupo anual. Indica el motivo para conservar trazabilidad.'}
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
          className="border-border focus:border-electric-blue mt-4 w-full rounded-xl border p-3 text-sm transition outline-none"
        />
        {usageMutation.error ? (
          <p className="text-danger mt-2 text-xs font-bold">{usageMutation.error.message}</p>
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
            {usageMutation.isPending ? 'Guardando…' : 'Confirmar resultado'}
          </Button>
        </div>
      </Modal>
    </AppLayout>
  )
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 lg:justify-center lg:px-5">
      <span className="text-electric-blue [&>svg]:size-5">{icon}</span>
      <div>
        <p className="text-muted-foreground text-xs font-bold">{label}</p>
        <p className="text-primary mt-1 text-sm font-extrabold">{value}</p>
      </div>
    </div>
  )
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border flex justify-between gap-4 border-b pb-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-primary text-right font-bold">{value}</dd>
    </div>
  )
}
function Validation({ label, valid }: { label: string; valid: boolean }) {
  return (
    <div className="border-border flex items-center justify-between gap-3 border-b py-2">
      <span className="text-primary text-sm">{label}</span>
      <Badge tone={valid ? 'success' : 'warning'}>{valid ? 'Cumple' : 'Advertencia'}</Badge>
    </div>
  )
}
function Impact({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2">
      <p className="text-primary text-2xl font-extrabold">{value}</p>
      <p className="text-muted-foreground mt-1 text-xs">{label}</p>
    </div>
  )
}
function Timeline({
  label,
  detail,
  state,
}: {
  label: string
  detail: string
  state: TimelineState
}) {
  const complete = state === 'completed'
  const active = state === 'active'
  const failed = state === 'failed'
  const skipped = state === 'skipped'
  return (
    <div className="flex gap-3">
      <span
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 ${complete ? 'border-electric-blue bg-electric-blue text-white' : active ? 'border-electric-blue bg-white' : failed ? 'border-danger bg-danger-soft text-danger' : skipped ? 'border-slate-300 bg-slate-100 text-slate-500' : 'border-border bg-white'}`}
      >
        {complete ? (
          <Check className="size-3" />
        ) : failed ? (
          <X className="size-3" />
        ) : skipped ? (
          <span className="text-xs font-extrabold">—</span>
        ) : active ? (
          <span className="bg-electric-blue size-2 rounded-full" />
        ) : null}
      </span>
      <div>
        <p className="text-primary text-sm font-extrabold">{label}</p>
        <p className="text-muted-foreground mt-1 text-xs">{detail}</p>
      </div>
    </div>
  )
}
function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}
function priorityLabel(value: number | null) {
  return value === null ? 'Sin calcular' : value >= 70 ? 'Alta' : value >= 45 ? 'Media' : 'Baja'
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
