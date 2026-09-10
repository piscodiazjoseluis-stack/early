import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ access: null }),
}))

import { VisualSystemPage } from '@/features/design-system/pages/VisualSystemPage'

function renderPage() {
  const client = new QueryClient()
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <VisualSystemPage preview />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('VisualSystemPage', () => {
  it('muestra los patrones principales del sistema visual', () => {
    renderPage()

    expect(screen.getByText('Estado de elegibilidad')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(
      screen.getByText('Cumples con todos los requisitos para acceder al beneficio.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Ver todo el equipo')).toBeInTheDocument()
  })

  it('incluye estados de presencia y detalles de las acciones rápidas', () => {
    renderPage()

    expect(screen.getAllByLabelText('Disponible')).not.toHaveLength(0)
    expect(screen.getByText('Nueva solicitud')).toBeInTheDocument()
    expect(screen.getByText('Próximos eventos')).toBeInTheDocument()
    expect(screen.queryByText('Componentes y estados')).not.toBeInTheDocument()
  })
})
