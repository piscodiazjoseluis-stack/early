import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: () => ({ access: null }) }))

import { MyRequestsPreviewPage } from '@/features/requests/pages/MyRequestsPage'
import { NewRequestPreviewPage } from '@/features/requests/pages/NewRequestPage'
import { RequestDetailPreviewPage } from '@/features/requests/pages/RequestDetailPage'
import { HistoryPreviewPage } from '@/features/collaborator/pages/HistoryPage'

function renderRoute(element: React.ReactNode, route = '/', pattern = '*') {
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

describe('solicitudes visuales', () => {
  it('muestra el formulario fiel y valida el envío de demostración', async () => {
    renderRoute(<NewRequestPreviewPage />, '/sistema-visual/solicitudes/nueva')

    expect(
      screen.getByRole('heading', { name: 'Nueva solicitud de Early Friday' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Validación de la solicitud')).toBeInTheDocument()
    expect(screen.getByText('Todo listo')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(await screen.findByText(/vista demostrativa/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Hora propuesta de salida')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Seleccionar viernes Vie, 16 may/ }),
    ).toBeInTheDocument()

    const activeNavigation = screen
      .getAllByRole('navigation')[0]
      .querySelectorAll('button.bg-primary')
    expect(activeNavigation).toHaveLength(1)
    expect(activeNavigation[0]).toHaveTextContent('Solicitar Early Friday')
  })

  it('muestra historial, estados y acceso a nueva solicitud', () => {
    renderRoute(<MyRequestsPreviewPage />)

    expect(screen.getByRole('heading', { name: 'Mis solicitudes' })).toBeInTheDocument()
    expect(screen.getByText('Pendiente de Portfolio')).toBeInTheDocument()
    expect(screen.queryByText('Rechazada por el jefe')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Solicitudes activas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nueva solicitud' })).toBeInTheDocument()
  })

  it('muestra el detalle y la línea de seguimiento', () => {
    renderRoute(<RequestDetailPreviewPage />, '/sistema-visual/solicitudes/preview-23-may')

    expect(screen.getByText('Seguimiento de la solicitud')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de Portfolio')).toBeInTheDocument()
    expect(screen.getByText('Team Hugo Ramirez')).toBeInTheDocument()
  })

  it('distingue rechazo, notificación y etapas que no aplican', () => {
    renderRoute(
      <RequestDetailPreviewPage />,
      '/sistema-visual/solicitudes/preview-11-apr',
      '/sistema-visual/solicitudes/:requestId',
    )

    expect(screen.getByText(/Rechazada.*Hugo Ramirez/i)).toBeInTheDocument()
    expect(
      screen.getByText('No aplica · el flujo terminó con el rechazo del jefe directo'),
    ).toBeInTheDocument()
    expect(screen.getByText('Resultado comunicado al solicitante')).toBeInTheDocument()
    expect(
      screen.getByText('No aplica · el beneficio no quedó habilitado para uso'),
    ).toBeInTheDocument()
  })

  it('muestra la trazabilidad completa en Mi historial', () => {
    renderRoute(<HistoryPreviewPage />)

    expect(screen.getByRole('heading', { name: 'Mi historial' })).toBeInTheDocument()
    expect(screen.getByText('Utilizado')).toBeInTheDocument()
    expect(screen.getByText('Rechazada por el jefe')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de Portfolio')).toBeInTheDocument()
  })
})
