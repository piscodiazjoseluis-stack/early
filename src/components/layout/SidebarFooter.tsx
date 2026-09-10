import { CircleHelp, LogOut } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'

export function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const preview = location.pathname.startsWith('/sistema-visual')

  function openHelp() {
    onNavigate?.()
    void navigate(preview ? '/sistema-visual/reglas-ayuda' : '/reglas-ayuda')
  }

  async function closeSession() {
    onNavigate?.()
    if (!preview) await logout()
    void navigate('/iniciar-sesion', { replace: true })
  }

  return (
    <div className="sidebar-footer mt-3 shrink-0">
      <button type="button" className="sidebar-footer-action" onClick={openHelp}>
        <CircleHelp className="size-5 shrink-0" />
        <span>Ayuda</span>
      </button>
      <div className="sidebar-footer-separator" />
      <button type="button" className="sidebar-footer-action" onClick={() => void closeSession()}>
        <LogOut className="size-5 shrink-0" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  )
}
