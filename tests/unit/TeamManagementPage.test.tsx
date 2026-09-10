import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ access: null }),
}))

import { TeamManagementPreviewPage } from '@/features/teams/pages/TeamManagementPage'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter initialEntries={['/sistema-visual/equipos']}>
      <QueryClientProvider client={client}>
        <TeamManagementPreviewPage />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('TeamManagementPreviewPage', () => {
  it('muestra los tres equipos iniciales y su rotación', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Gestión de equipos' })).toBeInTheDocument()
    expect(screen.getAllByText('Team Elena Chipana')).not.toHaveLength(0)
    expect(screen.getByText('Team Carol Flores')).toBeInTheDocument()
    expect(screen.getByText('Team Hugo Ramirez')).toBeInTheDocument()
    expect(screen.getByText('Siguiente prioridad de rotación')).toBeInTheDocument()
    expect(screen.getByText('En lista de espera')).toBeInTheDocument()
    expect(screen.getAllByText('Miguel Atencio')).not.toHaveLength(0)
    expect(screen.getAllByText('Leonardo Navarrete')).not.toHaveLength(0)
    expect(screen.getAllByText('En evaluación')).not.toHaveLength(0)
  })

  it('filtra equipos e informa que las operaciones de la vista previa no son reales', () => {
    renderPage()

    fireEvent.change(screen.getAllByPlaceholderText('Buscar por nombre')[0], {
      target: { value: 'Hugo' },
    })
    expect(screen.getAllByText('Team Hugo Ramirez')).not.toHaveLength(0)
    expect(screen.queryByText('Team Elena Chipana')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Crear equipo' }))
    expect(screen.getByRole('dialog', { name: 'Crear equipo' })).toBeInTheDocument()
    expect(screen.getByText(/vista de fidelidad visual/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('')
    expect(screen.getByLabelText('Descripción')).toHaveValue('')
  })

  it('abre un detalle funcional del equipo seleccionado', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle del equipo' }))

    expect(
      screen.getByRole('dialog', { name: /Detalle de Team Elena Chipana/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Integrantes y rotación')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar detalle' })).toBeInTheDocument()
  })
})
