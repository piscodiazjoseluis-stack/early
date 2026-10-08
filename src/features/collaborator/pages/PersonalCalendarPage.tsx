import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ChevronRight, Clock3, Info } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { requestPreviewData } from '@/features/requests/data/request-preview-data'
import { getMyRequests } from '@/features/requests/services/request-service'
import type { RequestView } from '@/features/requests/types'
import { groupRequestsByDate } from '@/features/requests/utils/request-calendar'
import { requestStatusPresentation } from '@/features/requests/utils/request-status'
import { useCurrentDate } from '@/hooks/useCurrentDate'

export function PersonalCalendarPage({ preview = false }: { preview?: boolean }) {
  const navigate = useNavigate()
  const today = useCurrentDate()
  const requestsQuery = useQuery({
    queryKey: ['my-requests', 'calendar'],
    queryFn: getMyRequests,
    enabled: !preview,
  })
  const requests = useMemo(
    () => (preview ? requestPreviewData : (requestsQuery.data ?? [])),
    [preview, requestsQuery.data],
  )
  const groups = useMemo(() => groupRequestsByDate(requests), [requests])
  const currentRequests = useMemo(
    () => Array.from(groups.values(), (group) => group.current),
    [groups],
  )
  const [selectedDate, setSelectedDate] = useState<string | null>(preview ? '2025-05-23' : null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const effectiveSelectedDate = selectedDate ?? currentRequests[0]?.requestedDate ?? null
  const selectedGroup = effectiveSelectedDate ? groups.get(effectiveSelectedDate) : undefined
  const selected = selectedGroup?.current
  const events = useMemo(
    () =>
      currentRequests.map((request) => {
        const historyCount = groups.get(request.requestedDate)?.history.length ?? 1
        return {
          id: request.id,
          title: requestStatusPresentation[request.status].label,
          date: request.requestedDate,
          classNames: [
            `calendar-event-${calendarTone(request.status)}`,
            request.requestedDate === effectiveSelectedDate ? 'calendar-event-selected' : '',
          ],
          extendedProps: { historyCount },
        }
      }),
    [currentRequests, effectiveSelectedDate, groups],
  )

  function openDate(date: string) {
    if (!groups.has(date)) return
    setSelectedDate(date)
    setHistoryOpen(true)
  }

  function openRequest(request: RequestView) {
    void navigate(
      preview ? `/sistema-visual/solicitudes/${request.id}` : `/solicitudes/${request.id}`,
      { state: { from: 'calendar' } },
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1420px]">
        <header>
          <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">Mi calendario</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            El calendario muestra el estado de tu solicitud más reciente por viernes; el histórico
            completo permanece disponible al abrir la fecha.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-bold">
            <CalendarLegend tone="bg-success" label="Aprobado o utilizado" />
            <CalendarLegend tone="bg-warning" label="En proceso o requiere corrección" />
            <CalendarLegend tone="bg-danger" label="Rechazado o vencido" />
            <CalendarLegend tone="bg-muted-foreground" label="Cancelado o no utilizado" />
          </div>
        </header>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="calendar-shell overflow-hidden p-4 sm:p-6">
            <p className="text-muted-foreground mb-3 text-xs sm:hidden">
              Toca un día con actividad para ver el estado vigente y su histórico.
            </p>
            {requestsQuery.isLoading && !preview ? (
              <p className="text-muted-foreground p-10 text-center text-sm">
                Cargando calendario...
              </p>
            ) : (
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                initialDate={preview ? '2025-05-16' : today}
                now={today}
                locale="es"
                firstDay={1}
                height="auto"
                headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
                buttonText={{ today: 'Hoy' }}
                events={events}
                eventClick={({ event }) => openDate(event.startStr.slice(0, 10))}
                dateClick={({ dateStr }) => openDate(dateStr)}
                dayCellClassNames={({ date }) =>
                  toDateKey(date) === effectiveSelectedDate ? ['calendar-day-selected'] : []
                }
                dayCellContent={({ date, dayNumberText, isOther }) => {
                  const group = groups.get(toDateKey(date))
                  const current = group?.current
                  const title = current
                    ? `${requestStatusPresentation[current.status].label}${group.history.length > 1 ? ` · ${group.history.length} solicitudes para esta fecha` : ''}`
                    : undefined
                  return (
                    <span
                      className={`calendar-day-number ${current ? `calendar-day-number-${calendarTone(current.status)}` : ''} ${isOther ? 'calendar-day-number-other' : ''}`}
                      title={title}
                    >
                      {dayNumberText}
                    </span>
                  )
                }}
                eventContent={({ event }) => (
                  <span
                    className="calendar-event-label"
                    title={`${event.title}${Number(event.extendedProps.historyCount) > 1 ? ` · ${String(event.extendedProps.historyCount)} registros históricos` : ''}`}
                  >
                    {event.title}
                    {Number(event.extendedProps.historyCount) > 1
                      ? ` · ${String(event.extendedProps.historyCount)} registros`
                      : ''}
                  </span>
                )}
                dayMaxEvents={1}
              />
            )}
          </Card>

          <Card className="h-fit p-5 sm:p-6">
            <CardHeader title="Detalle del viernes" icon={<CalendarDays className="size-5" />} />
            {selected ? (
              <div className="mt-5">
                <div className="bg-info-soft flex items-center gap-3 rounded-2xl p-4">
                  <span className="bg-primary grid size-12 place-items-center rounded-full text-lg font-extrabold text-white">
                    {new Date(`${selected.requestedDate}T12:00:00`).getDate()}
                  </span>
                  <div>
                    <p className="text-primary text-sm font-extrabold">
                      {formatDate(selected.requestedDate)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">{selected.teamName}</p>
                  </div>
                </div>
                <div className="border-border mt-5 space-y-4 border-t pt-5">
                  <Detail label="Estado actual">
                    <Badge tone={requestStatusPresentation[selected.status].tone}>
                      {requestStatusPresentation[selected.status].label}
                    </Badge>
                  </Detail>
                  <Detail label="Solicitud registrada">
                    <span className="text-primary text-sm font-bold">
                      {formatDateTime(selected.createdAt)}
                    </span>
                  </Detail>
                  <Detail label="Hora de salida">
                    <span className="text-primary flex items-center gap-2 text-sm font-bold">
                      <Clock3 className="text-warning size-4" />
                      {selected.startTime.slice(0, 5)}
                    </span>
                  </Detail>
                  <Detail label="Comentario">
                    <p className="text-muted-foreground text-sm leading-6">
                      {selected.reason || 'Sin comentario adicional'}
                    </p>
                  </Detail>
                </div>
                {selectedGroup && selectedGroup.history.length > 1 ? (
                  <Button
                    variant="secondary"
                    className="mt-5 w-full"
                    onClick={() => setHistoryOpen(true)}
                  >
                    Ver {selectedGroup.history.length} solicitudes de esta fecha
                  </Button>
                ) : null}
                <button
                  type="button"
                  onClick={() => openRequest(selected)}
                  className="text-electric-blue group mt-5 flex items-center gap-2 text-sm font-extrabold"
                >
                  Ver detalle de la solicitud vigente
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            ) : (
              <div className="text-muted-foreground mt-8 text-center text-sm">
                <Info className="text-electric-blue mx-auto mb-3 size-8" />
                Selecciona un día con actividad para consultar su detalle.
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={historyOpen && Boolean(selectedGroup)}
        title={
          effectiveSelectedDate
            ? `Solicitudes del ${formatDate(effectiveSelectedDate)}`
            : 'Solicitudes del viernes'
        }
        onClose={() => setHistoryOpen(false)}
        showFooter={false}
        className="max-w-3xl"
      >
        <p className="text-muted-foreground text-sm">
          La primera solicitud es la vigente; las demás se conservan como trazabilidad histórica.
        </p>
        <div className="bounded-records border-border mt-4 divide-y rounded-2xl border">
          {selectedGroup?.history.map((request, index) => (
            <article
              key={request.id}
              className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={requestStatusPresentation[request.status].tone}>
                    {requestStatusPresentation[request.status].label}
                  </Badge>
                  {index === 0 ? <Badge tone="info">Estado vigente</Badge> : null}
                </div>
                <p className="text-primary mt-2 text-sm font-extrabold">
                  Registrada el {formatDateTime(request.createdAt)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Salida {request.startTime.slice(0, 5)} · {request.reason || 'Sin comentario'}
                </p>
              </div>
              <Button variant="secondary" onClick={() => openRequest(request)}>
                Ver tracking
              </Button>
            </article>
          ))}
        </div>
      </Modal>
    </AppLayout>
  )
}

export function PersonalCalendarPreviewPage() {
  return <PersonalCalendarPage preview />
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground mb-2 text-[11px] font-bold uppercase">{label}</p>
      {children}
    </div>
  )
}

function CalendarLegend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="text-muted-foreground flex items-center gap-2">
      <span className={`size-2.5 rounded-full ${tone}`} />
      {label}
    </span>
  )
}

function calendarTone(status: RequestView['status']) {
  if (['FINAL_APPROVED', 'USED'].includes(status)) return 'success'
  if (status.includes('REJECTED') || status === 'EXPIRED') return 'danger'
  if (status === 'CANCELLED' || status === 'NOT_USED') return 'neutral'
  return 'warning'
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
