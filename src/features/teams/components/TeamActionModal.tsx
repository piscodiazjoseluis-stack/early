import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

import {
  assignOrMoveTeamMember,
  assignTeamLeader,
  configureTeamMember,
  createTeam,
  getAvailableProfiles,
  updateTeam,
} from '../services/team-service'
import type { TeamView } from '../types'

export type TeamAction = 'create' | 'edit' | 'leader' | 'member' | 'eligibility'

const titles: Record<TeamAction, string> = {
  create: 'Crear equipo',
  edit: 'Editar equipo',
  leader: 'Asignar jefe directo',
  member: 'Agregar o mover integrante',
  eligibility: 'Configurar elegibilidad',
}

export function TeamActionModal({
  action,
  team,
  preview,
  onClose,
}: {
  action: TeamAction | null
  team?: TeamView
  preview: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(action === 'edit' ? (team?.name ?? '') : '')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState(action === 'edit' ? (team?.description ?? '') : '')
  const [userId, setUserId] = useState('')
  const [membershipId, setMembershipId] = useState(team?.members[0]?.membershipId ?? '')
  const [eligible, setEligible] = useState(true)
  const [rotation, setRotation] = useState(true)
  const profiles = useQuery({
    queryKey: ['available-profiles'],
    queryFn: getAvailableProfiles,
    enabled: Boolean(action && ['leader', 'member'].includes(action) && !preview),
  })

  const mutation = useMutation({
    mutationFn: async () => {
      if (!action) return
      if (preview) return
      if (action === 'create') return createTeam({ code, name, description })
      if (!team) throw new Error('Selecciona un equipo.')
      if (action === 'edit') return updateTeam(team.id, { name, description })
      if (action === 'leader') return assignTeamLeader(team.id, userId)
      if (action === 'member')
        return assignOrMoveTeamMember({
          teamId: team.id,
          userId,
          isEligible: eligible,
          participatesInRotation: rotation,
        })
      return configureTeamMember({
        membershipId,
        isEligible: eligible,
        participatesInRotation: rotation,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teams'] })
      onClose()
    },
  })

  if (!action) return null

  return (
    <Modal open title={titles[action]} onClose={onClose} showFooter={false}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          void mutation.mutateAsync()
        }}
      >
        {preview ? (
          <div className="border-electric-blue/20 bg-info-soft text-primary rounded-xl border p-3 text-xs leading-5">
            Esta es la vista de fidelidad visual. Las operaciones reales se habilitan en la ruta
            autenticada para administradores.
          </div>
        ) : null}
        {action === 'create' || action === 'edit' ? (
          <>
            {action === 'create' ? (
              <Field label="Código">
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="TEAM_NUEVO"
                  required
                  className="input-control"
                />
              </Field>
            ) : null}
            <Field label="Nombre">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="input-control"
              />
            </Field>
            <Field label="Descripción">
              <textarea
                value={description ?? ''}
                onChange={(event) => setDescription(event.target.value)}
                className="input-control min-h-24 py-3"
              />
            </Field>
          </>
        ) : null}
        {action === 'leader' || action === 'member' ? (
          <Field label={action === 'leader' ? 'Nuevo jefe' : 'Integrante'}>
            <select
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              required
              disabled={preview}
              className="input-control"
            >
              <option value="">Seleccionar usuario</option>
              {profiles.data?.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name} · {profile.job_title}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        {action === 'eligibility' ? (
          <Field label="Integrante">
            <select
              value={membershipId}
              onChange={(event) => setMembershipId(event.target.value)}
              required
              disabled={preview}
              className="input-control"
            >
              {team?.members.map((member) => (
                <option key={member.membershipId} value={member.membershipId}>
                  {member.fullName}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        {action === 'member' || action === 'eligibility' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle label="Es elegible" checked={eligible} onChange={setEligible} />
            <Toggle label="Participa en rotación" checked={rotation} onChange={setRotation} />
          </div>
        ) : null}
        {mutation.error ? (
          <p role="alert" className="text-danger text-xs">
            {mutation.error.message}
          </p>
        ) : null}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={preview || mutation.isPending}>
            {mutation.isPending
              ? 'Guardando…'
              : action === 'create'
                ? 'Crear equipo'
                : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-primary block text-xs font-extrabold">
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="border-border hover:border-electric-blue flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs font-bold transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-electric-blue size-4"
      />
      {label}
    </label>
  )
}
