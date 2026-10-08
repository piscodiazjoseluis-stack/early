import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let currentAccess: {
  profile: { id: string; full_name: string; job_title: string }
  roles: ['TEAM_LEADER']
} | null = null

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ access: currentAccess, logout: vi.fn() }),
}))

import { ApprovalDetailPage } from '@/features/approvals/pages/ApprovalDetailPage'
import { ApprovalsPage } from '@/features/approvals/pages/ApprovalsPage'
import { TeamCalendarPage } from '@/features/approvals/pages/TeamCalendarPage'
import { TeamLeaderDashboardPage } from '@/features/approvals/pages/TeamLeaderDashboardPage'
import { TeamInsightsPage } from '@/features/approvals/pages/TeamInsightsPage'

function renderRoute(element: React.ReactNode, route: string, pattern = '*') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={pattern} element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('perfil del jefe directo', () => {
  beforeEach(() => {
    currentAccess = {
      profile: { id: 'hugo', full_name: 'Hugo Ramirez', job_title: 'Jefe directo / PMO' },
      roles: ['TEAM_LEADER'],
    }
  })

  it('muestra KPIs, prioridad y solicitudes pendientes del equipo', () => {
    renderRoute(<TeamLeaderDashboardPage />, '/sistema-visual/jefe')

    expect(screen.getAllByText('Solicitudes pendientes')).not.toHaveLength(0)
    expect(screen.getByText('Prioridad del equipo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver solicitud de Jose Pisco' })).toBeInTheDocument()
  })

  it('explica el alcance de los insights del equipo del jefe', () => {
    renderRoute(
      <TeamInsightsPage />,
      '/sistema-visual/jefe/analisis-inteligente',
    )

    expect(screen.getByText(/solicitudes registradas en Team Hugo Ramirez/i)).toBeInTheDocument()
    expect(screen.getByText(/Alcance: exclusivamente Team Hugo Ramirez/i)).toBeInTheDocument()
  })

  it('distingue visualmente la fecha seleccionada del día de hoy en calendarios de equipo', () => {
    const { container } = renderRoute(
      <TeamCalendarPage global />,
      '/sistema-visual/jefe/calendario',
    )

    const selectedDate = container.querySelector('button[aria-pressed="true"]')
    expect(selectedDate).toHaveClass('ring-calendar-selection')
    expect(selectedDate?.querySelector('[title="Fecha seleccionada"]')).toHaveClass(
      'bg-calendar-selection',
    )
  })

  it('muestra la bandeja con filtros y acciones accesibles', () => {
    renderRoute(<ApprovalsPage />, '/sistema-visual/jefe/aprobaciones')

    expect(screen.getByRole('heading', { name: 'Hola, Hugo' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Estado' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Ver solicitud de/ })).not.toHaveLength(0)

    fireEvent.change(screen.getByRole('combobox', { name: 'Prioridad' }), {
      target: { value: 'HIGH' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    expect(screen.getByText('Mostrando 1 de 4')).toBeInTheDocument()
    expect(screen.getAllByText('Jose Pisco')).not.toHaveLength(0)
    expect(screen.queryByText('Valeria Cabrera')).not.toBeInTheDocument()
  })

  it('muestra evidencia y las tres decisiones permitidas al jefe', () => {
    renderRoute(<ApprovalDetailPage />, '/sistema-visual/jefe/aprobaciones/preview-jose')

    expect(screen.getByText('Validaciones de negocio')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Solicitar información' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeInTheDocument()
  })

  it('no muestra acciones de aprobación cuando el jefe consulta su propia solicitud', () => {
    currentAccess = {
      profile: { id: 'jose', full_name: 'Jose Pisco', job_title: 'Jefe directo / PMO' },
      roles: ['TEAM_LEADER'],
    }
    renderRoute(<ApprovalDetailPage />, '/sistema-visual/jefe/aprobaciones/preview-jose')

    expect(screen.queryByRole('button', { name: 'Solicitar información' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument()
  })

  it('completa toda la línea de tiempo cuando el beneficio ya fue utilizado', () => {
    renderRoute(
      <ApprovalDetailPage />,
      '/sistema-visual/jefe/aprobaciones/preview-used',
      '/sistema-visual/jefe/aprobaciones/:requestId',
    )

    expect(screen.getByText('Aprobada por Team Hugo Ramirez')).toBeInTheDocument()
    expect(screen.getByText('Decisión final completada')).toBeInTheDocument()
    expect(screen.getByText('Uso confirmado y contabilizado')).toBeInTheDocument()
  })

  it('marca como omitidas Portfolio y uso cuando el jefe rechaza', () => {
    renderRoute(
      <ApprovalDetailPage />,
      '/sistema-visual/jefe/aprobaciones/preview-rejected-by-leader',
      '/sistema-visual/jefe/aprobaciones/:requestId',
    )

    expect(screen.getByText('Solicitud rechazada por el jefe directo')).toBeInTheDocument()
    expect(
      screen.getByText('No aplica: el flujo terminó en la revisión del jefe directo'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('No aplica: el beneficio no quedó disponible para uso'),
    ).toBeInTheDocument()
  })
})
