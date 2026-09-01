import { CheckCircle2, Clock3, ShieldCheck, Target } from 'lucide-react'
import type { ReactNode } from 'react'

const principles = [
  {
    icon: Target,
    title: 'Enfocados en lo importante',
    description: 'Priorizamos iniciativas de alto valor.',
    color: 'bg-electric-blue',
  },
  {
    icon: CheckCircle2,
    title: 'Equipos alineados',
    description: 'Colaboración clara, comunicación abierta.',
    color: 'bg-success',
  },
  {
    icon: Clock3,
    title: 'Tiempo que impulsa',
    description: 'Planificamos para vivir mejor los viernes.',
    color: 'bg-warning',
  },
]

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="bg-background min-h-screen p-3 sm:p-6">
      <div className="border-border bg-surface shadow-card mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1400px] overflow-hidden rounded-[28px] border lg:grid-cols-2">
        <section className="flex flex-col px-6 py-8 sm:px-12 lg:px-[clamp(3rem,6vw,6.5rem)] lg:py-12">
          <img
            src="/brand/early-fridays-logo.svg"
            alt="Early Fridays PMO"
            className="h-auto w-64 max-w-full"
          />
          <div className="my-auto py-10">{children}</div>
          <div className="text-muted-foreground flex items-center justify-center gap-2 text-center text-xs sm:text-sm">
            <ShieldCheck className="text-electric-blue size-5" aria-hidden="true" />
            Acceso seguro y protegido con Supabase Authentication.
          </div>
        </section>

        <aside className="relative hidden min-h-[720px] overflow-hidden bg-[#fbf8f4] lg:block">
          <video
            className="absolute inset-0 size-full object-cover object-[80%_center]"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/brand/login-wellbeing-illustration.png"
            aria-hidden="true"
          >
            <source src="/brand/login-wellbeing-loop.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-x-0 top-0 z-10 p-8 xl:p-10">
            <h2 className="text-primary-strong max-w-[270px] text-2xl leading-tight font-extrabold">
              Mejores resultados,
              <br />
              más equilibrio.
            </h2>
            <p className="text-muted-foreground mt-2 max-w-[310px] text-xs leading-5">
              Planificamos con propósito para que los viernes sean tuyos y el impacto sea de todos.
            </p>
            <div className="shadow-soft mt-5 max-w-[300px] space-y-1.5 rounded-2xl border border-white/80 bg-white/90 p-3 backdrop-blur-sm">
              {principles.map(({ icon: Icon, title, description, color }) => (
                <div
                  key={title}
                  className="hover:bg-info-soft/60 group flex items-center gap-2 rounded-xl p-1.5 transition-colors"
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full text-white transition-transform group-hover:scale-110 ${color}`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-primary-strong text-xs font-extrabold">{title}</p>
                    <p className="text-muted-foreground text-[10px]">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
