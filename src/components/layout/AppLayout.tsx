import { useState, type ReactNode } from 'react'

import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar } from '@/components/layout/AppSidebar'

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="bg-background min-h-screen lg:grid lg:grid-cols-[274px_minmax(0,1fr)]">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0">
        <AppHeader onOpenMenu={() => setSidebarOpen(true)} />
        <main className="px-4 py-5 sm:px-7 sm:py-7 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
