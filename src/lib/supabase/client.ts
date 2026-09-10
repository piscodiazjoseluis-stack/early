import { createClient } from '@supabase/supabase-js'

import { getPublicEnvironment } from '@/lib/env'
import type { Database } from '@/types/database'

function createSupabaseBrowserClient() {
  const environment = getPublicEnvironment()

  if (!environment.VITE_SUPABASE_URL || !environment.VITE_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      'Supabase no está configurado. Copia .env.example a .env.local y agrega las credenciales públicas.',
    )
  }

  return createClient<Database>(
    environment.VITE_SUPABASE_URL,
    environment.VITE_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  )
}

export const supabase = createSupabaseBrowserClient()
