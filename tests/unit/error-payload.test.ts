import { describe, expect, it } from 'vitest'

import { getClientErrorRoute, sanitizeClientError } from '@/lib/monitoring/error-payload'

describe('client error monitoring', () => {
  it('redacts emails and token-like values before reporting', () => {
    const token = 'abcdefghijklmnopqrstuvwxyz0123456789TOKEN'

    expect(sanitizeClientError(new Error(`Falló usuario@empresa.com con ${token}`))).toBe(
      'Falló [email] con [redacted]',
    )
  })

  it('reports only the pathname and excludes query-string data', () => {
    window.history.replaceState({}, '', '/aprobaciones/123?token=secreto#detalle')

    expect(getClientErrorRoute()).toBe('/aprobaciones/123')
  })

  it('limits the stored message to the database boundary', () => {
    expect(sanitizeClientError('Error repetido. '.repeat(100))).toHaveLength(1000)
  })
})
