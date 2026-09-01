import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { AuthShell } from '../components/AuthShell'
import { updatePasswordSchema, type UpdatePasswordFormValues } from '../schemas/auth-schemas'
import { updatePassword } from '../services/auth-service'

export function UpdatePasswordPage() {
  const [completed, setCompleted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordFormValues>({ resolver: zodResolver(updatePasswordSchema) })

  async function onSubmit(values: UpdatePasswordFormValues) {
    setSubmitError(null)
    try {
      await updatePassword(values.password)
      setCompleted(true)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'No pudimos actualizar la contraseña.',
      )
    }
  }

  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-xl">
        <h1 className="text-primary-strong text-4xl font-extrabold">Crea una nueva contraseña</h1>
        <p className="text-muted-foreground mt-4 leading-7">
          Utiliza una combinación segura que no uses en otros servicios.
        </p>

        {completed ? (
          <div className="border-success/25 bg-success/5 mt-8 rounded-2xl border p-5">
            <p className="text-success font-bold">Contraseña actualizada correctamente</p>
            <Link
              to="/panel"
              className="text-electric-blue hover:text-primary mt-4 inline-flex font-semibold"
            >
              Continuar al panel
            </Link>
          </div>
        ) : (
          <form className="mt-9 space-y-5" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
            <PasswordField
              id="new-password"
              label="Nueva contraseña"
              error={errors.password?.message}
              registration={register('password')}
            />
            <PasswordField
              id="confirm-password"
              label="Confirmar contraseña"
              error={errors.confirmPassword?.message}
              registration={register('confirmPassword')}
            />
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
              <KeyRound className="size-5" />
              {isSubmitting ? 'Actualizando…' : 'Actualizar contraseña'}
            </button>
          </form>
        )}
      </div>
    </AuthShell>
  )
}

interface PasswordFieldProps {
  id: string
  label: string
  error?: string
  registration: UseFormRegisterReturn
}

function PasswordField({ id, label, error, registration }: PasswordFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-primary-strong text-sm font-bold">
        {label}
      </label>
      <input
        id={id}
        type="password"
        autoComplete="new-password"
        className="border-border focus:border-electric-blue focus:ring-electric-blue/10 mt-2 h-14 w-full rounded-xl border px-4 outline-none focus:ring-4"
        {...registration}
      />
      {error && <p className="text-danger mt-2 text-sm">{error}</p>}
    </div>
  )
}
