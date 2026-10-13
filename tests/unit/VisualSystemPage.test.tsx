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
  it('prioriza la siguiente acción y mantiene visible el seguimiento', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Hola, Jose' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Tienes una solicitud por corregir' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Corregir solicitud/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Solicitudes recientes' })).toBeInTheDocument()
  })

  it('incluye estados de presencia y contexto operativo del equipo', () => {
    renderPage()

    expect(screen.getAllByLabelText('Disponible')).not.toHaveLength(0)
    expect(screen.getByRole('heading', { name: 'Asignación del equipo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Team Hugo Ramirez' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Abrir calendario/i })).toBeInTheDocument()
    expect(screen.queryByText('Componentes y estados')).not.toBeInTheDocument()
  })
})
