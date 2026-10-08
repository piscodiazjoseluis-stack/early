import { AlertTriangle, Lightbulb, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

import { useTeamLeaderWorkspace } from '../hooks/useTeamLeaderWorkspace'

export function TeamInsightsPage() {
  const preview = useLocation().pathname.startsWith('/sistema-visual')
  const { requests, team } = useTeamLeaderWorkspace(preview)
  const teamName = team?.name ?? 'tu equipo'
  const pending = requests.filter((r) => r.status === 'PENDING_TEAM_LEADER')
  const members = team?.members ?? []
  const usage = new Map(
    members.map((m) => [
      m.userId,
      requests.filter((r) => r.requesterId === m.userId && r.status === 'USED').length,
    ]),
  )
  const recommendation = members.toSorted(
    (a, b) => (usage.get(a.userId) ?? 0) - (usage.get(b.userId) ?? 0),
  )[0]
  return (
    <AppLayout>
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header>
          <div className="flex items-center gap-3">
            <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">
              Análisis inteligente
            </h1>
            <Badge tone="info">Basado en reglas</Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Recomendaciones explicables con evidencia del team; nunca aprueban automáticamente.
          </p>
        </header>
        <Card className="border-electric-blue/25 bg-gradient-to-br from-white to-[#f3f8ff] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row">
            <span className="bg-info-soft text-electric-blue grid size-14 shrink-0 place-items-center rounded-full">
              <Sparkles className="size-6" />
            </span>
            <div>
              <p className="text-electric-blue text-xs font-extrabold uppercase">
                Recomendación principal
              </p>
              <h2 className="text-primary mt-2 text-xl font-extrabold sm:text-2xl">
                {recommendation
                  ? `${recommendation.fullName} tiene mayor oportunidad para el próximo viernes.`
                  : 'No hay integrantes disponibles para analizar.'}
              </h2>
              <p className="text-muted-foreground mt-3 max-w-3xl text-sm leading-6">
                {recommendation
                  ? `Registra ${usage.get(recommendation.userId) ?? 0} usos confirmados y su estado actual es ${recommendation.isEligible ? 'elegible' : 'no elegible'}. La recomendación debe contrastarse con cobertura operativa antes de decidir.`
                  : 'Agrega integrantes activos para generar recomendaciones.'}
              </p>
            </div>
          </div>
        </Card>
        <section className="grid gap-5 lg:grid-cols-3">
          <Insight icon={<Lightbulb />} title="Hallazgo principal" tone="blue">
            {requests.length
              ? `${requests.length} solicitudes registradas en ${teamName}, incluidas las del jefe directo, alimentan este análisis.`
              : 'Aún no hay solicitudes para analizar.'}
          </Insight>
          <Insight icon={<ShieldCheck />} title="Recomendación semanal" tone="green">
            Priorizar a quien tenga menos usos, siempre que conserve elegibilidad y cobertura.
          </Insight>
          <Insight icon={<AlertTriangle />} title="Riesgos" tone="amber">
            {pending.length
              ? `${pending.length} solicitud${pending.length === 1 ? '' : 'es'} sigue${pending.length === 1 ? '' : 'n'} pendiente${pending.length === 1 ? '' : 's'} de tu decisión.`
              : 'No hay aprobaciones pendientes del jefe.'}
          </Insight>
        </section>
        <Card className="p-6">
          <h2 className="text-primary flex items-center gap-2 font-extrabold">
            <UsersRound className="text-electric-blue size-5" />
            Evidencia por integrante
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {members.map((member) => (
              <div
                key={member.userId}
                className="border-border hover:border-electric-blue/40 hover:bg-info-soft/20 rounded-2xl border p-4 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-primary text-sm font-extrabold">{member.fullName}</p>
                  <Badge tone={member.isEligible ? 'success' : 'danger'}>
                    {member.isEligible ? 'Elegible' : 'No elegible'}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  {usage.get(member.userId) ?? 0} usos confirmados · prioridad {member.priority}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <p className="text-muted-foreground text-xs">
          Alcance: exclusivamente {teamName}. Metodología actual: reglas determinísticas sobre
          solicitudes reales visibles por Supabase, elegibilidad y uso confirmado. No se presenta
          como IA predictiva ni reemplaza la decisión del jefe.
        </p>
      </div>
    </AppLayout>
  )
}
function Insight({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode
  title: string
  tone: 'blue' | 'green' | 'amber'
  children: React.ReactNode
}) {
  const colors = {
    blue: 'bg-info-soft text-electric-blue',
    green: 'bg-success-soft text-success',
    amber: 'bg-warning-soft text-[#ad6a00]',
  }
  return (
    <Card className="p-6 transition hover:-translate-y-1 hover:shadow-md">
      <span className={`grid size-11 place-items-center rounded-xl [&>svg]:size-5 ${colors[tone]}`}>
        {icon}
      </span>
      <h2 className="text-primary mt-4 font-extrabold">{title}</h2>
      <p className="text-muted-foreground mt-2 text-sm leading-6">{children}</p>
    </Card>
  )
}
