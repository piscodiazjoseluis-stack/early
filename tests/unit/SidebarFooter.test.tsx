import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

const logout = vi.fn().mockResolvedValue(undefined)

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ logout }),
}))

import { SidebarFooter } from '@/components/layout/SidebarFooter'

function CurrentPath() {
  return <p data-testid="path">{useLocation().pathname}</p>
}

function renderFooter(path = '/panel') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SidebarFooter />
      <Routes>
        <Route path="*" element={<CurrentPath />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('pie del menú lateral', () => {
  it('abre la ayuda desde cualquier perfil', () => {
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: 'Ayuda' }))
    expect(screen.getByTestId('path')).toHaveTextContent('/reglas-ayuda')
  })

  it('cierra la sesión real y vuelve al inicio de sesión', async () => {
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    await waitFor(() => expect(logout).toHaveBeenCalledOnce())
    await waitFor(() =>
      expect(screen.getByTestId('path')).toHaveTextContent('/iniciar-sesion'),
    )
  })
})
