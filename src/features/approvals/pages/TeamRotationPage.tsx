import {
  ArrowRight,
  CalendarCheck2,
  History,
  RotateCcw,
  ShieldCheck,
  Star,
  UsersRound,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'

import { useTeamLeaderWorkspace } from '../hooks/useTeamLeaderWorkspace'

export function TeamRotationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const preview = location.pathname.startsWith('/sistema-visual')
  const { team, requests, isLoading } = useTeamLeaderWorkspace(preview)
  const ranked = (team?.members ?? [])
    .map((member) => {
      const own = requests.filter((request) => request.requesterId === member.userId)
      const used = own.filter((request) => request.status === 'USED')
      const last = used.toSorted((a, b) => b.requestedDate.localeCompare(a.requestedDate))[0]
      const priority =
        own.find((request) => request.priority !== null)?.priority ??
        (member.priority === 'alta' ? 75 : member.priority === 'media' ? 50 : 25)
      return { member, uses: used.length, lastDate: last?.requestedDate, priority }
    })
    .toSorted((a, b) => b.priority - a.priority)

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header>
          <h1 className="text-primary-strong flex items-center gap-3 text-2xl font-extrabold sm:text-3xl">
            <RotateCcw className="text-electric-blue size-7" />
            Rotación del equipo
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Orden transparente de prioridad para {team?.name ?? 'tu equipo'}, calculado con
            elegibilidad y uso registrado.
          </p>
        </header>
        <section className="grid gap-4 sm:grid-cols-3">
          <Metric icon={<UsersRound />} label="Integrantes activos" value={ranked.length} />
          <Metric
            icon={<ShieldCheck />}
            label="Elegibles"
            value={ranked.filter(({ member }) => member.isEligible).length}
          />
          <Metric
            icon={<CalendarCheck2 />}
            label="Usos registrados"
            value={ranked.reduce((total, item) => total + item.uses, 0)}
          />
        </section>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="overflow-hidden">
            <div className="border-border border-b p-5 sm:p-6">
              <CardHeader
                title="Prioridad actual"
                description="El primer lugar tiene preferencia sugerida; la decisión sigue siendo humana."
                icon={<RotateCcw className="size-5" />}
              />
            </div>
            {isLoading ? (
              <p className="p-10 text-center text-sm">Calculando rotación...</p>
            ) : (
              <div className="bounded-records divide-border divide-y">
                {ranked.map((item, index) => (
                  <article
                    key={item.member.userId}
                    className="hover:bg-info-soft/30 grid gap-4 p-5 transition sm:grid-cols-[52px_minmax(0,1fr)_110px_110px] sm:items-center"
                  >
                    <span className="bg-info-soft text-electric-blue grid size-11 place-items-center rounded-xl text-lg font-extrabold">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-primary font-extrabold">{item.member.fullName}</p>
                      <p className="text-muted-foreground mt-1 text-xs">{item.member.jobTitle}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px] font-bold uppercase">
                        Último Early
                      </p>
                      <p className="text-primary mt-1 text-xs font-extrabold">
                        {item.lastDate ? formatDate(item.lastDate) : 'Sin uso'}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2">
                      <Badge tone={item.member.isEligible ? 'success' : 'danger'}>
                        {item.member.isEligible ? 'Elegible' : 'No elegible'}
                      </Badge>
                      <Badge tone={item.priority >= 70 ? 'info' : 'warning'}>
                        <Star className="size-3" />
                        {priorityLabel(item.priority)}
                      </Badge>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card>
          <div className="space-y-5">
            <Card className="border-electric-blue/25 bg-gradient-to-br from-white to-[#f4f8ff] p-6">
              <span className="bg-info-soft text-electric-blue grid size-12 place-items-center rounded-full">
                <Star className="size-5" />
              </span>
              <p className="text-muted-foreground mt-5 text-xs font-bold uppercase">
                Próximo en rotación
              </p>
              <h2 className="text-primary mt-2 text-xl font-extrabold">
                {ranked[0]?.member.fullName ?? 'Sin candidato'}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {ranked[0]
                  ? `${ranked[0].member.isEligible ? 'Elegible' : 'No elegible'} · prioridad ${priorityLabel(ranked[0].priority).toLowerCase()} · ${ranked[0].uses} usos.`
                  : 'El equipo no tiene miembros activos.'}
              </p>
            </Card>
            <Card className="p-6">
              <CardHeader title="Criterios visibles" icon={<History className="size-5" />} />
              <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
                <li>• Elegibilidad vigente.</li>
                <li>• Cantidad y fecha de usos anteriores.</li>
                <li>• Prioridad almacenada al solicitar.</li>
                <li>• Participación habilitada en rotación.</li>
              </ul>
              <button
                type="button"
                onClick={() =>
                  void navigate(
                    preview ? '/sistema-visual/jefe/analisis-inteligente' : '/analisis-inteligente',
                  )
                }
                className="text-electric-blue mt-5 flex items-center gap-2 text-sm font-extrabold"
              >
                Ver análisis completo <ArrowRight className="size-4" />
              </button>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="group hover:border-electric-blue/40 flex items-center gap-4 p-5 transition hover:-translate-y-1 hover:shadow-md">
      <span className="bg-info-soft text-electric-blue grid size-12 place-items-center rounded-xl [&>svg]:size-5">
        {icon}
      </span>
      <div>
        <p className="text-muted-foreground text-xs font-bold">{label}</p>
        <p className="text-primary mt-1 text-2xl font-extrabold">{value}</p>
      </div>
    </Card>
  )
}
function priorityLabel(value: number) {
  return value >= 70 ? 'Muy alta' : value >= 45 ? 'Media' : 'Baja'
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}
