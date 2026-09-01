import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Check, Gauge, History, ShieldCheck, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getEligibility, getMyRequests } from '@/features/requests/services/request-service'

import { collaboratorPreviewEligibility } from '../data/collaborator-preview-data'

export function EligibilityPage({ preview = false }: { preview?: boolean }) {
  const navigate = useNavigate()
  const { access } = useAuth()
  const fridays = useMemo(
    () => (preview ? ['2025-05-23', '2025-05-30'] : getUpcomingFridays(4)),
    [preview],
  )
  const [selectedDate, setSelectedDate] = useState(fridays[0])
  const eligibilityQuery = useQuery({
    queryKey: ['eligibility', access?.profile.id, selectedDate],
    queryFn: () => getEligibility(access?.profile.id ?? '', selectedDate),
    enabled: !preview && Boolean(access?.profile.id),
  })
  const requestsQuery = useQuery({
    queryKey: ['my-requests', 'eligibility-summary'],
    queryFn: getMyRequests,
    enabled: !preview,
  })
  const eligibility = preview ? collaboratorPreviewEligibility : eligibilityQuery.data
  const usedCount = preview
    ? 2
    : (requestsQuery.data ?? []).filter((request) => request.status === 'USED').length

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1280px]">
        <header>
          <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">
            Mi elegibilidad
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Conoce los requisitos que determinan tu acceso y prioridad para cada viernes.
          </p>
        </header>

        <Card className="mt-6 p-5 sm:p-6">
          <CardHeader title="Viernes a evaluar" icon={<CalendarDays className="size-5" />} />
          <div className="mt-4 flex flex-wrap gap-2">
            {fridays.map((date) => (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`min-h-11 rounded-xl border px-4 text-sm font-extrabold transition ${
                  selectedDate === date
                    ? 'border-electric-blue bg-electric-blue text-white'
                    : 'border-border text-primary hover:border-electric-blue bg-white'
                }`}
              >
                {formatDate(date)}
              </button>
            ))}
          </div>
          <div className="border-border mt-5 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-xs leading-5">
              {eligibility?.eligible
                ? 'Esta fecha cumple los criterios actuales. Puedes iniciar la solicitud con el viernes ya seleccionado.'
                : 'Revisa las validaciones antes de registrar una solicitud para esta fecha.'}
            </p>
            <Button
              size="sm"
              disabled={!eligibility?.eligible}
              onClick={() =>
                void navigate(
                  `${preview ? '/sistema-visual/solicitudes/nueva' : '/solicitudes/nueva'}?fecha=${selectedDate}`,
                )
              }
            >
              Solicitar para este viernes
            </Button>
          </div>
        </Card>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <Card className="p-5 sm:p-6">
            <CardHeader title="Estado actual" icon={<ShieldCheck className="size-5" />} />
            <Badge tone={eligibility?.eligible ? 'success' : 'danger'} className="mt-6">
              {eligibilityQuery.isLoading && !preview
                ? 'Evaluando...'
                : eligibility?.eligible
                  ? 'Eres elegible'
                  : 'No elegible'}
            </Badge>
            <p className="text-muted-foreground mt-4 text-xs leading-5">
              {eligibility?.eligible
                ? 'Cumples con todos los requisitos para acceder al beneficio.'
                : eligibility?.reasons?.[0] || 'Revisa los criterios detallados.'}
            </p>
          </Card>
          <Card className="p-5 sm:p-6">
            <CardHeader title="Prioridad de rotación" icon={<Gauge className="size-5" />} />
            <p className="text-primary mt-5 text-4xl font-extrabold">{eligibility?.score ?? '—'}</p>
            <p className="text-muted-foreground mt-2 text-xs">
              Puntaje calculado por reglas objetivas.
            </p>
          </Card>
          <Card className="p-5 sm:p-6">
            <CardHeader title="Uso del período" icon={<History className="size-5" />} />
            <p className="text-primary mt-5 text-4xl font-extrabold">
              <span className="text-electric-blue">{usedCount}</span>{' '}
              <span className="text-lg">de 6</span>
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              Solo los beneficios utilizados cuentan.
            </p>
          </Card>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5 sm:p-6">
            <CardHeader title="Validaciones de elegibilidad" icon={<Check className="size-5" />} />
            <div className="mt-5 space-y-3">
              {(eligibility?.evidence?.length
                ? eligibility.evidence
                : [
                    'Membresía activa y participación en la rotación.',
                    'Disponibilidad registrada para la fecha.',
                    'Fecha habilitada y sin bloqueo corporativo.',
                    'Sin otra solicitud activa para el mismo viernes.',
                  ]
              ).map((item) => (
                <div
                  key={item}
                  className="border-border flex items-start gap-3 rounded-xl border p-4"
                >
                  <span className="bg-success mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-white">
                    <Check className="size-3.5" />
                  </span>
                  <p className="text-primary text-sm leading-6 font-bold">{item}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <CardHeader title="¿Cómo se calcula?" icon={<Sparkles className="size-5" />} />
            <ol className="text-muted-foreground mt-5 space-y-4 text-sm leading-6">
              <Rule
                number="1"
                text="Primero se valida que estés disponible y dentro de un período activo."
              />
              <Rule
                number="2"
                text="Después se revisa el uso real, no solo las aprobaciones anteriores."
              />
              <Rule
                number="3"
                text="Finalmente se compara tu rotación con la de tu equipo para mantener equidad."
              />
            </ol>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

export function EligibilityPreviewPage() {
  return <EligibilityPage preview />
}

function Rule({ number, text }: { number: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="bg-info-soft text-electric-blue grid size-8 shrink-0 place-items-center rounded-full text-xs font-extrabold">
        {number}
      </span>
      <span>{text}</span>
    </li>
  )
}

function getUpcomingFridays(count: number) {
  const result: string[] = []
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)
  while (result.length < count) {
    cursor.setDate(cursor.getDate() + 1)
    if (cursor.getDay() === 5) result.push(cursor.toISOString().slice(0, 10))
  }
  return result
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' }).format(
    new Date(`${date}T12:00:00`),
  )
}
