import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ access: null, logout: vi.fn() }),
}))

import { ApprovalDetailPage } from '@/features/approvals/pages/ApprovalDetailPage'
import { ApprovalsPage } from '@/features/approvals/pages/ApprovalsPage'
import { TeamLeaderDashboardPage } from '@/features/approvals/pages/TeamLeaderDashboardPage'

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
  it('muestra KPIs, prioridad y solicitudes pendientes del equipo', () => {
    renderRoute(<TeamLeaderDashboardPage />, '/sistema-visual/jefe')

    expect(screen.getAllByText('Solicitudes pendientes')).not.toHaveLength(0)
    expect(screen.getByText('Prioridad del equipo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver solicitud de Jose Pisco' })).toBeInTheDocument()
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

    expect(screen.getByText('Mostrando 1 de 3')).toBeInTheDocument()
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
})
