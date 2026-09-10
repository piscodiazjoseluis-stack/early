import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="bg-background grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="text-electric-blue text-sm font-bold tracking-widest uppercase">Error 404</p>
        <h1 className="text-primary-strong mt-3 text-4xl font-extrabold">Página no encontrada</h1>
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
