import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { useCollaboratorExperience } from '@/features/collaborator/hooks/useCollaboratorExperience'
import { useTeamLeaderExperience } from '@/features/approvals/hooks/useTeamLeaderExperience'
import { usePortfolioExperience } from '@/features/portfolio/hooks/usePortfolioExperience'

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const visualPreview = location.pathname.startsWith('/sistema-visual')
  const collaboratorExperience = useCollaboratorExperience()
  const teamLeaderExperience = useTeamLeaderExperience()
  const portfolioExperience = usePortfolioExperience()
  const mainRef = useRef<HTMLElement>(null)
  const previousPathRef = useRef(location.pathname)

  useEffect(() => {
    if (previousPathRef.current === location.pathname) return
    previousPathRef.current = location.pathname
    mainRef.current?.focus({ preventScroll: true })
  }, [location.pathname])

  return (
    <div
      className="app-shell bg-background min-h-screen lg:grid lg:grid-cols-[276px_minmax(0,1fr)]"
      data-experience={
        portfolioExperience
          ? 'portfolio'
          : teamLeaderExperience
            ? 'leader'
            : collaboratorExperience
              ? 'collaborator'
              : 'default'
      }
    >
      <a className="skip-link" href="#main-content">
        Ir al contenido principal
      </a>
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-workspace min-w-0">
        <AppHeader onOpenMenu={() => setSidebarOpen(true)} />
        {visualPreview ? (
          <div className="preview-mode-banner" role="status">
            Vista de demostración visual · Los datos mostrados son simulados y no corresponden a una
            sesión real de Supabase.
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
