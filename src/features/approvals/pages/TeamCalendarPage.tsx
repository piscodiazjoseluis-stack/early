import { CalendarDays, ChevronLeft, ChevronRight, Clock3, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

import { useTeamLeaderWorkspace } from '../hooks/useTeamLeaderWorkspace'
import type { TeamApprovalRequest } from '../types'

const weekDays = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

export function TeamCalendarPage({ global = false }: { global?: boolean }) {
  const location = useLocation()
  const navigate = useNavigate()
  const preview = location.pathname.startsWith('/sistema-visual')
  const { requests, team, isLoading } = useTeamLeaderWorkspace(preview)
  const initialMonth = useMemo(() => deriveInitialMonth(requests, preview), [requests, preview])
  const [monthOffset, setMonthOffset] = useState(0)
  const month = useMemo(
    () => new Date(initialMonth.getFullYear(), initialMonth.getMonth() + monthOffset, 1),
    [initialMonth, monthOffset],
  )
  const visibleRequests = requests.filter((request) => sameMonth(request.requestedDate, month))
  const dates = buildCalendarCells(month)
  const firstRequest = visibleRequests[0] ?? requests[0]
  const [selectedDate, setSelectedDate] = useState<string | null>(
    firstRequest?.requestedDate ?? null,
  )
  const effectiveSelectedDate = selectedDate ?? firstRequest?.requestedDate ?? null
  const selectedRequests = requests.filter(
    (request) => request.requestedDate === effectiveSelectedDate,
  )

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1420px]">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">
              {global ? 'Calendario global' : 'Calendario del equipo'}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {global ? 'Todos los equipos' : (team?.name ?? 'Tu equipo')} · aprobaciones,
              pendientes y bloqueos por cada viernes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-bold">
            <Legend tone="bg-success" label="Aprobado" />
            <Legend tone="bg-warning" label="Pendiente" />
            <Legend tone="bg-danger" label="Rechazado" />
            <Legend tone="bg-slate-400" label="Bloqueado" />
          </div>
        </header>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="overflow-hidden p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <NavButton
                  label="Mes anterior"
                  onClick={() => setMonthOffset((value) => value - 1)}
                >
                  <ChevronLeft />
                </NavButton>
                <button
                  type="button"
                  onClick={() => setMonthOffset(0)}
                  className="border-border hover:border-electric-blue rounded-xl border px-4 text-xs font-extrabold transition"
                >
                  Hoy
                </button>
                <NavButton
                  label="Mes siguiente"
                  onClick={() => setMonthOffset((value) => value + 1)}
                >
                  <ChevronRight />
                </NavButton>
              </div>
              <p className="text-primary text-sm font-extrabold capitalize sm:text-lg">
                {formatMonth(month)}
              </p>
            </div>
            {isLoading ? (
              <p className="text-muted-foreground p-12 text-center text-sm">
                Cargando calendario del equipo...
              </p>
            ) : (
              <div className="border-border overflow-hidden rounded-2xl border">
                <div className="grid grid-cols-7 bg-[#f7f9fc]">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className={cn(
                        'border-border border-r p-2 text-center text-[10px] font-extrabold last:border-r-0',
                        day === 'VIE' && 'bg-info-soft text-electric-blue',
                      )}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {dates.map((date, index) => {
                    if (!date)
                      return (
                        <div
                          key={`empty-${index}`}
                          className="border-border min-h-28 border-t border-r bg-slate-50/40"
                        />
                      )
                    const key = toDateKey(date)
                    const dayRequests = requests.filter((request) => request.requestedDate === key)
                    const friday = date.getDay() === 5
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => dayRequests.length && setSelectedDate(key)}
                        disabled={!dayRequests.length}
                        className={cn(
                          'border-border min-h-28 border-t border-r p-2 text-left transition last:border-r-0',
                          friday && 'bg-[#f7fbff]',
                          dayRequests.length &&
                            'hover:bg-info-soft focus-visible:outline-electric-blue focus-visible:outline-2',
                          effectiveSelectedDate === key &&
                            'ring-electric-blue relative z-10 ring-2',
                        )}
                      >
                        <span
                          className={cn(
                            'grid size-7 place-items-center rounded-lg text-xs font-extrabold',
                            friday && 'bg-primary text-white',
                            dayRequests.length && toneClasses(dayRequests[0].status).date,
                          )}
                        >
                          {date.getDate()}
                        </span>
                        <div className="mt-2 space-y-1.5">
                          {dayRequests.slice(0, 3).map((request) => (
                            <div key={request.id} className="min-w-0">
                              <p className="text-primary flex items-center gap-1.5 truncate text-[10px] font-extrabold">
                                <span
                                  className={cn(
                                    'size-2 shrink-0 rounded-full',
                                    toneClasses(request.status).dot,
                                  )}
                                />
                                {request.requesterName}
                              </p>
                              <p className="text-muted-foreground ml-3.5 truncate text-[9px]">
                                {shortStatus(request.status)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>

          <Card className="h-fit p-5 sm:p-6">
            <CardHeader title="Detalle del viernes" icon={<CalendarDays className="size-5" />} />
            {effectiveSelectedDate ? (
              <>
                <div className="bg-info-soft mt-5 flex items-center gap-3 rounded-2xl p-4">
                  <span className="bg-primary grid size-12 place-items-center rounded-full text-lg font-extrabold text-white">
                    {Number(effectiveSelectedDate.slice(-2))}
                  </span>
                  <div>
                    <p className="text-primary text-sm font-extrabold">
                      {formatDate(effectiveSelectedDate)}
                    </p>
                    <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                      <UsersRound className="size-3.5" />
                      {global ? 'Todos los equipos' : team?.name}
                    </p>
                  </div>
                </div>
                <div className="border-border mt-5 divide-y border-t">
                  {selectedRequests.map((request) => (
                    <article key={request.id} className="group py-4">
                      <div className="flex items-start gap-3">
                        <Avatar name={request.requesterName} />
                        <div className="min-w-0 flex-1">
                          <p className="text-primary truncate text-sm font-extrabold">
                            {request.requesterName}
                          </p>
                          <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                            <Clock3 className="size-3.5" />
                            Salida {request.startTime.slice(0, 5)}
                            {global ? ` · ${request.teamName}` : ''}
                          </p>
                        </div>
                        <Badge tone={toneClasses(request.status).badge}>
                          {shortStatus(request.status)}
                        </Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void navigate(
                            preview
                              ? `/sistema-visual/jefe/aprobaciones/${request.id}`
                              : `/aprobaciones/${request.id}`,
                          )
                        }
                        className="text-electric-blue mt-3 text-xs font-extrabold opacity-80 transition group-hover:opacity-100"
                      >
                        Ver detalle →
                      </button>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground mt-8 text-center text-sm">
                Selecciona un viernes con actividad.
              </p>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="bg-primary hover:bg-electric-blue grid size-10 place-items-center rounded-xl text-white transition [&>svg]:size-4"
    >
      {children}
    </button>
  )
}
function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="text-muted-foreground flex items-center gap-2">
      <span className={cn('size-2.5 rounded-full', tone)} />
      {label}
    </span>
  )
}
function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f0e7e3] text-xs font-extrabold text-[#704435]">
      {name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')}
    </span>
  )
}
function toneClasses(status: TeamApprovalRequest['status']) {
  if (['FINAL_APPROVED', 'USED'].includes(status))
    return { dot: 'bg-success', date: 'bg-success', badge: 'success' as const }
  if (status.includes('REJECTED'))
    return { dot: 'bg-danger', date: 'bg-danger', badge: 'danger' as const }
  if (['CANCELLED', 'EXPIRED', 'NOT_USED'].includes(status))
    return { dot: 'bg-slate-400', date: 'bg-slate-500', badge: 'neutral' as const }
  return { dot: 'bg-warning', date: 'bg-warning text-primary', badge: 'warning' as const }
}
function shortStatus(status: TeamApprovalRequest['status']) {
  if (['FINAL_APPROVED', 'USED'].includes(status))
    return status === 'USED' ? 'Utilizado' : 'Aprobado'
  if (status.includes('REJECTED')) return 'Rechazado'
  if (status === 'NOT_USED') return 'No utilizado'
  if (['CANCELLED', 'EXPIRED'].includes(status)) return 'Bloqueado'
  return status === 'RETURNED_FOR_CORRECTION' ? 'Requiere corrección' : 'Pendiente'
}
function deriveInitialMonth(requests: TeamApprovalRequest[], preview: boolean) {
  const candidate =
    requests.find((request) => request.status === 'PENDING_TEAM_LEADER')?.requestedDate ??
    requests[0]?.requestedDate
  return candidate
    ? new Date(`${candidate}T12:00:00`)
    : preview
      ? new Date('2025-05-01T12:00:00')
      : new Date()
}
function buildCalendarCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells: Array<Date | null> = []
  for (let empty = 0; empty < offset; empty += 1) cells.push(null)
  for (let day = 1; day <= days; day += 1)
    cells.push(new Date(month.getFullYear(), month.getMonth(), day))
  while (cells.length % 7) cells.push(null)
  return cells
}
function sameMonth(value: string, month: Date) {
  const date = new Date(`${value}T12:00:00`)
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth()
}
function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(date)
}
function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}
