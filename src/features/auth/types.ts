import type { Session, User } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

export type AppRole = Database['public']['Enums']['app_role']
export type Profile = Database['public']['Tables']['profiles']['Row']

export interface UserAccess {
  profile: Profile
  roles: AppRole[]
}

export interface AuthState {
  session: Session | null
  user: User | null
  access: UserAccess | null
  isLoading: boolean
  error: string | null
}

export interface SignInCredentials {
  email: string
  password: string
  remember: boolean
}
