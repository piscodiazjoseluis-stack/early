import { createContext } from 'react'

import type { AuthState, SignInCredentials } from '../types'

export interface AuthContextValue extends AuthState {
  login: (credentials: SignInCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshAccess: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
