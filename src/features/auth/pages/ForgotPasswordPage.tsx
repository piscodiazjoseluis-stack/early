import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Mail, Send } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { AuthShell } from '../components/AuthShell'
import { recoverySchema, type RecoveryFormValues } from '../schemas/auth-schemas'
import { requestPasswordReset } from '../services/auth-service'

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoveryFormValues>({ resolver: zodResolver(recoverySchema) })

  async function onSubmit(values: RecoveryFormValues) {
    setSubmitError(null)
    try {
      await requestPasswordReset(values.email)
      setSent(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No pudimos enviar el correo.')
    }
  }

  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-xl">
        <Link
          to="/iniciar-sesion"
          className="text-electric-blue hover:text-primary inline-flex items-center gap-2 text-sm font-semibold"
        >
          <ArrowLeft className="size-4" />
          Volver al inicio de sesión
        </Link>
        <h1 className="text-primary-strong mt-7 text-4xl font-extrabold">Recupera tu contraseña</h1>
        <p className="text-muted-foreground mt-4 leading-7">
          Te enviaremos un enlace seguro para establecer una nueva contraseña.
        </p>

        {sent ? (
          <div role="status" className="border-success/25 bg-success/5 mt-8 rounded-2xl border p-5">
            <p className="text-success font-bold">Revisa tu correo corporativo</p>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Si la cuenta existe, recibirás el enlace de recuperación. También revisa la carpeta de
              correo no deseado.
            </p>
          </div>
        ) : (
          <form className="mt-9 space-y-6" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
            <div>
              <label htmlFor="recovery-email" className="text-primary-strong text-sm font-bold">
                Correo corporativo
              </label>
              <div className="relative mt-2">
                <Mail
                  className="text-muted-foreground absolute top-1/2 left-4 size-5 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  className="border-border focus:border-electric-blue focus:ring-electric-blue/10 h-14 w-full rounded-xl border pr-4 pl-12 outline-none focus:ring-4"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-danger mt-2 text-sm">{errors.email.message}</p>}
            </div>
            {submitError && (
              <p role="alert" className="bg-danger/5 text-danger rounded-xl p-3 text-sm">
                {submitError}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-electric-blue hover:bg-primary flex h-14 w-full items-center justify-center gap-2 rounded-xl font-bold text-white disabled:opacity-60"
            >
              <Send className="size-5" />
              {isSubmitting ? 'Enviando…' : 'Enviar enlace seguro'}
            </button>
          </form>
        )}
      </div>
    </AuthShell>
  )
}
