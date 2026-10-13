import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

export type AiRecommendation = Database['public']['Tables']['ai_recommendations']['Row']
export type AiFeedback = Database['public']['Tables']['ai_feedback']['Row']
type AiScope = Database['public']['Enums']['ai_scope_type']
type AiFeedbackType = Database['public']['Enums']['ai_feedback_type']

export async function getLatestRecommendation(scope: AiScope, teamId?: string) {
  let query = supabase
    .from('ai_recommendations')
    .select('*')
    .eq('scope', scope)
    .order('created_at', { ascending: false })
    .limit(1)

  query = teamId ? query.eq('team_id', teamId) : query.is('team_id', null)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data
}

export async function generateRecommendation(scope: AiScope, teamId?: string) {
  const { data, error } = await supabase.rpc('generate_ai_recommendation', {
    target_scope: scope,
    target_team: teamId ?? null,
    target_date: null,
  })
  if (error) throw error
  return data
}

export async function getMyRecommendationFeedback(recommendationId: string) {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) throw authError ?? new Error('Debe iniciar sesión')
  const { data, error } = await supabase
    .from('ai_feedback')
    .select('*')
    .eq('recommendation_id', recommendationId)
    .eq('user_id', authData.user.id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveRecommendationFeedback(
  recommendationId: string,
  feedback: AiFeedbackType,
  comment?: string,
) {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) throw authError ?? new Error('Debe iniciar sesión')
  const { data, error } = await supabase
    .from('ai_feedback')
    .upsert(
      {
        recommendation_id: recommendationId,
        user_id: authData.user.id,
        feedback,
        comment: comment?.trim() || null,
      },
      { onConflict: 'recommendation_id,user_id' },
    )
    .select()
    .single()
  if (error) throw error
  return data
}
