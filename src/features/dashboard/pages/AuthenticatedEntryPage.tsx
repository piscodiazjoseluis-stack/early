import { LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import type { AppRole } from '@/features/auth/types'

const roleLabels: Record<AppRole, string> = {
  COLLABORATOR: 'Colaborador',
  TEAM_LEADER: 'Jefe directo',
  PORTFOLIO_MANAGER: 'Portfolio Manager',
  ADMIN: 'Administrador',
}

export function AuthenticatedEntryPage() {
  const { access, error, logout } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleLogout() {
    setIsSigningOut(true)
    try {
      await logout()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <main className="bg-background grid min-h-screen place-items-center px-6 py-12">
      <section className="border-border shadow-card w-full max-w-2xl rounded-3xl border bg-white p-8 sm:p-10">
        <img
          src="/brand/early-fridays-logo-reference.png"
          alt="Early Fridays PMO"
          className="w-60"
        />
        {access ? (
          <>
            <div className="mt-9 flex items-center gap-4">
              <span className="bg-primary text-cyan grid size-14 place-items-center rounded-2xl">
                <UserRound className="size-7" />
              </span>
              <div>
                <p className="text-muted-foreground text-sm font-semibold">Sesión autenticada</p>
                <h1 className="text-primary-strong text-2xl font-extrabold">
                  {access.profile.full_name}
                </h1>
                <p className="text-muted-foreground text-sm">{access.profile.job_title}</p>
              </div>
            </div>
            <div className="border-success/25 bg-success/5 mt-8 rounded-2xl border p-5">
              <div className="text-success flex items-center gap-2 font-bold">
                <ShieldCheck className="size-5" />
                Acceso validado mediante Supabase
              </div>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                Tus roles activos son:{' '}
                {access.roles.map((role) => roleLabels[role]).join(', ') || 'Sin rol asignado'}. El
                dashboard correspondiente se implementará en su etapa visual aprobada.
              </p>
            </div>
          </>
        ) : (
          <div role="alert" className="border-danger/20 bg-danger/5 mt-8 rounded-2xl border p-5">
            <p className="text-danger font-bold">No pudimos cargar el acceso</p>
            <p className="text-muted-foreground mt-2 text-sm">{error}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={isSigningOut}
          className="border-border text-primary hover:border-electric-blue hover:text-electric-blue mt-8 flex h-12 items-center justify-center gap-2 rounded-xl border px-5 font-bold transition disabled:opacity-60"
        >
          <LogOut className="size-5" />
          {isSigningOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </button>
      </section>
    </main>
  )
}
