import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Json } from '@/types/database'

import {
  generateRecommendation,
  getLatestRecommendation,
  saveRecommendationFeedback,
} from '../services/insights-service'

export function PersistedInsight({
  scope,
  teamId,
  preview = false,
}: {
  scope: 'TEAM' | 'GLOBAL'
  teamId?: string
  preview?: boolean
}) {
  const queryClient = useQueryClient()
  const queryKey = ['ai-recommendation', scope, teamId ?? 'global']
  const recommendation = useQuery({
    queryKey,
    queryFn: () => getLatestRecommendation(scope, teamId),
    enabled: !preview && (scope === 'GLOBAL' || Boolean(teamId)),
  })
  const generate = useMutation({
    mutationFn: () => generateRecommendation(scope, teamId),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey }),
  })
  const feedback = useMutation({
    mutationFn: (value: 'USEFUL' | 'NOT_USEFUL') =>
      saveRecommendationFeedback(recommendation.data.id, value),
  })
  const evidence = stringArray(recommendation.data?.evidence)
  const warnings = stringArray(recommendation.data?.warnings)

  return (
    <Card className="border-electric-blue/25 bg-gradient-to-br from-white to-[#f3f8ff] p-6 sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">Análisis persistido</Badge>
            {recommendation.data ? (
              <span className="text-muted-foreground text-[11px]">
                {new Intl.DateTimeFormat('es-PE', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(recommendation.data.created_at))}
              </span>
            ) : null}
          </div>
          <h2 className="text-primary mt-3 text-xl font-extrabold sm:text-2xl">
            {recommendation.data?.title ?? 'Genera un insight con la información operativa actual'}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-6">
            {recommendation.data?.summary ??
              'El motor utilizará únicamente solicitudes, uso confirmado, elegibilidad y alcance autorizados en Supabase.'}
          </p>
          {evidence.length ? (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {evidence.map((item) => (
                <li key={item} className="text-primary flex gap-2 text-xs">
                  <CheckCircle2 className="text-success size-4 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
          {warnings.length ? (
            <p className="text-warning mt-4 text-xs font-bold">
              Advertencia: {warnings.join(' · ')}
            </p>
          ) : null}
          {recommendation.data ? (
            <p className="text-primary mt-4 text-xs font-extrabold">
              Acción sugerida: {recommendation.data.suggested_action}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button onClick={() => generate.mutate()} disabled={preview || generate.isPending}>
            <RefreshCw className={generate.isPending ? 'animate-spin' : ''} />
            {recommendation.data ? 'Actualizar análisis' : 'Generar análisis'}
          </Button>
          {recommendation.data ? (
            <>
              <Button
                variant="secondary"
                aria-label="Marcar recomendación como útil"
                onClick={() => feedback.mutate('USEFUL')}
                disabled={feedback.isPending}
              >
                <ThumbsUp />
              </Button>
              <Button
                variant="secondary"
                aria-label="Marcar recomendación como no útil"
                onClick={() => feedback.mutate('NOT_USEFUL')}
                disabled={feedback.isPending}
              >
                <ThumbsDown />
              </Button>
            </>
          ) : null}
        </div>
      </div>
      {generate.error || recommendation.error || feedback.error ? (
        <p className="text-danger mt-4 text-xs" role="alert">
          {(generate.error ?? recommendation.error ?? feedback.error)?.message}
        </p>
      ) : null}
      {feedback.isSuccess ? (
        <p className="text-success mt-3 text-xs font-bold">Tu evaluación quedó registrada.</p>
      ) : null}
      {preview ? (
        <p className="text-muted-foreground mt-4 text-xs">
          La generación se habilita al iniciar sesión; la vista visual no escribe datos en Supabase.
        </p>
      ) : null}
      <p className="text-muted-foreground mt-5 border-t pt-4 text-[11px]">
        Motor {recommendation.data?.model_name ?? 'explainable-rules-v1'} · confianza{' '}
        {recommendation.data?.confidence ?? '—'}%. No aprueba solicitudes ni reemplaza la decisión
        humana.
      </p>
    </Card>
  )
}

function stringArray(value: Json | undefined): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}
