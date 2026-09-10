import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bookmark,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  Send,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getTeams } from '@/features/teams/services/team-service'
import { cn } from '@/lib/utils'

import { newRequestSchema, type NewRequestFormValues } from '../schemas/request-schema'
import { createRequest, getRequestFormContext } from '../services/request-service'
import type { RequestFormContext, RequestValidationCheck } from '../types'

const draftStorageKey = 'early-fridays-request-draft'
const previewDate = '2025-05-16'
const previewContext: RequestFormContext = {
  applicant_has_team: true,
  period: {
    name: 'Período mayo 2025',
    starts_on: '2025-05-01',
    ends_on: '2025-05-31',
    minimum_departure_time: '13:00',
    maximum_departure_time: '15:00',
    deadline_days: 2,
  },
  eligibility: {
    eligible: true,
    score: 58,
    priority_label: 'Media',
    annual_uses: 2,
    annual_limit: 6,
    personal_last_used_date: '2025-05-16',
    personal_last_approved_by: 'María Luisa Temoche',
    team_last_used_date: '2025-05-16',
    team_last_used_by_name: 'María Luisa Temoche',
    team_last_used_by_title: 'Project Chief',
    team_last_used_by_avatar: null,
    reasons: [],
    evidence: ['Prioridad media según la rotación actual.'],
  },
  checks: [
    { key: 'date', label: 'Fecha válida', detail: 'Es un viernes disponible.', valid: true },
    {
      key: 'period',
      label: 'Período habilitado',
      detail: 'El período actual permite solicitudes de Early Friday.',
      valid: true,
    },
    {
      key: 'schedule',
      label: 'Horario permitido',
      detail: 'La hora propuesta está dentro del rango permitido (13:00 - 15:00).',
      valid: true,
    },
    {
      key: 'duplicate',
      label: 'Sin duplicidad personal',
      detail: 'No tienes otra solicitud para la misma fecha.',
      valid: true,
    },
    {
      key: 'capacity',
      label: 'Cupo del equipo disponible',
      detail: 'Tu equipo tiene cupo disponible para esta fecha.',
      valid: true,
    },
    {
      key: 'rotation',
      label: 'Rotación válida',
      detail: 'Tu prioridad en la rotación actual es Media.',
      valid: true,
    },
    {
      key: 'deadline',
      label: 'Dentro del plazo',
      detail: 'La solicitud se realiza dentro del plazo establecido.',
      valid: true,
    },
  ],
  all_ready: true,
}

