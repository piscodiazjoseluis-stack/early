import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ access: null, logout: vi.fn() }),
}))

import { AppSidebar } from '@/components/layout/AppSidebar'

describe('menú lateral', () => {
  it('muestra junto a Notificaciones el mismo conteo no leído disponible para el perfil', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <MemoryRouter initialEntries={['/sistema-visual/jefe']}>
        <QueryClientProvider client={client}>
          <AppSidebar open onClose={vi.fn()} />
        </QueryClientProvider>
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('2 notificaciones pendientes')).toBeInTheDocument()
  })
})
