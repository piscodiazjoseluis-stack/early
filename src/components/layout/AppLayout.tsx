import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar } from '@/components/layout/AppSidebar'

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const visualPreview = location.pathname.startsWith('/sistema-visual')

  return (
    <div className="app-shell bg-background min-h-screen lg:grid lg:grid-cols-[274px_minmax(0,1fr)]">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0">
        <AppHeader onOpenMenu={() => setSidebarOpen(true)} />
        {visualPreview ? (
          <div className="preview-mode-banner" role="status">
            Vista de demostración visual · Los datos mostrados son simulados y no corresponden a
            una sesión real de Supabase.
          </div>
        ) : null}
        <main className="app-main px-4 py-5 sm:px-7 sm:py-7 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
