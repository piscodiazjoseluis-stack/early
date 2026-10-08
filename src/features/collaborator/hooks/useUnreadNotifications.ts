import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'

import { collaboratorPreviewNotifications } from '../data/collaborator-preview-data'
import { getMyNotifications } from '../services/collaborator-service'

export function useUnreadNotifications() {
  const location = useLocation()
  const { access } = useAuth()
  const preview = location.pathname.startsWith('/sistema-visual')
  const query = useQuery({
    queryKey: ['my-notifications'],
    queryFn: getMyNotifications,
    enabled: !preview && Boolean(access),
    refetchInterval: 30_000,
  })
  const notifications = preview ? collaboratorPreviewNotifications : (query.data ?? [])

  return notifications.filter((item) => !item.read_at).length
}
