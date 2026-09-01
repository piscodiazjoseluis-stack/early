import { supabase } from '@/lib/supabase/client'

import type { AppRole, SignInCredentials, UserAccess } from '../types'

const rememberKey = 'early-fridays-remember-session'
const browserSessionKey = 'early-fridays-browser-session'

export async function signInWithPassword({ email, password, remember }: SignInCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    throw new Error(translateAuthError(error.message))
  }

  if (remember) {
    localStorage.setItem(rememberKey, 'true')
  } else {
    localStorage.removeItem(rememberKey)
  }
  sessionStorage.setItem(browserSessionKey, 'true')

  return data
}

export async function signOut() {
  localStorage.removeItem(rememberKey)
  sessionStorage.removeItem(browserSessionKey)
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error('No pudimos cerrar la sesión. Inténtalo nuevamente.')
  }
}

export async function enforceRememberPreference() {
  const shouldRemember = localStorage.getItem(rememberKey) === 'true'
  const isCurrentBrowserSession = sessionStorage.getItem(browserSessionKey) === 'true'

  if (!shouldRemember && !isCurrentBrowserSession) {
    await supabase.auth.signOut()
  }
}

export async function requestPasswordReset(email: string) {
  const redirectTo = `${window.location.origin}/actualizar-contrasena`
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  })

  if (error) {
    throw new Error(translateAuthError(error.message))
  }
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    throw new Error(translateAuthError(error.message))
  }
}

export async function getUserAccess(userId: string): Promise<UserAccess> {
  const currentIso = new Date().toISOString()
  const [profileResult, rolesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase
      .from('user_roles')
      .select('roles(code)')
      .eq('user_id', userId)
      .lte('valid_from', currentIso)
      .or(`valid_until.is.null,valid_until.gt.${currentIso}`),
  ])

  if (profileResult.error) {
    throw new Error('Tu cuenta existe, pero el perfil de Early Fridays no está disponible.')
  }
  if (rolesResult.error) {
    throw new Error('No pudimos comprobar los permisos de tu cuenta.')
  }

  const roles = rolesResult.data
    .map((entry) => entry.roles?.code)
    .filter((role): role is AppRole => Boolean(role))

  return { profile: profileResult.data, roles }
}

function translateAuthError(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.'
  }
  if (normalized.includes('email not confirmed')) {
    return 'Debes confirmar tu correo antes de iniciar sesión.'
  }
  if (normalized.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 8 caracteres.'
  }
  if (normalized.includes('rate limit')) {
    return 'Se realizaron demasiados intentos. Espera unos minutos.'
  }

  return 'No fue posible completar la operación. Inténtalo nuevamente.'
}
