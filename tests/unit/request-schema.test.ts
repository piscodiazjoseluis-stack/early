import { describe, expect, it } from 'vitest'
import { newRequestSchema } from '@/features/requests/schemas/request-schema'

describe('Capstone HU-02 y límites horarios locales', () => {
  const input = { requestedDate: '2026-10-23', departureTime: '13:00', reason: 'QA anónimo' }
  it('admite un viernes con hora de apertura', () => {
    expect(newRequestSchema.safeParse(input).success).toBe(true)
  })
  it.each(['2026-10-22', '2026-10-24', '', 'no-fecha'])(
    'rechaza una fecha no permitida %j',
    (requestedDate) =>
      expect(newRequestSchema.safeParse({ ...input, requestedDate }).success).toBe(false),
  )
  it.each(['12:59', '15:00', '15:01', ''])(
    'rechaza una hora fuera del intervalo %j',
    (departureTime) =>
      expect(newRequestSchema.safeParse({ ...input, departureTime }).success).toBe(false),
  )
  it('rechaza comentarios mayores de 500 caracteres', () => {
    expect(newRequestSchema.safeParse({ ...input, reason: 'x'.repeat(501) }).success).toBe(false)
  })
})
