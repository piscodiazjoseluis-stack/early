export function RouteLoadingPage() {
  return (
    <main className="bg-background grid min-h-screen place-items-center" aria-live="polite">
      <div className="text-center">
        <span className="border-border border-t-electric-blue mx-auto block size-9 animate-spin rounded-full border-4" />
        <p className="text-primary mt-4 font-semibold">Cargando pantalla…</p>
      </div>
    </main>
  )
}
