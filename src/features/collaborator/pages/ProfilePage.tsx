import { useMutation } from '@tanstack/react-query'
import { Check, Mail, Save, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/hooks/useAuth'

import { updateMyProfile } from '../services/collaborator-service'

export function ProfilePage({ preview = false }: { preview?: boolean }) {
  const { access, user, refreshAccess } = useAuth()
  const [fullName, setFullName] = useState(
    preview ? 'Jose Pisco' : (access?.profile.full_name ?? ''),
  )
  const [timezone, setTimezone] = useState(
    preview ? 'America/Lima' : (access?.profile.timezone ?? 'America/Lima'),
  )
  const [feedback, setFeedback] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: () => updateMyProfile({ userId: access?.profile.id ?? '', fullName, timezone }),
    onSuccess: async () => {
      await refreshAccess()
      setFeedback('Perfil actualizado correctamente.')
    },
    onError: () => setFeedback('No pudimos actualizar tu perfil.'),
  })
  const jobTitle = preview
    ? 'Practicante / PMO'
    : (access?.profile.job_title ?? 'Sin cargo registrado')
  const email = preview ? 'jose.pisco@empresa.com' : (user?.email ?? 'Correo no disponible')
  const roles = preview ? ['COLLABORATOR'] : (access?.roles ?? [])

  return (
    <AppLayout>
      <div className="mx-auto max-w-[960px]">
        <header>
          <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">Mi perfil</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Revisa tu identidad corporativa, permisos y preferencias de sesión.
          </p>
        </header>
        <div className="mt-6 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Card className="h-fit p-6 text-center">
            <span className="relative mx-auto grid size-24 place-items-center rounded-full bg-[#f0e7e3] text-2xl font-extrabold text-[#704435]">
              {getInitials(fullName || 'Usuario')}
              <span className="border-surface bg-success absolute right-1 bottom-1 grid size-6 place-items-center rounded-full border-2 text-white">
                <Check className="size-3.5" />
              </span>
            </span>
            <h2 className="text-primary mt-4 text-xl font-extrabold">{fullName || 'Usuario'}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{jobTitle}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {roles.map((role) => (
                <Badge key={role} tone="info">
                  {role === 'COLLABORATOR' ? 'Colaborador' : role}
                </Badge>
              ))}
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <CardHeader title="Información personal" icon={<UserRound className="size-5" />} />
            <div className="mt-5 space-y-4">
              <label className="text-primary block text-xs font-extrabold">
                Nombre completo
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="input-control mt-2"
                />
              </label>
              <label className="text-primary block text-xs font-extrabold">
                Correo corporativo
                <div className="border-border bg-background text-muted-foreground mt-2 flex h-11 items-center gap-2 rounded-xl border px-3 text-sm">
                  <Mail className="size-4" />
                  {email}
                </div>
              </label>
              <label className="text-primary block text-xs font-extrabold">
                Zona horaria
                <select
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="input-control mt-2"
                >
                  <option value="America/Lima">Lima / Bogotá (UTC-5)</option>
                  <option value="America/Mexico_City">Ciudad de México</option>
                  <option value="America/Santiago">Santiago</option>
                </select>
              </label>
              <div className="border-border bg-background rounded-xl border p-4">
                <p className="text-primary flex items-center gap-2 text-sm font-extrabold">
                  <ShieldCheck className="text-electric-blue size-4" />
                  Datos administrados por la empresa
                </p>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  El cargo, código de colaborador y roles requieren actualización administrativa.
                </p>
              </div>
              {feedback ? (
                <p className="text-success text-sm" role="status">
                  {feedback}
                </p>
              ) : null}
              <div className="flex justify-end">
                <Button
                  disabled={fullName.trim().length < 3 || mutation.isPending || preview}
                  onClick={() => mutation.mutate()}
                >
                  <Save className="size-4" />
                  {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
              {preview ? (
                <p className="text-muted-foreground text-center text-[11px]">
                  La edición queda habilitada al iniciar sesión con una cuenta real.
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

export function ProfilePreviewPage() {
  return <ProfilePage preview />
}
function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
