import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { TeamApprovalRequest } from '@/features/approvals/types'

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    access: {
      profile: { id: 'portfolio-id', full_name: 'Maria Luisa Temoche' },
      roles: ['PORTFOLIO_MANAGER'],
    },
    logout: vi.fn(),
  }),
}))

const requests = vi.hoisted(() => {
  const baseRequest: TeamApprovalRequest = {
    id: 'request-august',
    requesterId: 'person-1',
    requesterName: 'Persona Agosto',
    requesterJobTitle: 'Practicante / PMO',
    requesterAvatarUrl: null,
    teamName: 'Team Uno',
    requestedDate: '2026-08-14',
    startTime: '14:00:00',
    endTime: '15:00:00',
    permittedStartTime: '13:00:00',
    permittedEndTime: '15:00:00',
    reason: 'Prueba',
    status: 'FINAL_APPROVED',
    approvalLevel: 'COMPLETED',
    priority: 70,
    submittedAt: '2026-08-10T10:00:00-05:00',
    finalDecidedAt: '2026-08-11T10:00:00-05:00',
    usageConfirmedAt: null,
    createdAt: '2026-08-10T10:00:00-05:00',
    updatedAt: '2026-08-11T10:00:00-05:00',
  }
  return [
    baseRequest,
    {
      ...baseRequest,
      id: 'request-september',
      requesterId: 'person-2',
      requesterName: 'Persona Septiembre',
      requestedDate: '2026-09-11',
      status: 'PENDING_PORTFOLIO',
      approvalLevel: 'PORTFOLIO',
      finalDecidedAt: null,
      submittedAt: '2026-09-08T10:00:00-05:00',
      createdAt: '2026-09-08T10:00:00-05:00',
      updatedAt: '2026-09-08T10:00:00-05:00',
    },
  ] satisfies TeamApprovalRequest[]
})

vi.mock('@/features/portfolio/services/portfolio-service', () => ({
  getPortfolioWorkspace: vi.fn().mockResolvedValue({ requests, teams: [] }),
}))

import { PortfolioAnalyticsPage } from '@/features/portfolio/pages/PortfolioAnalyticsPage'

describe('filtro de fechas de Portfolio', () => {
  it('recalcula los KPIs al cambiar el rango solicitado', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/bi-global']}>
          <PortfolioAnalyticsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    const requestsCard = (await screen.findAllByText('Solicitudes'))[0].parentElement
    expect(requestsCard).not.toBeNull()
    await waitFor(() => {
      expect(within(requestsCard).getByText('2')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-09-01' } })
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-09-30' } })

    await waitFor(() => {
      expect(within(requestsCard).getByText('1')).toBeInTheDocument()
    })
    expect(screen.getByText('1 solicitud en el período seleccionado.')).toBeInTheDocument()
  })
})
