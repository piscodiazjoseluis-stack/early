import { z } from 'zod'

const optionalEnvironmentSchema = z.object({
  VITE_SUPABASE_URL: z.url().optional(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
})

export type PublicEnvironment = z.infer<typeof optionalEnvironmentSchema>

export function getPublicEnvironment(): PublicEnvironment {
  const result = optionalEnvironmentSchema.safeParse(import.meta.env)

  if (!result.success) {
    throw new Error('Las variables públicas de entorno tienen un formato inválido.')
  }

  return result.data
}

export function isSupabaseConfigured(): boolean {
  const environment = getPublicEnvironment()

  return Boolean(environment.VITE_SUPABASE_URL && environment.VITE_SUPABASE_PUBLISHABLE_KEY)
}
