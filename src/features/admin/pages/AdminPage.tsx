import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Settings2, ShieldCheck, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import type { AppRole } from '@/features/auth/types'
import type { Json } from '@/types/database'

import {
  getAdminWorkspace,
  updateAdminPerson,
  updateSystemSetting,
  type AdminPerson,
} from '../services/admin-service'

const roles: AppRole[] = ['COLLABORATOR', 'TEAM_LEADER', 'PORTFOLIO_MANAGER']

export function AdminPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const workspace = useQuery({ queryKey: ['admin-workspace'], queryFn: getAdminWorkspace })
  const [person, setPerson] = useState<AdminPerson | null>(null)
  const [settingKey, setSettingKey] = useState<string | null>(null)
  const setting = workspace.data?.settings.find((item) => item.key === settingKey)
  const activePeople = workspace.data?.people.filter((item) => item.isActive).length ?? 0

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1420px] space-y-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">
              Administración
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Personas, roles, equipos y parámetros gestionados por Portfolio Manager.
            </p>
          </div>
          <Button onClick={() => void navigate('/equipos')}>
            <UsersRound /> Gestionar equipos
          </Button>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <Summary label="Personas activas" value={activePeople} icon={<UsersRound />} />
          <Summary
            label="Parámetros"
            value={workspace.data?.settings.length ?? 0}
            icon={<Settings2 />}
          />
          <Summary label="Control de acceso" value="Portfolio" icon={<ShieldCheck />} />
        </section>

        {workspace.error ? (
          <p className="text-danger" role="alert">
            {workspace.error.message}
          </p>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
          <Card className="overflow-hidden">
            <div className="border-border border-b p-5">
              <CardHeader title="Personas y permisos" icon={<UsersRound className="size-5" />} />
            </div>
            <div className="bounded-records divide-border divide-y">
              {workspace.data?.people.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-primary truncate text-sm font-extrabold">{item.fullName}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {item.employeeCode} · {item.jobTitle}
                    </p>
                  </div>
                  <Badge tone={item.isActive ? 'success' : 'danger'}>
                    {item.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                  <Badge tone="info">{item.role ?? 'Sin rol'}</Badge>
                  <Button variant="secondary" onClick={() => setPerson(item)}>
                    Editar
                  </Button>
                </article>
              ))}
            </div>
          </Card>

          <Card className="h-fit overflow-hidden">
            <div className="border-border border-b p-5">
              <CardHeader title="Parámetros del sistema" icon={<Settings2 className="size-5" />} />
            </div>
            <div className="divide-border divide-y">
              {workspace.data?.settings.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSettingKey(item.key)}
                  className="hover:bg-info-soft/30 w-full p-5 text-left transition"
                >
                  <span className="text-primary block text-sm font-extrabold">{item.key}</span>
                  <span className="text-muted-foreground mt-1 block text-xs leading-5">
                    {item.description}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <PersonModal
        key={person?.id ?? 'no-person'}
        person={person}
        onClose={() => setPerson(null)}
        onSaved={async () => {
          await queryClient.invalidateQueries({ queryKey: ['admin-workspace'] })
          setPerson(null)
        }}
      />
      <SettingModal
        key={setting?.key ?? 'no-setting'}
        setting={setting ?? null}
        onClose={() => setSettingKey(null)}
        onSaved={async () => {
          await queryClient.invalidateQueries({ queryKey: ['admin-workspace'] })
          setSettingKey(null)
        }}
      />
    </AppLayout>
  )
}

function PersonModal({
  person,
  onClose,
  onSaved,
}: {
  person: AdminPerson | null
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [fullName, setFullName] = useState(person?.fullName ?? '')
  const [jobTitle, setJobTitle] = useState(person?.jobTitle ?? '')
  const [role, setRole] = useState<AppRole>(person?.role ?? 'COLLABORATOR')
  const [isActive, setIsActive] = useState(person?.isActive ?? true)
  const mutation = useMutation({
    mutationFn: () => updateAdminPerson({ id: person.id, fullName, jobTitle, role, isActive }),
    onSuccess: onSaved,
  })
  if (!person) return null
  return (
    <Modal open title="Editar persona" onClose={onClose} showFooter={false}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        <AdminField label="Nombre completo" value={fullName} onChange={setFullName} />
        <AdminField label="Cargo" value={jobTitle} onChange={setJobTitle} />
        <label className="text-primary block text-xs font-extrabold">
          Rol principal
          <select
            className="input-control mt-2"
            value={role}
            onChange={(event) => setRole(event.target.value as AppRole)}
          >
            {roles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="border-border flex items-center gap-3 rounded-xl border p-3 text-sm font-bold">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          Cuenta activa
        </label>
        {mutation.error ? <p className="text-danger text-xs">{mutation.error.message}</p> : null}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function SettingModal({
  setting,
  onClose,
  onSaved,
}: {
  setting: Awaited<ReturnType<typeof getAdminWorkspace>>['settings'][number] | null
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [value, setValue] = useState(setting ? JSON.stringify(setting.value, null, 2) : '')
  const mutation = useMutation({
    mutationFn: () => updateSystemSetting(setting.key, parseJsonValue(value)),
    onSuccess: onSaved,
  })
  if (!setting) return null
  return (
    <Modal open title={`Editar ${setting.key}`} onClose={onClose} showFooter={false}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        <p className="text-muted-foreground text-sm">{setting.description}</p>
        <label className="text-primary block text-xs font-extrabold">
          Valor JSON
          <textarea
            className="input-control mt-2 min-h-48 py-3 font-mono text-xs"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        {mutation.error ? <p className="text-danger text-xs">{mutation.error.message}</p> : null}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function AdminField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="text-primary block text-xs font-extrabold">
      {label}
      <input
        className="input-control mt-2"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function Summary({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
}) {
  return (
    <Card className="p-5">
      <span className="text-electric-blue [&>svg]:size-5">{icon}</span>
      <p className="text-muted-foreground mt-3 text-xs font-bold">{label}</p>
      <p className="text-primary mt-1 text-2xl font-extrabold">{value}</p>
    </Card>
  )
}

function parseJsonValue(value: string): Json {
  const parsed: unknown = JSON.parse(value)
  return parsed as Json
}
