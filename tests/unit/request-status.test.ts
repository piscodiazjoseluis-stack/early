import { describe, expect, it } from 'vitest'

import {
  isUsageConfirmationDue,
  requestStageSummary,
} from '@/features/requests/utils/request-status'

describe('estado de solicitudes aprobadas', () => {
  const today = new Date(2026, 7, 6, 12)

  it('mantiene como programado un beneficio cuya fecha todavía no llega', () => {
    expect(isUsageConfirmationDue('2026-08-14', today)).toBe(false)
    expect(requestStageSummary({ status: 'FINAL_APPROVED', requestedDate: '2099-08-14' })).toEqual({
      stage: 'Beneficio programado',
      responsible: 'Sin acción hasta el viernes solicitado',
    })
  })

  it('habilita la confirmación desde la fecha solicitada', () => {
    expect(isUsageConfirmationDue('2026-08-06', today)).toBe(true)
    expect(isUsageConfirmationDue('2026-08-05', today)).toBe(true)
  })
})
