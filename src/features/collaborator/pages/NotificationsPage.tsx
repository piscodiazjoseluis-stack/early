import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, ChevronRight, Inbox } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/hooks/useAuth'

import { collaboratorPreviewNotifications } from '../data/collaborator-preview-data'
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/collaborator-service'
import { notificationRequestPath } from '../utils/notification-routing'

export function NotificationsPage({ preview = false }: { preview?: boolean }) {
  const navigate = useNavigate()
  const { access } = useAuth()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['my-notifications'],
    queryFn: getMyNotifications,
    enabled: !preview,
    refetchInterval: 30_000,
  })
  const [previewRead, setPreviewRead] = useState<string[]>([])
  const notifications = useMemo(
    () =>
      preview
        ? collaboratorPreviewNotifications.map((item) =>
            previewRead.includes(item.id) ? { ...item, read_at: new Date().toISOString() } : item,
          )
        : (query.data ?? []),
    [preview, previewRead, query.data],
  )
  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-notifications'] }),
  })
  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-notifications'] }),
  })
  const unread = notifications.filter((item) => !item.read_at).length

  function openNotification(id: string, requestId: string | null) {
    if (preview) setPreviewRead((current) => [...new Set([...current, id])])
    else markOne.mutate(id)
    if (requestId) {
      void navigate(notificationRequestPath(access?.roles ?? [], requestId, preview), {
        state: { from: 'notifications' },
      })
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1120px]">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-primary-strong text-2xl font-extrabold sm:text-3xl">
              Notificaciones
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Mantente al día con decisiones, correcciones y recordatorios.
            </p>
          </div>
          <Button
            variant="secondary"
            disabled={unread === 0 || markAll.isPending}
            onClick={() =>
              preview ? setPreviewRead(notifications.map((item) => item.id)) : markAll.mutate()
            }
          >
            <CheckCheck className="size-4" />
            Marcar todas como leídas
          </Button>
        </header>
        <Card className="mt-6 overflow-hidden">
          <div className="border-border border-b p-5 sm:p-6">
            <CardHeader
              title={`${unread} pendientes`}
              icon={<Bell className="size-5" />}
              action={
                <Badge tone={unread ? 'info' : 'neutral'}>{notifications.length} total</Badge>
              }
            />
          </div>
          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="text-electric-blue mx-auto size-10" />
              <p className="text-primary mt-3 font-extrabold">Todo está al día</p>
            </div>
          ) : (
            <div className="bounded-records divide-border divide-y">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openNotification(item.id, item.request_id)}
                  className={`group grid w-full gap-3 p-5 text-left transition sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center ${item.read_at ? 'hover:bg-background' : 'bg-info-soft/45 hover:bg-info-soft'}`}
                >
                  <span
                    className={`grid size-11 place-items-center rounded-full ${item.read_at ? 'bg-background text-muted-foreground' : 'bg-electric-blue text-white'}`}
                  >
                    <Bell className="size-5" />
                  </span>
                  <span>
                    <span className="text-primary block text-sm font-extrabold">{item.title}</span>
                    <span className="text-muted-foreground mt-1 block text-xs leading-5">
                      {item.body}
                    </span>
                    <span className="text-muted-foreground mt-2 block text-[11px]">
                      {formatDateTime(item.created_at)}
                    </span>
                  </span>
                  <ChevronRight className="text-muted-foreground group-hover:text-electric-blue size-5 transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}

export function NotificationsPreviewPage() {
  return <NotificationsPage preview />
}
function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(date),
  )
}
