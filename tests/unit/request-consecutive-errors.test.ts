import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRequest, resubmitReturnedRequest } from '@/features/requests/services/request-service'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock('@/lib/supabase/client', () => ({ supabase: { rpc } }))

describe('Regla de reserva de viernes consecutivos', () => {
  beforeEach(() => rpc.mockReset())

  it.each([
    'No puedes reservar viernes consecutivos: existe una solicitud para el 2026-10-23.',
    'No puedes reservar viernes consecutivos: existe una solicitud o un uso confirmado en una fecha contigua.',
  ])('conserva el motivo autoritativo del servidor: %s', async (message) => {
    rpc.mockResolvedValue({ data: null, error: { message } })
    await expect(createRequest({ requestedDate: '2026-10-30', departureTime: '14:00' }))
      .rejects.toThrow(message)
  })

  it('también informa el bloqueo al reenviar una solicitud devuelta', async () => {
    const message = 'No puedes reservar viernes consecutivos: existe una solicitud para el 2026-10-23.'
    rpc.mockResolvedValue({ data: null, error: { message } })
    await expect(resubmitReturnedRequest('test-id', { requestedDate: '2026-10-30', departureTime: '14:00' }))
      .rejects.toThrow(message)
  })
})
