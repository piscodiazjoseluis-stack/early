import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  FilePlus2,
  History,
  House,
  ChartNoAxesCombined,
  FileClock,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useUnreadNotifications } from '@/features/collaborator/hooks/useUnreadNotifications'
import { cn } from '@/lib/utils'
import { SidebarFooter } from './SidebarFooter'
import { SidebarBrandMedia } from './SidebarMedia'

const collaboratorNavigation = [
  { label: 'Inicio', icon: House, path: '/panel', previewPath: '/sistema-visual' },
  {
    label: 'Solicitar Early Friday',
    icon: FilePlus2,
    path: '/solicitudes/nueva',
    previewPath: '/sistema-visual/solicitudes/nueva',
  },
  {
    label: 'Mis solicitudes',
    icon: ClipboardCheck,
    path: '/solicitudes',
    previewPath: '/sistema-visual/solicitudes',
  },
  {
    label: 'Mi calendario',
    icon: CalendarDays,
    path: '/calendario',
    previewPath: '/sistema-visual/calendario',
  },
  {
    label: 'Mi elegibilidad',
    icon: ShieldCheck,
    path: '/elegibilidad',
    previewPath: '/sistema-visual/elegibilidad',
  },
  {
    label: 'Mi historial',
    icon: History,
    path: '/historial',
    previewPath: '/sistema-visual/historial',
  },
  {
    label: 'Mi equipo',
    icon: UsersRound,
    path: '/mi-equipo',
    previewPath: '/sistema-visual/mi-equipo',
  },
  {
    label: 'Notificaciones',
    icon: Bell,
    path: '/notificaciones',
    previewPath: '/sistema-visual/notificaciones',
  },
]

const teamLeaderNavigation = [
  { label: 'Inicio', icon: House, path: '/panel', previewPath: '/sistema-visual/jefe' },
  {
    label: 'Aprobaciones',
    icon: ClipboardCheck,
    path: '/aprobaciones',
    previewPath: '/sistema-visual/jefe/aprobaciones',
  },
  {
    label: 'Mi equipo',
    icon: UsersRound,
    path: '/mi-equipo',
    previewPath: '/sistema-visual/mi-equipo',
  },
  {
    label: 'Rotación',
    icon: RotateCcw,
    path: '/rotacion',
    previewPath: '/sistema-visual/jefe/rotacion',
  },
  {
    label: 'Calendario',
    icon: CalendarDays,
    path: '/calendario',
    previewPath: '/sistema-visual/jefe/calendario',
  },
  {
    label: 'Mis solicitudes',
    icon: ClipboardCheck,
    path: '/solicitudes',
    previewPath: '/sistema-visual/solicitudes',
  },
  {
    label: 'BI del equipo',
    icon: ChartNoAxesCombined,
    path: '/bi-equipo',
    previewPath: '/sistema-visual/jefe/bi-equipo',
  },
  {
    label: 'Análisis inteligente',
    icon: Sparkles,
    path: '/analisis-inteligente',
    previewPath: '/sistema-visual/jefe/analisis-inteligente',
  },
  {
    label: 'Notificaciones',
    icon: Bell,
    path: '/notificaciones',
    previewPath: '/sistema-visual/notificaciones',
  },
]

const portfolioNavigation = [
  { label: 'Resumen ejecutivo', icon: House, path: '/panel', previewPath: '/panel' },
  {
    label: 'Aprobaciones finales',
    icon: ClipboardCheck,
    path: '/aprobaciones',
    previewPath: '/aprobaciones',
  },
  {
    label: 'Calendario global',
    icon: CalendarDays,
    path: '/calendario',
    previewPath: '/calendario',
  },
  { label: 'Equipos', icon: UsersRound, path: '/equipos', previewPath: '/equipos' },
  {
    label: 'BI y analítica',
    icon: ChartNoAxesCombined,
    path: '/bi-global',
    previewPath: '/bi-global',
  },
  {
    label: 'Análisis inteligente',
    icon: Sparkles,
    path: '/analisis-inteligente',
    previewPath: '/analisis-inteligente',
  },
  {
    label: 'Excepciones y auditoría',
    icon: FileClock,
    path: '/excepciones-auditoria',
    previewPath: '/excepciones-auditoria',
  },
  { label: 'Notificaciones', icon: Bell, path: '/notificaciones', previewPath: '/notificaciones' },
]

export function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { access } = useAuth()
  const unreadNotifications = useUnreadNotifications()
  const isPreview = location.pathname.startsWith('/sistema-visual')
  const isLeader =
    location.pathname.startsWith('/sistema-visual/jefe') ||
    Boolean(access?.roles.includes('TEAM_LEADER'))
  const isPortfolio = Boolean(access?.roles.includes('PORTFOLIO_MANAGER'))
  const navigation = isPortfolio
    ? portfolioNavigation
    : isLeader
      ? teamLeaderNavigation
      : collaboratorNavigation

  return (
    <>
      {open ? (
        <button
          type="button"
          className="bg-primary-strong/35 fixed inset-0 z-30 lg:hidden"
          onClick={onClose}
          aria-label="Cerrar navegación"
        />
      ) : null}
      <aside
        className={cn(
          'app-sidebar fixed inset-y-0 left-0 z-40 flex w-[274px] flex-col overflow-hidden border-r px-4 py-4 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="sidebar-brand-row flex shrink-0 items-start justify-between gap-2">
          <SidebarBrandMedia />
          <button
            type="button"
            onClick={onClose}
            className="sidebar-close grid size-9 shrink-0 place-items-center rounded-lg lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Navegación principal" className="sidebar-nav-scroll mt-3 space-y-1.5">
          {navigation.map(({ label, icon: Icon, path, previewPath }) => {
            const target = isPreview ? previewPath : path
            const active = target ? isNavigationActive(location.pathname, target) : false
            return (
              <button
                key={label}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  if (target) void navigate(target)
                  onClose()
                }}
                className={cn(
                  'sidebar-nav-item flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-sm font-bold',
                  active
                    ? 'sidebar-nav-item-active bg-primary'
                    : 'sidebar-nav-item-idle',
                )}
              >
                <Icon className="size-5 shrink-0" />
                <span>{label}</span>
                {label === 'Notificaciones' && unreadNotifications > 0 ? (
                  <span
                    className="sidebar-notification-count ml-auto"
                    aria-label={`${unreadNotifications} notificaciones pendientes`}
                  >
                    {unreadNotifications}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>

        <SidebarFooter onNavigate={onClose} />
      </aside>
    </>
  )
}

function isNavigationActive(pathname: string, target: string) {
  if (pathname === target) return true
  const requestListRoutes = ['/solicitudes', '/sistema-visual/solicitudes']
  return (
    requestListRoutes.includes(target) &&
    pathname.startsWith(`${target}/`) &&
    pathname !== `${target}/nueva`
  )
}
