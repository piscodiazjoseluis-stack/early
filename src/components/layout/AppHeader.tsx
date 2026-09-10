import { Bell, Check, ChevronDown, LogOut, Menu, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useUnreadNotifications } from '@/features/collaborator/hooks/useUnreadNotifications'

export function AppHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { access, logout } = useAuth()
  const preview = location.pathname.startsWith('/sistema-visual')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const unread = useUnreadNotifications()
  const leaderPreview = location.pathname.startsWith('/sistema-visual/jefe')
  const fullName = preview
    ? leaderPreview
      ? 'Hugo Ramirez'
      : 'Jose Pisco'
    : (access?.profile.full_name ?? 'Usuario')
  const jobTitle = preview
    ? leaderPreview
      ? 'Jefe directo / PMO'
      : 'Practicante / PMO'
    : (access?.profile.job_title ?? 'Colaborador')
  const isPortfolio = Boolean(access?.roles.includes('PORTFOLIO_MANAGER'))
  const isLeader = leaderPreview || Boolean(access?.roles.includes('TEAM_LEADER'))
  const roleLabel = isPortfolio ? 'Portfolio Manager' : isLeader ? 'Jefe directo' : 'Colaborador'
  const subtitle = jobTitle.toLocaleLowerCase('es').includes(roleLabel.toLocaleLowerCase('es'))
    ? jobTitle
    : `${roleLabel} · ${jobTitle}`
  const initials = getInitials(fullName)

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const to = (path: string) => (preview ? `/sistema-visual${path}` : path)
  async function handleLogout() {
    if (!preview) await logout()
    void navigate('/iniciar-sesion')
  }

  return (
    <header className="border-sidebar-border flex min-h-[92px] items-center justify-between gap-4 border-b bg-white px-4 sm:px-7 lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="border-border text-primary hover:border-electric-blue hover:bg-info-soft grid size-11 shrink-0 place-items-center rounded-xl border transition lg:hidden"
          aria-label="Abrir navegación"
        >
          <Menu className="size-5" />
        </button>
        <Avatar initials={initials} />
        <div className="min-w-0">
          <p className="text-primary truncate text-sm font-extrabold sm:text-base">
            ¡Bienvenido, {fullName.split(' ')[0]}!
          </p>
          <p className="text-muted-foreground truncate text-xs sm:text-sm">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-5">
        <button
          type="button"
          onClick={() => void navigate(to('/notificaciones'))}
          className="text-primary hover:bg-info-soft relative grid size-11 place-items-center rounded-xl transition"
          aria-label={`Notificaciones, ${unread} pendientes`}
        >
          <Bell className="size-5" />
          {unread ? (
            <span className="bg-electric-blue absolute top-1.5 right-1 grid size-5 place-items-center rounded-full text-[10px] font-extrabold text-white">
              {unread}
            </span>
          ) : null}
        </button>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="hover:bg-background flex items-center gap-3 rounded-xl p-2 transition"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <Avatar initials={initials} compact />
            <span className="hidden text-left md:block">
              <span className="text-primary block text-sm font-extrabold">{fullName}</span>
              <span className="text-muted-foreground block text-xs">{subtitle}</span>
            </span>
            <ChevronDown
              className={`text-muted-foreground hidden size-4 transition-transform md:block ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="border-border shadow-card absolute top-[calc(100%+8px)] right-0 z-30 w-56 rounded-2xl border bg-white p-2"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  void navigate(to('/perfil'))
                }}
                className="text-primary hover:bg-info-soft flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold transition"
              >
                <UserRound className="text-electric-blue size-4" />
                Mi perfil
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleLogout()}
                className="text-danger hover:bg-danger-soft flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold transition"
              >
                <LogOut className="size-4" />
                Cerrar sesión
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

function Avatar({ initials, compact = false }: { initials: string; compact?: boolean }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center rounded-full bg-[#f0e7e3] text-sm font-extrabold text-[#6e4436] ${compact ? 'size-11' : 'size-11 sm:size-12'}`}
    >
      {initials}
      <span
        className="border-surface bg-success absolute right-0 bottom-0 grid size-4 place-items-center rounded-full border-2 text-white"
        title="Disponible"
        aria-label="Disponible"
      >
        <Check className="size-2.5" strokeWidth={3} />
      </span>
    </span>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
