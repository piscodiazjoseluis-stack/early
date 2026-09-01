import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type * as ApprovalService from '@/features/approvals/services/approval-service'

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    access: {
      profile: { id: 'leader-id', full_name: 'Hugo Ramirez', job_title: 'Jefe directo' },
      roles: ['TEAM_LEADER'],
    },
    logout: vi.fn(),
  }),
}))

vi.mock('@/features/approvals/services/approval-service', async (importOriginal) => {
  const original = await importOriginal<typeof ApprovalService>()
  return {
    ...original,
    getTeamApprovalRequest: vi.fn(() => new Promise(() => undefined)),
    getTeamApprovalRequests: vi.fn().mockResolvedValue([]),
  }
})

vi.mock('@/features/teams/services/team-service', () => ({
  getTeams: vi.fn().mockResolvedValue([]),
}))

import { ApprovalDetailPage } from '@/features/approvals/pages/ApprovalDetailPage'

describe('detalle de aprobación conectado', () => {
  it('presenta un estado de carga sin intentar leer una solicitud todavía indefinida', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/aprobaciones/request-1']}>
          <Routes>
            <Route path="/aprobaciones/:requestId" element={<ApprovalDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText('Cargando solicitud…')).toBeInTheDocument()
    expect(screen.queryByText('Unexpected Application Error!')).not.toBeInTheDocument()
  })
})
