import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar } from '@/components/layout/AppSidebar'

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const visualPreview = location.pathname.startsWith('/sistema-visual')
  const mainRef = useRef<HTMLElement>(null)
  const previousPathRef = useRef(location.pathname)

  useEffect(() => {
    if (previousPathRef.current === location.pathname) return
    previousPathRef.current = location.pathname
    mainRef.current?.focus({ preventScroll: true })
  }, [location.pathname])

  return (
    <div className="app-shell bg-background min-h-screen lg:grid lg:grid-cols-[276px_minmax(0,1fr)]">
      <a className="skip-link" href="#main-content">
        Ir al contenido principal
      </a>
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-workspace min-w-0">
        <AppHeader onOpenMenu={() => setSidebarOpen(true)} />
        {visualPreview ? (
          <div className="preview-mode-banner" role="status">
            Vista de demostración visual · Los datos mostrados son simulados y no corresponden a
            una sesión real de Supabase.
          </div>
        ) : null}
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          className="app-main px-4 py-6 outline-none sm:px-7 sm:py-8 lg:px-10 lg:py-10"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
