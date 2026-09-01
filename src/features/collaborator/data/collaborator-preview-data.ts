import type { Database } from '@/types/database'
import type { TeamView } from '@/features/teams/types'

export type NotificationView = Database['public']['Tables']['notifications']['Row']

export const collaboratorPreviewNotifications: NotificationView[] = [
  {
    id: 'notification-1',
    user_id: 'preview-jose',
    type: 'REQUEST_RETURNED',
    title: 'Solicitud devuelta para corrección',
    body: 'Ajusta el horario propuesto y vuelve a enviar tu solicitud del 30 de mayo.',
    request_id: 'preview-returned',
    read_at: null,
    created_at: '2025-05-20T14:12:00Z',
  },
  {
    id: 'notification-2',
    user_id: 'preview-jose',
    type: 'REQUEST_APPROVED',
    title: 'Early Friday aprobado',
    body: 'Tu solicitud del 9 de mayo fue aprobada y registrada en tu calendario.',
    request_id: 'preview-09-may',
    read_at: null,
    created_at: '2025-05-08T16:30:00Z',
  },
  {
    id: 'notification-3',
    user_id: 'preview-jose',
    type: 'REQUEST_CREATED',
    title: 'Solicitud recibida',
    body: 'La solicitud del 23 de mayo está pendiente de la decisión de Portfolio.',
    request_id: 'preview-23-may',
    read_at: '2025-05-19T18:00:00Z',
    created_at: '2025-05-19T15:32:00Z',
  },
]

export const collaboratorPreviewEligibility = {
  eligible: true,
  score: 72,
  uses: 2,
  last_used_date: '2025-05-09',
  reasons: [] as string[],
  evidence: [
    'Cumples la membresía activa del Team Hugo Ramirez.',
    'No registras indisponibilidad para el viernes seleccionado.',
    'No utilizaste el beneficio la semana anterior.',
    'Tu uso se mantiene dentro del límite del período.',
  ],
}

export const collaboratorPreviewTeam: TeamView = {
  id: 'team-hugo',
  code: 'TEAM_HUGO',
  name: 'Team Hugo Ramirez',
  description: 'Equipo PMO liderado por Hugo Ramirez.',
  leaderUserId: 'hugo',
  leaderName: 'Hugo Ramirez',
  leaderJobTitle: 'Project Analyst',
  leaderAvatarUrl: null,
  members: [
    {
      membershipId: 'member-jose',
      userId: 'preview-jose',
      fullName: 'Jose Pisco',
      jobTitle: 'Practicante / PMO',
      avatarUrl: null,
      isEligible: true,
      eligibilityStatus: 'eligible' as const,
      participatesInRotation: true,
      priority: 'media' as const,
    },
    {
      membershipId: 'member-valeria',
      userId: 'preview-valeria',
      fullName: 'Valeria Cabrera',
      jobTitle: 'Practicante / PMO',
      avatarUrl: null,
      isEligible: true,
      eligibilityStatus: 'under_review' as const,
      participatesInRotation: true,
      priority: 'alta' as const,
    },
  ],
}
