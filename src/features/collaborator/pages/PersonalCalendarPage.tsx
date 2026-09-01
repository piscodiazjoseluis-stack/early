import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ChevronRight, Clock3, Info } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { requestPreviewData } from '@/features/requests/data/request-preview-data'
import { getMyRequests } from '@/features/requests/services/request-service'
import type { RequestView } from '@/features/requests/types'
import { requestStatusPresentation } from '@/features/requests/utils/request-status'

export function PersonalCalendarPage({ preview = false }: { preview?: boolean }) {
  const navigate = useNavigate()
  const requestsQuery = useQuery({
    queryKey: ['my-requests', 'calendar'],
    queryFn: getMyRequests,
    enabled: !preview,
  })
  const requests = useMemo(
    () => (preview ? requestPreviewData : (requestsQuery.data ?? [])),
    [preview, requestsQuery.data],
  )
  const [selectedId, setSelectedId] = useState<string | null>(preview ? 'preview-23-may' : null)
  const selected = requests.find((request) => request.id === selectedId) ?? requests[0]
  const events = requests.map((request) => ({
    id: request.id,
    title: requestStatusPresentation[request.status].label,
    date: request.requestedDate,
    classNames: [
      `calendar-event-${calendarTone(request.status)}`,
      request.id === selectedId ? 'calendar-event-selected' : '',
    ],
  }))

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1420px]">
        <header>
          <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">Mi calendario</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Revisa tus viernes solicitados, aprobados y utilizados en un solo lugar.
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
              Toca un día coloreado para ver su estado completo y los detalles.
            </p>
            {requestsQuery.isLoading && !preview ? (
              <p className="text-muted-foreground p-10 text-center text-sm">
                Cargando calendario...
              </p>
            ) : (
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                initialDate={preview ? '2025-05-16' : undefined}
                locale="es"
                firstDay={1}
                height="auto"
                headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
                buttonText={{ today: 'Hoy' }}
                events={events}
                eventClick={({ event }) => setSelectedId(event.id)}
                dateClick={({ dateStr }) => {
                  const request = requests.find((item) => item.requestedDate === dateStr)
                  if (request) setSelectedId(request.id)
                }}
                dayCellContent={({ date, dayNumberText, isOther }) => {
                  const request = requests.find((item) => item.requestedDate === toDateKey(date))
                  return (
                    <span
                      className={`calendar-day-number ${request ? `calendar-day-number-${calendarTone(request.status)}` : ''} ${isOther ? 'calendar-day-number-other' : ''}`}
                      title={request ? requestStatusPresentation[request.status].label : undefined}
                    >
                      {dayNumberText}
                    </span>
                  )
                }}
                eventContent={({ event }) => (
                  <span className="calendar-event-label" title={event.title}>
                    {event.title}
                  </span>
                )}
                dayMaxEvents={false}
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
                  <Detail label="Estado">
                    <Badge tone={requestStatusPresentation[selected.status].tone}>
                      {requestStatusPresentation[selected.status].label}
                    </Badge>
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
                <button
                  type="button"
                  onClick={() =>
                    void navigate(
                      preview
                        ? `/sistema-visual/solicitudes/${selected.id}`
                        : `/solicitudes/${selected.id}`,
                      { state: { from: 'calendar' } },
                    )
                  }
                  className="text-electric-blue group mt-6 flex items-center gap-2 text-sm font-extrabold"
                >
                  Ver detalle de la solicitud
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            ) : (
              <div className="text-muted-foreground mt-8 text-center text-sm">
                <Info className="text-electric-blue mx-auto mb-3 size-8" />
                Selecciona un evento para consultar su detalle.
              </div>
            )}
          </Card>
        </div>
      </div>
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
  }).format(new Date(`${date}T12:00:00`))
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
