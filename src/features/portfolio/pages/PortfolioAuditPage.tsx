import { useQuery } from '@tanstack/react-query'
import { Activity, FileClock, Search, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

import {
  getClientErrorEvents,
  getPortfolioAudit,
  getPortfolioWorkspace,
} from '../services/portfolio-service'

export function PortfolioAuditPage() {
  const [search, setSearch] = useState('')
  const audit = useQuery({ queryKey: ['portfolio-audit'], queryFn: getPortfolioAudit })
  const clientErrors = useQuery({
    queryKey: ['client-error-events'],
    queryFn: getClientErrorEvents,
    refetchInterval: 60_000,
  })
  const workspace = useQuery({ queryKey: ['portfolio-workspace'], queryFn: getPortfolioWorkspace })
  const rows = useMemo(() => {
    const value = search.trim().toLowerCase()
    return (audit.data ?? []).filter((row) => JSON.stringify(row).toLowerCase().includes(value))
  }, [audit.data, search])
  const exceptions = (workspace.data?.requests ?? []).filter(
    (item) =>
      item.status === 'RETURNED_FOR_CORRECTION' ||
      item.status === 'CANCELLATION_REQUESTED' ||
      item.status === 'EXPIRED',
  )
  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px] space-y-5">
        <header>
          <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">
            Excepciones y auditoría
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Vista complementaria para seguimiento, control y trazabilidad de decisiones.
          </p>
        </header>
        <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="h-fit p-5">
            <h2 className="text-primary flex items-center gap-2 font-extrabold">
              <ShieldAlert className="text-warning size-5" />
              Excepciones abiertas
            </h2>
            <div className="mt-4 space-y-3">
              {exceptions.map((item) => (
                <div
                  key={item.id}
                  className="border-border hover:border-warning/50 rounded-2xl border p-4 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-primary text-sm font-extrabold">{item.requesterName}</p>
                    <Badge tone="warning">
                      {item.status === 'RETURNED_FOR_CORRECTION'
                        ? 'Corrección'
                        : item.status === 'CANCELLATION_REQUESTED'
                          ? 'Cancelación'
                          : 'Vencida'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {item.teamName} · {formatDate(item.requestedDate)}
                  </p>
                </div>
              ))}
              {!exceptions.length ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No hay excepciones abiertas.
                </p>
              ) : null}
            </div>
          </Card>
          <Card className="min-w-0 overflow-hidden">
            <div className="border-border flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-primary flex items-center gap-2 font-extrabold">
                <FileClock className="text-electric-blue size-5" />
                Registro de decisiones
              </h2>
              <label className="border-border focus-within:border-electric-blue flex h-11 items-center gap-2 rounded-xl border px-3">
                <Search className="text-muted-foreground size-4" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="min-w-0 bg-transparent text-sm outline-none"
                  placeholder="Buscar en auditoría"
                />
              </label>
            </div>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-background text-primary text-xs">
                  <tr>
                    <th className="px-5 py-4">Fecha</th>
                    <th className="px-4 py-4">Solicitante</th>
                    <th className="px-4 py-4">Responsable</th>
                    <th className="px-4 py-4">Nivel</th>
                    <th className="px-4 py-4">Decisión</th>
                    <th className="px-5 py-4">Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-border hover:bg-info-soft/25 border-t transition"
                    >
                      <td className="text-muted-foreground px-5 py-4">
                        {new Intl.DateTimeFormat('es-PE', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(row.decided_at))}
                      </td>
                      <td className="text-primary px-4 py-4 font-bold">
                        {relationName(row.requester)}
                      </td>
                      <td className="text-primary px-4 py-4">{relationName(row.approver)}</td>
                      <td className="px-4 py-4">
                        <Badge tone="info">{row.level}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          tone={
                            row.decision === 'APPROVED'
                              ? 'success'
                              : row.decision === 'REJECTED'
                                ? 'danger'
                                : 'warning'
                          }
                        >
                          {row.decision}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground max-w-[260px] px-5 py-4">
                        <span className="block break-words">
                          {row.comment ?? row.reason_code ?? 'Sin comentario'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-border divide-y lg:hidden">
              {rows.map((row) => (
                <article key={row.id} className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-primary truncate text-sm font-extrabold">
                        {relationName(row.requester)}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {new Intl.DateTimeFormat('es-PE', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(row.decided_at))}
                      </p>
                    </div>
                    <Badge
                      tone={
                        row.decision === 'APPROVED'
                          ? 'success'
                          : row.decision === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                      }
                      className="shrink-0"
                    >
                      {row.decision}
                    </Badge>
                  </div>
                  <dl className="grid gap-2 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Responsable</dt>
                      <dd className="text-primary mt-0.5 font-bold">
                        {relationName(row.approver)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Nivel</dt>
                      <dd className="mt-0.5">
                        <Badge tone="info">{row.level}</Badge>
                      </dd>
                    </div>
                  </dl>
                  <p className="text-muted-foreground text-xs leading-5 break-words">
                    {row.comment ?? row.reason_code ?? 'Sin comentario'}
                  </p>
                </article>
              ))}
            </div>
            {!rows.length ? (
              <p className="text-muted-foreground p-10 text-center text-sm">
                No hay registros que coincidan.
              </p>
            ) : null}
          </Card>
        </section>
        <Card className="overflow-hidden">
          <div className="border-border border-b p-5">
            <h2 className="text-primary flex items-center gap-2 font-extrabold">
              <Activity className="text-success size-5" />
              Salud del cliente
            </h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Últimos errores sanitizados del aplicativo. Se actualiza cada minuto y no almacena
              contraseñas, tokens ni parámetros de URL.
            </p>
          </div>
          {clientErrors.isError ? (
            <p className="text-danger p-6 text-sm" role="alert">
              No se pudo consultar la telemetría del cliente.
            </p>
          ) : clientErrors.data?.length ? (
            <div className="divide-border divide-y">
              {clientErrors.data.map((event) => (
                <article
                  key={event.id}
                  className="hover:bg-info-soft/20 grid gap-2 p-5 transition md:grid-cols-[180px_150px_minmax(0,1fr)]"
                >
                  <div>
                    <p className="text-primary text-sm font-bold">{relationName(event.user)}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {new Intl.DateTimeFormat('es-PE', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(event.occurred_at))}
                    </p>
                  </div>
                  <div>
                    <Badge tone="warning">{event.source.replaceAll('_', ' ')}</Badge>
                    <p className="text-muted-foreground mt-2 truncate text-xs">{event.route}</p>
                  </div>
                  <p className="text-muted-foreground min-w-0 text-sm break-words">
                    {event.message}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground p-8 text-center text-sm">
              Sin errores del cliente registrados. La operación se encuentra saludable.
            </p>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
function relationName(value: unknown) {
  if (Array.isArray(value))
    return (value[0] as { full_name?: string } | undefined)?.full_name ?? 'Usuario'
  return (value as { full_name?: string } | null)?.full_name ?? 'Usuario'
}
function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}
