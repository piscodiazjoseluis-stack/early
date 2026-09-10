import { ArrowRight, CheckCircle2, Database, Layers3, ShieldCheck } from 'lucide-react'

import { isSupabaseConfigured } from '@/lib/env'

const foundations = [
  {
    icon: Layers3,
    title: 'Arquitectura modular',
    description: 'Features, componentes, servicios, estado y tipos separados desde el inicio.',
  },
  {
    icon: Database,
    title: 'Supabase preparado',
    description: 'Cliente tipado y variables públicas listas, sin exponer claves privilegiadas.',
  },
  {
    icon: ShieldCheck,
    title: 'Calidad verificable',
    description: 'TypeScript estricto, ESLint, Prettier, pruebas y compilación reproducible.',
  },
]

export function InitialSetupPage() {
  const configured = isSupabaseConfigured()

  return (
    <main className="bg-background text-foreground min-h-screen">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <img
              src="/brand/early-fridays-logo-reference.png"
              alt="Early Fridays PMO"
              className="h-auto w-72 max-w-full"
            />
            <p className="text-electric-blue mt-10 text-sm font-bold tracking-[0.18em] uppercase">
              Fase 5 · Etapa 1
            </p>
            <h1 className="text-primary-strong mt-4 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              Base técnica lista para construir con orden.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-8">
              La aplicación ya cuenta con una estructura escalable para desarrollar cada módulo
              aprobado sin alterar la identidad visual ni adelantar reglas de negocio.
            </p>

            <div className="border-border bg-surface shadow-soft mt-8 inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold">
              <span
                className={`size-2.5 rounded-full ${configured ? 'bg-success' : 'bg-warning'}`}
                aria-hidden="true"
              />
              {configured
                ? 'Conexión de Supabase configurada'
                : 'Pendiente agregar credenciales locales de Supabase'}
            </div>
          </div>

          <div className="border-border bg-surface shadow-card rounded-3xl border p-6 sm:p-8">
            <div className="border-border flex items-center gap-3 border-b pb-5">
              <span className="bg-electric-blue grid size-11 place-items-center rounded-2xl text-white">
                <CheckCircle2 aria-hidden="true" />
              </span>
              <div>
                <p className="text-primary-strong font-extrabold">Inicialización completada</p>
                <p className="text-muted-foreground text-sm">Lista para revisión de la Etapa 1</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {foundations.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="border-border bg-background/70 flex gap-4 rounded-2xl border p-4"
                >
                  <span className="bg-primary text-cyan grid size-10 shrink-0 place-items-center rounded-xl">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-primary-strong font-bold">{title}</h2>
                    <p className="text-muted-foreground mt-1 text-sm leading-6">{description}</p>
                  </div>
                </article>
              ))}
            </div>

            <p className="text-electric-blue mt-6 flex items-center gap-2 text-sm font-semibold">
              Próximo paso sujeto a aprobación: modelo de datos
              <ArrowRight className="size-4" aria-hidden="true" />
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
