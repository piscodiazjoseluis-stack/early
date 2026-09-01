import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CircleHelp,
  RotateCcw,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'

const questions = [
  [
    '¿Quién puede solicitar un Early Friday?',
    'Los colaboradores con membresía activa, disponibilidad y participación habilitada en la rotación.',
  ],
  [
    '¿Qué ocurre si mi solicitud es devuelta?',
    'Puedes corregir la fecha, horario o comentario desde el detalle y volver a enviarla al flujo correspondiente.',
  ],
  [
    '¿Puedo cancelar una solicitud aprobada?',
    'Sí. Antes de la aprobación final se cancela directamente; después requiere autorización de Portfolio y libera el cupo al aprobarse.',
  ],
  [
    '¿Por qué debo confirmar el uso?',
    'Porque la rotación se calcula con beneficios realmente utilizados, no únicamente con solicitudes aprobadas.',
  ],
]

export function RulesHelpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const preview = location.pathname.startsWith('/sistema-visual')
  const [open, setOpen] = useState(0)
  return (
    <AppLayout>
      <div className="mx-auto max-w-[1120px]">
        <header>
          <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">
            Reglas y ayuda
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Consulta las reglas principales del beneficio y resuelve dudas frecuentes.
          </p>
        </header>
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <RuleCard
            icon={<CalendarDays />}
            title="Solo viernes habilitados"
            text="Las solicitudes se registran para fechas permitidas dentro del período activo."
          />
          <RuleCard
            icon={<UserRound />}
            title="Una solicitud por persona"
            text="No puedes mantener dos solicitudes activas para el mismo viernes."
          />
          <RuleCard
            icon={<RotateCcw />}
            title="Rotación equitativa"
            text="Se prioriza a quienes han utilizado menos veces el beneficio y llevan más semanas sin usarlo."
          />
          <RuleCard
            icon={<ShieldCheck />}
            title="Aprobación en dos niveles"
            text="Tu jefe directo revisa primero y Portfolio toma la decisión final."
          />
        </section>
        <Card className="mt-5 p-5 sm:p-6">
          <CardHeader title="Preguntas frecuentes" icon={<CircleHelp className="size-5" />} />
          <div className="mt-5 space-y-2">
            {questions.map(([question, answer], index) => (
              <div key={question} className="border-border overflow-hidden rounded-xl border">
                <button
                  type="button"
                  onClick={() => setOpen(index === open ? -1 : index)}
                  className="hover:bg-info-soft text-primary flex min-h-12 w-full items-center justify-between gap-4 px-4 text-left text-sm font-extrabold transition"
                >
                  <span>{question}</span>
                  <span className="text-electric-blue">{index === open ? '−' : '+'}</span>
                </button>
                {index === open ? (
                  <p className="text-muted-foreground border-border border-t px-4 py-4 text-sm leading-6">
                    {answer}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
        <Card className="mt-5 p-5 sm:p-6">
          <CardHeader title="¿Necesitas ayuda adicional?" icon={<BookOpen className="size-5" />} />
          <p className="text-muted-foreground mt-3 text-sm">
            Contacta al administrador de Early Fridays PMO indicando la fecha y el número de tu
            solicitud.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={() =>
                void navigate(preview ? '/sistema-visual/elegibilidad' : '/elegibilidad')
              }
            >
              Revisar mi elegibilidad <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                void navigate(preview ? '/sistema-visual/solicitudes' : '/solicitudes')
              }
            >
              Ir a mis solicitudes
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}

function RuleCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <Card className="p-5">
      <span className="bg-info-soft text-electric-blue grid size-11 place-items-center rounded-full [&>svg]:size-5">
        {icon}
      </span>
      <h2 className="text-primary mt-4 font-extrabold">{title}</h2>
      <p className="text-muted-foreground mt-2 text-sm leading-6">{text}</p>
    </Card>
  )
}
