import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Headphones, LockKeyhole, LogIn, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { AuthShell } from '../components/AuthShell'
import { useAuth } from '../hooks/useAuth'
import { loginSchema, type LoginFormValues } from '../schemas/auth-schemas'

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, error: authError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  })

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values)
      const navigationState = location.state as { from?: unknown } | null
      const destination =
        navigationState && typeof navigationState.from === 'string'
          ? navigationState.from
          : '/panel'
      void navigate(destination, { replace: true })
    } catch {
      // AuthContext exposes the translated error in the form.
    }
  }

  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-xl">
        <h1 className="text-primary-strong text-4xl font-extrabold tracking-tight sm:text-5xl">
          Bienvenido de nuevo
        </h1>
        <p className="text-muted-foreground mt-4 max-w-lg text-base leading-7 sm:text-lg">
          Inicia sesión para gestionar tus Early Fridays, colaborar con tu equipo y planificar con
          transparencia.
        </p>

        <form className="mt-10 space-y-6" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
          <div className="group">
            <label
              htmlFor="email"
              className="text-primary-strong group-focus-within:text-electric-blue text-sm font-bold transition-colors"
            >
              Correo corporativo
            </label>
            <div className="relative mt-2">
              <Mail
                className="text-muted-foreground group-hover:text-primary group-focus-within:text-electric-blue pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 transition-colors"
                aria-hidden="true"
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tucorreo@empresa.com"
                aria-invalid={Boolean(errors.email)}
                className="border-border text-primary-strong hover:border-primary/40 hover:shadow-soft focus:border-electric-blue focus:ring-electric-blue/10 h-14 w-full rounded-xl border bg-white pr-4 pl-12 transition-[border-color,box-shadow] outline-none placeholder:text-[#99a6bc] focus:ring-4"
                {...register('email')}
              />
            </div>
            {errors.email && <p className="text-danger mt-2 text-sm">{errors.email.message}</p>}
          </div>

          <div className="group">
            <label
              htmlFor="password"
              className="text-primary-strong group-focus-within:text-electric-blue text-sm font-bold transition-colors"
            >
              Contraseña
            </label>
            <div className="relative mt-2">
              <LockKeyhole
                className="text-muted-foreground group-hover:text-primary group-focus-within:text-electric-blue pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 transition-colors"
                aria-hidden="true"
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Ingresa tu contraseña"
                aria-invalid={Boolean(errors.password)}
                className="border-border text-primary-strong hover:border-primary/40 hover:shadow-soft focus:border-electric-blue focus:ring-electric-blue/10 h-14 w-full rounded-xl border bg-white pr-12 pl-12 transition-[border-color,box-shadow] outline-none placeholder:text-[#99a6bc] focus:ring-4"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="text-muted-foreground hover:bg-background hover:text-primary focus-visible:outline-electric-blue absolute top-1/2 right-3 grid size-9 -translate-y-1/2 place-items-center rounded-lg transition focus-visible:outline-2"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-danger mt-2 text-sm">{errors.password.message}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-muted-foreground hover:text-primary group/check flex cursor-pointer items-center gap-2 rounded-lg py-1 transition-colors">
              <input
                type="checkbox"
                className="border-border accent-electric-blue group-hover/check:ring-electric-blue/15 size-4 cursor-pointer rounded transition-shadow group-hover/check:ring-4"
                {...register('remember')}
              />
              Recordarme
            </label>
            <Link
              to="/recuperar-contrasena"
              className="text-electric-blue hover:text-primary focus-visible:outline-electric-blue text-sm font-semibold underline-offset-4 transition hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {authError && (
            <div
              role="alert"
              className="border-danger/20 bg-danger/5 text-danger rounded-xl border px-4 py-3 text-sm"
            >
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="from-primary to-electric-blue shadow-soft hover:shadow-card focus-visible:outline-electric-blue flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r px-5 font-bold text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn className="size-5" aria-hidden="true" />
            {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="text-muted-foreground mt-9 flex items-center gap-4 text-sm">
          <span className="bg-border h-px flex-1" />
          ¿Necesitas ayuda?
          <span className="bg-border h-px flex-1" />
        </div>
        <a
          href="mailto:administrador@empresa.com"
          className="text-electric-blue hover:text-primary focus-visible:outline-electric-blue group hover:bg-info-soft mx-auto mt-5 flex w-fit items-center justify-center gap-2 rounded-lg px-3 py-2 font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <Headphones
            className="size-5 transition-transform group-hover:scale-110 group-hover:-rotate-6"
            aria-hidden="true"
          />
          Contactar al administrador
        </a>
      </div>
    </AuthShell>
  )
}