export function NewRequestPage({ preview = false }: { preview?: boolean }) {
  const { access } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(0)

  const form = useForm<NewRequestFormValues>({
    resolver: zodResolver(newRequestSchema),
    mode: 'onChange',
    defaultValues: {
      requestedDate: getSuggestedDate(searchParams.get('fecha'), preview),
      departureTime: '14:00',
      reason: '',
    },
  })
  const selectedDate = useWatch({ control: form.control, name: 'requestedDate' })
  const departureTime = useWatch({ control: form.control, name: 'departureTime' })
  const reason = useWatch({ control: form.control, name: 'reason' }) ?? ''

  const teamsQuery = useQuery({
    queryKey: ['teams', 'new-request'],
    queryFn: getTeams,
    enabled: !preview && Boolean(access),
  })
  const currentTeam = teamsQuery.data?.find(
    (team) =>
      team.leaderUserId === access?.profile.id ||
      team.members.some((member) => member.userId === access?.profile.id),
  )
  const contextQuery = useQuery({
    queryKey: ['request-form-context', selectedDate, departureTime],
    queryFn: () => getRequestFormContext(selectedDate, departureTime),
    enabled: !preview && Boolean(access?.profile.id && selectedDate && departureTime),
  })
  const context = preview ? previewContext : contextQuery.data
  const checks = context?.checks ?? buildPendingChecks(contextQuery.isError)
  const allReady = preview
    ? Boolean(context?.all_ready)
    : Boolean(context?.all_ready && form.formState.isValid)

  const mutation = useMutation({
    mutationFn: createRequest,
    onSuccess: async () => {
      localStorage.removeItem(draftStorageKey)
      setFeedback('Solicitud enviada correctamente al flujo de aprobación.')
      await queryClient.invalidateQueries({ queryKey: ['my-requests'] })
      await queryClient.invalidateQueries({ queryKey: ['request-form-context'] })
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : 'Ocurrió un error.'),
  })

  const applicant = preview
    ? { name: 'Jose Pisco', jobTitle: 'Project Analyst', initials: 'JP' }
    : {
        name: access?.profile.full_name ?? 'Usuario',
        jobTitle: access?.profile.job_title ?? 'Sin cargo registrado',
        initials: getInitials(access?.profile.full_name ?? 'Usuario'),
      }
  const teamName = preview
    ? 'Hugo Ramirez - Gilat Peru'
    : (currentTeam?.name ?? 'Sin equipo asignado')
  const leaderName = preview ? 'Hugo Ramirez' : (currentTeam?.leaderName ?? 'Por asignar')

  async function submit(values: NewRequestFormValues) {
    setActiveStep(2)
    setFeedback(null)
    if (preview) {
      setFeedback(
        'Vista demostrativa: la solicitud está lista. El registro real se habilitará al iniciar sesión.',
      )
      return
    }
    await mutation.mutateAsync(values)
  }

  function saveDraft() {
    localStorage.setItem(draftStorageKey, JSON.stringify(form.getValues()))
    setFeedback('Borrador guardado en este dispositivo.')
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1420px]">
        <header className="mb-5">
          <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">
            Nueva solicitud de Early Friday
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Completa los pasos para enviar tu solicitud al PMO.
          </p>
        </header>

        <RequestSteps activeStep={activeStep} />

        <form
          onSubmit={(event) => void form.handleSubmit(submit)(event)}
          className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]"
        >
          <div className="space-y-4">
            <Card className="p-5 sm:p-6">
              <CardHeader
                title="Información del solicitante"
                icon={<UserRound className="size-5" />}
              />
              <div className="mt-5 grid gap-5 md:grid-cols-3">
                <PersonSummary
                  initials={applicant.initials}
                  name={applicant.name}
                  detail={applicant.jobTitle}
                />
                <InfoColumn
                  label="Team"
                  value={teamName}
                  icon={<UsersRound className="size-4" />}
                />
                <InfoColumn
                  label="Jefe directo"
                  value={leaderName}
                  icon={<UserRound className="size-4" />}
                />
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <CardHeader title="Fecha y horario" icon={<CalendarDays className="size-5" />} />
              <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <fieldset>
                  <legend className="text-primary text-xs font-extrabold">
                    Selecciona una fecha (solo viernes)
                  </legend>
                  <MonthCalendar
                    value={selectedDate}
                    preview={preview}
                    onChange={(date) => {
                      form.setValue('requestedDate', date, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                      setActiveStep(1)
                    }}
                  />
                  <p className="text-muted-foreground mt-2 text-[11px]">
                    Solo puedes seleccionar fechas en viernes.
                  </p>
                  {form.formState.errors.requestedDate ? (
                    <p className="text-danger mt-2 text-xs">
                      {form.formState.errors.requestedDate.message}
                    </p>
                  ) : null}
                </fieldset>

                <div>
                  <label htmlFor="departure-time" className="text-primary text-xs font-extrabold">
                    Hora propuesta de salida
                  </label>
                  <div className="relative mt-3">
                    <Clock3 className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <select
                      id="departure-time"
                      {...form.register('departureTime', {
                        onChange: () => setActiveStep(1),
                      })}
                      className="border-border hover:border-electric-blue focus:border-electric-blue h-12 w-full cursor-pointer appearance-none rounded-xl border bg-white pr-10 pl-10 text-sm font-semibold transition outline-none"
                    >
                      {buildTimeOptions(
                        context?.period?.minimum_departure_time ?? '13:00',
                        context?.period?.maximum_departure_time ?? '15:00',
                      ).map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 rotate-90" />
                  </div>
                  <div className="bg-info-soft text-primary mt-4 flex gap-3 rounded-xl p-4 text-xs">
                    <Info className="text-electric-blue size-5 shrink-0" />
                    <span>
                      <strong>Horario permitido:</strong>
                      <br />
                      Entre {formatTime(context?.period?.minimum_departure_time ?? '13:00')} y{' '}
                      {formatTime(context?.period?.maximum_departure_time ?? '15:00')}.
                    </span>
                  </div>
                  {form.formState.errors.departureTime ? (
                    <p className="text-danger mt-2 text-xs">
                      {form.formState.errors.departureTime.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>

            <EligibilityOverview context={context} loading={!preview && contextQuery.isPending} />

            <Card className="p-5 sm:p-6">
              <label htmlFor="request-reason" className="text-primary text-xs font-extrabold">
                Comentario opcional
              </label>
              <textarea
                id="request-reason"
                {...form.register('reason', { onChange: () => setActiveStep(1) })}
                rows={3}
                maxLength={500}
                placeholder="Escribe aquí cualquier información adicional que consideres relevante..."
                className="border-border hover:border-electric-blue focus:border-electric-blue mt-3 w-full resize-none rounded-xl border p-4 text-sm transition outline-none"
              />
              <div className="text-muted-foreground mt-2 flex justify-between text-[11px]">
                <span>Máximo 500 caracteres</span>
                <span>{reason.length}/500</span>
              </div>
            </Card>

            {feedback ? (
              <div
                className="border-electric-blue/25 bg-info-soft text-primary rounded-xl border px-4 py-3 text-sm"
                role="status"
              >
                {feedback}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void navigate(preview ? '/sistema-visual' : '/panel')}
              >
                Cancelar
              </Button>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="secondary" onClick={saveDraft}>
                  <Bookmark className="size-4" /> Guardar borrador
                </Button>
                <Button type="submit" disabled={!allReady || mutation.isPending}>
                  <Send className="size-4" />{' '}
                  {mutation.isPending ? 'Enviando...' : 'Enviar solicitud'}
                </Button>
              </div>
            </div>
          </div>

          <ValidationPanel
            checks={checks}
            allReady={allReady}
            loading={!preview && contextQuery.isPending}
            onReview={() => setActiveStep(2)}
          />
        </form>
      </div>
    </AppLayout>
  )
}

function getSuggestedDate(value: string | null, preview: boolean) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T12:00:00`).getDay() === 5) {
    return value
  }
  return preview ? previewDate : getNextFriday()
}

export function NewRequestPreviewPage() {
  return <NewRequestPage preview />
}

function RequestSteps({ activeStep }: { activeStep: number }) {
  return (
    <ol
      className="grid grid-cols-3 items-start gap-2 pb-1 text-xs font-bold sm:flex sm:items-center sm:gap-3"
      aria-label="Progreso de la solicitud"
    >
      {['Selección de fecha', 'Detalles', 'Confirmar'].map((label, index) => (
        <li
          key={label}
          className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center sm:min-w-fit sm:flex-row sm:gap-3 sm:text-left"
          aria-current={index === activeStep ? 'step' : undefined}
        >
          <span
            className={cn(
              'grid size-9 place-items-center rounded-full border transition-colors',
              index <= activeStep
                ? 'border-electric-blue bg-electric-blue text-white'
                : 'border-border text-muted-foreground bg-white',
            )}
          >
            {index < activeStep ? <Check className="size-4" /> : index + 1}
          </span>
          <span
            className={cn(
              'text-[10px] leading-3 sm:text-xs',
              index === activeStep
                ? 'text-electric-blue'
                : index < activeStep
                  ? 'text-primary'
                  : 'text-muted-foreground',
            )}
          >
            {label}
          </span>
          {index < 2 ? (
            <span
              className={cn(
                'ml-auto hidden h-px min-w-10 flex-1 sm:block',
                index < activeStep ? 'bg-electric-blue' : 'bg-border',
              )}
            />
          ) : null}
        </li>
      ))}
    </ol>
  )
}

function MonthCalendar({
  value,
  preview,
  onChange,
}: {
  value: string
  preview: boolean
  onChange: (date: string) => void
}) {
  const initial = useMemo(
    () => new Date(`${value || (preview ? previewDate : getNextFriday())}T12:00:00`),
    [preview, value],
  )
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initial.getFullYear(), initial.getMonth(), 1),
  )
  const cells = useMemo(() => buildCalendarCells(visibleMonth), [visibleMonth])
  const monthLabel = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(
    visibleMonth,
  )

  return (
    <div className="border-border mt-3 rounded-xl border bg-white p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
          className="text-muted-foreground hover:bg-info-soft hover:text-electric-blue grid size-9 place-items-center rounded-lg transition"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-primary text-sm font-extrabold capitalize">{monthLabel}</p>
        <button
          type="button"
          onClick={() =>
            setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
          className="text-muted-foreground hover:bg-info-soft hover:text-electric-blue grid size-9 place-items-center rounded-lg transition"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="text-muted-foreground mt-3 grid grid-cols-7 text-center text-[9px] font-bold uppercase">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-y-1 text-center text-xs">
        {cells.map((cell, index) => {
          if (!cell) return <span key={`empty-${index}`} className="size-8" />
          const date = toIsoDate(cell)
          const friday = cell.getDay() === 5
          const selectable = friday && (preview || date > toIsoDate(new Date()))
          const selected = value === date
          return selectable ? (
            <button
              key={date}
              type="button"
              onClick={() => onChange(date)}
              className={cn(
                'mx-auto grid size-8 place-items-center rounded-full font-extrabold transition duration-200',
                selected
                  ? 'bg-primary ring-electric-blue/25 shadow-soft text-white ring-4'
                  : 'bg-electric-blue hover:bg-primary text-white hover:-translate-y-0.5 hover:shadow-md',
              )}
              aria-label={`Seleccionar viernes ${formatLongDate(date)}`}
              aria-pressed={selected}
            >
              {cell.getDate()}
            </button>
          ) : (
            <span
              key={date}
              className={cn(
                'mx-auto grid size-8 place-items-center',
                friday && !preview ? 'text-muted-foreground/40' : 'text-muted-foreground',
              )}
            >
              {cell.getDate()}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function EligibilityOverview({
  context,
  loading,
}: {
  context?: RequestFormContext
  loading: boolean
}) {
  const eligibility = context?.eligibility
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader title="Situación de elegibilidad" icon={<ShieldCheck className="size-5" />} />
      <div className="border-border mt-5 grid gap-4 divide-y sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        <EligibilityItem
          label="Último Early utilizado"
          value={
            loading
              ? 'Consultando...'
              : eligibility?.personal_last_used_date
                ? formatLongDate(eligibility.personal_last_used_date)
                : 'Sin registros'
          }
          detail={
            eligibility?.personal_last_approved_by
              ? `Por ${eligibility.personal_last_approved_by}`
              : 'Aún no has utilizado el beneficio'
          }
          icon={<CalendarDays className="size-4" />}
        />
        <EligibilityItem
          label="N.° de usos (año actual)"
          value={
            loading ? '—' : `${eligibility?.annual_uses ?? 0} de ${eligibility?.annual_limit ?? 6}`
          }
          detail="Usos disponibles"
          icon={
            <ProgressRing
              used={eligibility?.annual_uses ?? 0}
              limit={eligibility?.annual_limit ?? 6}
            />
          }
        />
        <EligibilityItem
          label="Prioridad"
          value={loading ? 'Calculando...' : (eligibility?.priority_label ?? 'Por calcular')}
          detail="Según rotación actual"
          icon={<ShieldCheck className="size-4" />}
          valueIndicator={
            <span
              className={`size-2.5 shrink-0 rounded-full ${priorityDotTone(eligibility?.priority_label)}`}
              aria-hidden="true"
            />
          }
        />
        <EligibilityItem
          label="Último Early utilizado por"
          value={
            loading ? 'Consultando...' : (eligibility?.team_last_used_by_name ?? 'Sin registros')
          }
          detail={eligibility?.team_last_used_by_title ?? 'Tu equipo aún no registra usos'}
          icon={
            <Avatar
              initials={getInitials(eligibility?.team_last_used_by_name ?? 'Equipo')}
              src={eligibility?.team_last_used_by_avatar}
            />
          }
        />
      </div>
    </Card>
  )
}

function EligibilityItem({
  label,
  value,
  detail,
  icon,
  valueIndicator,
}: {
  label: string
  value: string
  detail: string
  icon: React.ReactNode
  valueIndicator?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 gap-3 py-3 first:pl-0 last:pr-0 sm:px-4 sm:py-0">
      <span className="text-electric-blue mt-1 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-[10px] font-bold">{label}</p>
        <div className="mt-1 flex items-center gap-2">
          {valueIndicator}
          <p className="text-primary text-xs leading-4 font-extrabold" title={value}>
            {value}
          </p>
        </div>
        <p className="text-muted-foreground mt-1 text-[10px] leading-4" title={detail}>
          {detail}
        </p>
      </div>
    </div>
  )
}

function priorityDotTone(priority?: 'Alta' | 'Media' | 'Baja') {
  if (priority === 'Alta') return 'bg-danger'
  if (priority === 'Baja') return 'bg-success'
  return 'bg-warning'
}

function ProgressRing({ used, limit }: { used: number; limit: number }) {
  const ratio = Math.min(1, Math.max(0, used / Math.max(1, limit)))
  return (
    <span
      className="relative block size-5 rounded-full"
      style={{
        background: `conic-gradient(var(--color-electric-blue) ${ratio * 360}deg, #e8eef8 0deg)`,
      }}
    >
      <span className="absolute inset-[3px] rounded-full bg-white" />
    </span>
  )
}

function Avatar({ initials, src }: { initials: string; src?: string | null }) {
  return src ? (
    <img src={src} alt="" className="size-8 rounded-full object-cover" />
  ) : (
    <span className="grid size-8 place-items-center rounded-full bg-[#f0e7e3] text-[10px] font-extrabold text-[#704435]">
      {initials}
    </span>
  )
}

function PersonSummary({
  initials,
  name,
  detail,
}: {
  initials: string
  name: string
  detail: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid size-12 place-items-center rounded-full bg-[#f0e7e3] font-extrabold text-[#704435]">
        {initials}
        <span className="border-surface bg-success absolute right-0 bottom-0 grid size-4 place-items-center rounded-full border-2 text-white">
          <Check className="size-2.5" />
        </span>
      </span>
      <div>
        <p className="text-primary text-sm font-extrabold">{name}</p>
        <p className="text-muted-foreground text-xs">{detail}</p>
      </div>
    </div>
  )
}

function InfoColumn({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="border-border md:border-l md:pl-5">
      <p className="text-muted-foreground text-[11px] font-bold">{label}</p>
      <p className="text-primary mt-2 flex items-center gap-2 text-xs font-extrabold">
        <span className="text-electric-blue">{icon}</span>
        {value}
      </p>
    </div>
  )
}

function ValidationPanel({
  checks,
  allReady,
  loading,
  onReview,
}: {
  checks: RequestValidationCheck[]
  allReady: boolean
  loading: boolean
  onReview: () => void
}) {
  return (
    <Card className="h-fit p-5" onMouseEnter={onReview}>
      <h2 className="text-primary text-base font-extrabold">Validación de la solicitud</h2>
      <p className="text-muted-foreground mt-1 text-xs">Verificaciones del sistema</p>
      <div className="border-border mt-4 space-y-4 border-t pt-4">
        {checks.map((item) => (
          <div
            key={item.key}
            className="hover:bg-info-soft -mx-2 flex gap-3 rounded-lg px-2 py-1 transition"
          >
            <span
              className={cn(
                'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-white',
                loading ? 'bg-muted-foreground/40' : item.valid ? 'bg-success' : 'bg-warning',
              )}
            >
              <Check className="size-3.5" />
            </span>
            <div>
              <p className="text-primary text-xs font-extrabold">{item.label}</p>
              <p className="text-muted-foreground mt-1 text-[11px] leading-4">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div
        className={cn(
          'mt-5 rounded-xl border p-4',
          allReady ? 'border-success/20 bg-success-soft' : 'border-warning/25 bg-warning-soft',
        )}
      >
        <p
          className={cn(
            'flex items-center gap-2 text-sm font-extrabold',
            allReady ? 'text-success' : 'text-[#ad6a00]',
          )}
        >
          {allReady ? <CheckCircle2 className="size-5" /> : <Clock3 className="size-5" />}
          {loading ? 'Validando...' : allReady ? 'Todo listo' : 'Revisión necesaria'}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {allReady
            ? 'Tu solicitud cumple con todos los criterios.'
            : 'Completa los requisitos antes de enviarla.'}
        </p>
      </div>
    </Card>
  )
}

function buildPendingChecks(hasError: boolean): RequestValidationCheck[] {
  return [
    'Fecha válida',
    'Período habilitado',
    'Horario permitido',
    'Sin duplicidad personal',
    'Cupo del equipo disponible',
    'Rotación válida',
    'Dentro del plazo',
  ].map((label, index) => ({
    key: ['date', 'period', 'schedule', 'duplicate', 'capacity', 'rotation', 'deadline'][
      index
    ] as RequestValidationCheck['key'],
    label,
    detail: hasError ? 'No se pudo comprobar esta regla.' : 'Comprobando con el sistema...',
    valid: false,
  }))
}

function buildCalendarCells(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (firstDay.getDay() + 6) % 7
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  return Array.from({ length: offset + days }, (_, index) =>
    index < offset ? null : new Date(month.getFullYear(), month.getMonth(), index - offset + 1),
  )
}

function buildTimeOptions(minimum: string, maximum: string) {
  const options: string[] = []
  let minutes = timeToMinutes(minimum)
  const max = timeToMinutes(maximum)
  while (minutes < max) {
    options.push(
      `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
    )
    minutes += 30
  }
  return options.length ? options : ['14:00']
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}
function formatTime(value: string) {
  return value.slice(0, 5)
}
function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
function getNextFriday() {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  do date.setDate(date.getDate() + 1)
  while (date.getDay() !== 5)
  return toIsoDate(date)
}
function formatLongDate(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(new Date(`${date}T12:00:00`))
    .replace(/^./, (letter) => letter.toUpperCase())
}
function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
