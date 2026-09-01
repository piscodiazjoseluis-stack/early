import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Ingresa un correo válido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
  remember: z.boolean(),
})

export const recoverySchema = z.object({
  email: z.email('Ingresa un correo válido.'),
})

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Usa al menos 8 caracteres.')
      .regex(/[A-Z]/, 'Incluye al menos una mayúscula.')
      .regex(/[a-z]/, 'Incluye al menos una minúscula.')
      .regex(/[0-9]/, 'Incluye al menos un número.'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RecoveryFormValues = z.infer<typeof recoverySchema>
export type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>
