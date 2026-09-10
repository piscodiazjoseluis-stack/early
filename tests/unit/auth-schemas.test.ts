import { describe, expect, it } from 'vitest'

import { loginSchema, updatePasswordSchema } from '@/features/auth/schemas/auth-schemas'

describe('auth schemas', () => {
  it('rejects malformed login credentials', () => {
    const result = loginSchema.safeParse({
      email: 'correo-invalido',
      password: '',
      remember: false,
    })

    expect(result.success).toBe(false)
  })

  it('requires a strong matching password', () => {
    const weakResult = updatePasswordSchema.safeParse({
      password: 'password',
      confirmPassword: 'password',
    })
    const validResult = updatePasswordSchema.safeParse({
      password: 'Early2026',
      confirmPassword: 'Early2026',
    })

    expect(weakResult.success).toBe(false)
    expect(validResult.success).toBe(true)
  })
})
