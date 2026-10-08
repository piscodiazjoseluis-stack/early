import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ access: null, user: null, logout: vi.fn(), refreshAccess: vi.fn() }),
}))

import { EligibilityPreviewPage } from '@/features/collaborator/pages/EligibilityPage'
import { MyTeamPreviewPage } from '@/features/collaborator/pages/MyTeamPage'
import { NotificationsPreviewPage } from '@/features/collaborator/pages/NotificationsPage'
import { PersonalCalendarPreviewPage } from '@/features/collaborator/pages/PersonalCalendarPage'
import { ProfilePreviewPage } from '@/features/collaborator/pages/ProfilePage'
import { RulesHelpPage } from '@/features/collaborator/pages/RulesHelpPage'
import { CorrectReturnedRequestPreviewPage } from '@/features/requests/pages/CorrectReturnedRequestPage'

function renderRoute(element: React.ReactNode, route = '/sistema-visual') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="*" element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('cierre del perfil colaborador', () => {
  it('muestra calendario personal y detalle del viernes', () => {
    const { container } = renderRoute(
      <PersonalCalendarPreviewPage />,
      '/sistema-visual/calendario',
    )
    expect(screen.getByRole('heading', { name: 'Mi calendario' })).toBeInTheDocument()
    expect(screen.getByText('Detalle del viernes')).toBeInTheDocument()
    expect(container.querySelector('.calendar-day-selected')).toBeInTheDocument()
    expect(container.querySelector('.calendar-event-selected')).toBeInTheDocument()
  })

  it('explica elegibilidad, prioridad y uso', () => {
    renderRoute(<EligibilityPreviewPage />, '/sistema-visual/elegibilidad')
    expect(screen.getByText('Eres elegible')).toBeInTheDocument()
    expect(screen.getByText('72')).toBeInTheDocument()
    expect(screen.getByText('Validaciones de elegibilidad')).toBeInTheDocument()
  })

  it('mantiene el equipo en modo de consulta', () => {
    renderRoute(<MyTeamPreviewPage />, '/sistema-visual/mi-equipo')
    expect(screen.getByText('Team Hugo Ramirez')).toBeInTheDocument()
    expect(screen.getByText('Valeria Cabrera')).toBeInTheDocument()
    expect(screen.getByText(/vista es informativa/i)).toBeInTheDocument()
  })

  it('permite revisar y marcar notificaciones en la demostración', () => {
    renderRoute(<NotificationsPreviewPage />, '/sistema-visual/notificaciones')
    expect(screen.getByText('2 pendientes')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /marcar todas/i }))
    expect(screen.getByText('0 pendientes')).toBeInTheDocument()
  })

  it('muestra perfil, cierre de sesión y ayuda', () => {
    const { unmount } = renderRoute(<ProfilePreviewPage />, '/sistema-visual/perfil')
    expect(screen.getByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument()
    unmount()
    renderRoute(<RulesHelpPage />, '/sistema-visual/reglas-ayuda')
    expect(screen.getByRole('heading', { name: 'Reglas y ayuda' })).toBeInTheDocument()
    expect(screen.getByText('Rotación equitativa')).toBeInTheDocument()
  })

  it('muestra la corrección de una solicitud devuelta', () => {
    renderRoute(
      <CorrectReturnedRequestPreviewPage />,
      '/sistema-visual/solicitudes/preview-returned/corregir',
    )
    expect(screen.getByRole('heading', { name: 'Corregir solicitud' })).toBeInTheDocument()
    expect(screen.getByText('Observación del aprobador')).toBeInTheDocument()
    expect(screen.getByDisplayValue('12:30')).toBeInTheDocument()
  })
})
