import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase/client'

import {
  enforceRememberPreference,
  getUserAccess,
  signInWithPassword,
  signOut,
} from '../services/auth-service'
import type { AuthState, SignInCredentials } from '../types'
import { AuthContext } from './auth-context'

const initialState: AuthState = {
  session: null,
  user: null,
  access: null,
  isLoading: true,
  error: null,
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)

  const loadSessionAccess = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setState({ ...initialState, isLoading: false })
      return
    }

    try {
      const access = await getUserAccess(session.user.id)
      setState({
        session,
        user: session.user,
        access,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState({
        session,
        user: session.user,
        access: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'No pudimos cargar tu perfil.',
      })
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function initialize() {
      await enforceRememberPreference()
      const { data } = await supabase.auth.getSession()

      if (isMounted) {
        await loadSessionAccess(data.session)
      }
    }

    void initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        window.setTimeout(() => {
          void loadSessionAccess(session)
        }, 0)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadSessionAccess])

  const login = useCallback(async (credentials: SignInCredentials) => {
    setState((current) => ({ ...current, isLoading: true, error: null }))
    try {
      await signInWithPassword(credentials)
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: error instanceof Error ? error.message : 'No pudimos iniciar sesión.',
      }))
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut()
    queryClient.clear()
    setState({ ...initialState, isLoading: false })
  }, [])

  const refreshAccess = useCallback(async () => {
    if (state.session) {
      await loadSessionAccess(state.session)
    }
  }, [loadSessionAccess, state.session])

  const value = useMemo(
    () => ({ ...state, login, logout, refreshAccess }),
    [state, login, logout, refreshAccess],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
