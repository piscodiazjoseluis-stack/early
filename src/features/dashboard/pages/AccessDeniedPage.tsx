import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function AccessDeniedPage() {
  const location = useLocation()
  const attemptedPath = (location.state as { from?: string } | null)?.from

  return (
    <main className="bg-background grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-lg">
        <span className="bg-danger-soft text-danger mx-auto grid size-14 place-items-center rounded-2xl">
          <ShieldAlert className="size-7" aria-hidden="true" />
        </span>
        <p className="text-danger mt-5 text-sm font-bold tracking-widest uppercase">
          Acceso denegado
        </p>
        <h1 className="text-primary-strong mt-3 text-4xl font-extrabold">
          Tu perfil no tiene permiso para entrar aquí
        </h1>
        <p className="text-muted-foreground mt-4">
          {attemptedPath
            ? `La ruta ${attemptedPath} pertenece a otro rol del aplicativo.`
            : 'Este módulo pertenece a otro rol del aplicativo.'}
        </p>
        <Link
          to="/panel"
          className="bg-electric-blue hover:bg-primary focus-visible:outline-electric-blue mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-3 font-bold text-white transition focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Volver a mi panel
        </Link>
      </div>
    </main>
  )
}
