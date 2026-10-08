import { SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="status-page">
      <div className="status-panel">
        <span className="bg-info-soft text-electric-blue mx-auto grid size-14 place-items-center rounded-2xl">
          <SearchX className="size-7" aria-hidden="true" />
        </span>
        <p className="text-electric-blue mt-5 text-sm font-bold tracking-widest uppercase">Error 404</p>
        <h1 className="text-primary-strong mt-3 text-3xl font-extrabold sm:text-4xl">Página no encontrada</h1>
        <p className="text-muted-foreground mt-4">
          La dirección ingresada no corresponde a una pantalla disponible.
        </p>
        <Link
          to="/"
          className="bg-electric-blue hover:bg-primary focus-visible:outline-electric-blue mt-8 inline-flex rounded-xl px-5 py-3 font-bold text-white transition focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
