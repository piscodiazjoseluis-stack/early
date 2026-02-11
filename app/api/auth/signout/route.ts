import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Revisamos si el usuario tiene una sesión activa antes de cerrar
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  // Obtenemos la URL base (localhost o producción) para redireccionar
  const requestUrl = new URL(request.url)
  
  return NextResponse.redirect(`${requestUrl.origin}/login`, {
    status: 301,
  })
}