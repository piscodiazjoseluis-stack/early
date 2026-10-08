import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AppRole } from '@/features/auth/types'
import { REQUEST_OWNER_ROLES } from '@/features/auth/constants/role-permissions'

let currentRoles: AppRole[] = []

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    access: {
      profile: { id: 'user-id', full_name: 'Usuario de prueba' },
      roles: currentRoles,
    },
    isLoading: false,
  }),
}))

import { RoleRoute } from '@/features/auth/components/RoleRoute'

function renderGuard(allowedRoles: AppRole[]) {
  return render(
    <MemoryRouter initialEntries={['/modulo-protegido']}>
      <Routes>
        <Route element={<RoleRoute allowedRoles={allowedRoles} />}>
          <Route path="/modulo-protegido" element={<p>Contenido autorizado</p>} />
        </Route>
        <Route path="/sin-acceso" element={<p>Acceso denegado</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('autorización de rutas por rol', () => {
  beforeEach(() => {
    currentRoles = []
  })

  it('permite al jefe directo entrar a aprobaciones', () => {
    currentRoles = ['TEAM_LEADER']
    renderGuard(['TEAM_LEADER', 'PORTFOLIO_MANAGER'])
    expect(screen.getByText('Contenido autorizado')).toBeInTheDocument()
  })

  it('permite a colaboradores y jefes directos consultar sus propias solicitudes', () => {
    currentRoles = ['TEAM_LEADER']
    const { unmount } = renderGuard(REQUEST_OWNER_ROLES)
    expect(screen.getByText('Contenido autorizado')).toBeInTheDocument()
    unmount()

    currentRoles = ['COLLABORATOR']
    renderGuard(REQUEST_OWNER_ROLES)
    expect(screen.getByText('Contenido autorizado')).toBeInTheDocument()
  })

  it('impide que un colaborador abra un módulo global de Portfolio', () => {
    currentRoles = ['COLLABORATOR']
    renderGuard(['PORTFOLIO_MANAGER'])
    expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
  })

  it('impide que un jefe directo abra módulos exclusivos de Portfolio', () => {
    currentRoles = ['TEAM_LEADER']
    renderGuard(['PORTFOLIO_MANAGER'])
    expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
  })
})
