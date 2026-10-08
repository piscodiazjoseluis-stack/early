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
    <main className="relative min-h-screen overflow-hidden bg-[#eef4fb] p-3 sm:p-6">
      <div className="pointer-events-none absolute -top-44 -left-32 size-[34rem] rounded-full bg-cyan/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-52 size-[38rem] rounded-full bg-electric-blue/10 blur-3xl" />
      <div className="border-border/80 bg-surface shadow-card relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1440px] overflow-hidden rounded-[32px] border lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative z-10 flex flex-col px-6 py-8 sm:px-12 lg:px-[clamp(3rem,5vw,6rem)] lg:py-10">
          <img
            src="/brand/early-fridays-logo.svg"
            alt="Early Fridays PMO"
            className="h-auto w-56 max-w-full"
          />
          <div className="my-auto py-10 lg:py-14">{children}</div>
          <div className="text-muted-foreground border-border/70 flex items-center justify-center gap-2 border-t pt-5 text-center text-xs sm:text-sm">
            <ShieldCheck className="text-electric-blue size-5" aria-hidden="true" />
            Acceso seguro y protegido con Supabase Authentication.
          </div>
        </section>

        <aside className="relative hidden min-h-[720px] overflow-hidden bg-primary-strong lg:block">
          <video
            className="absolute inset-0 size-full scale-[1.02] object-cover object-[80%_center] opacity-90"
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
          <div className="absolute inset-0 bg-gradient-to-b from-primary-strong/55 via-primary-strong/5 to-primary-strong/50" />
          <div className="absolute inset-x-0 top-0 z-10 p-10 xl:p-14">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold tracking-[0.16em] text-white uppercase backdrop-blur-md">
              Bienestar con propósito
            </span>
            <h2 className="mt-5 max-w-[360px] text-3xl leading-[1.08] font-extrabold tracking-[-0.04em] text-white xl:text-4xl">
              Mejores resultados,
              <br />
              <span className="text-[#76e4ff]">más equilibrio.</span>
            </h2>
            <p className="mt-4 max-w-[390px] text-sm leading-6 text-white/76">
              Planificamos con propósito para que los viernes sean tuyos y el impacto sea de todos.
            </p>
            <div className="mt-8 max-w-[390px] space-y-2 rounded-3xl border border-white/15 bg-primary-strong/28 p-3.5 shadow-2xl backdrop-blur-xl">
              {principles.map(({ icon: Icon, title, description, color }) => (
                <div
                  key={title}
                  className="group flex items-center gap-3 rounded-2xl border border-transparent p-2 transition-colors hover:border-white/10 hover:bg-white/8"
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-lg transition-transform group-hover:scale-105 ${color}`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-white">{title}</p>
                    <p className="mt-0.5 text-[10px] text-white/62">{description}</p>
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
