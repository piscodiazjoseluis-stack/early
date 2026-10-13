import { supabase } from '@/lib/supabase/client'
import type { Database, Json } from '@/types/database'

export type AdminPerson = {
  id: string
  fullName: string
  jobTitle: string
  employeeCode: string
  isActive: boolean
  role: Database['public']['Enums']['app_role'] | null
}

type ProfileRow = Database['public']['Tables']['profiles']['Row'] & {
  user_roles: Array<{
    valid_until: string | null
    role: { code: Database['public']['Enums']['app_role'] } | null
  }>
}

export async function getAdminWorkspace() {
  const [peopleResult, settingsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, user_roles(valid_until, role:roles(code))')
      .is('deleted_at', null)
      .order('full_name'),
    supabase.from('system_settings').select('*').order('key'),
  ])
  if (peopleResult.error) throw peopleResult.error
  if (settingsResult.error) throw settingsResult.error
  return {
    people: (peopleResult.data as unknown as ProfileRow[]).map((person) => ({
      id: person.id,
      fullName: person.full_name,
      jobTitle: person.job_title,
      employeeCode: person.employee_code,
      isActive: person.is_active,
      role: person.user_roles.find((role) => role.valid_until === null)?.role?.code ?? null,
    })),
    settings: settingsResult.data,
  }
}

export async function updateAdminPerson(input: {
  id: string
  fullName: string
  jobTitle: string
  isActive: boolean
  role: Database['public']['Enums']['app_role']
}) {
  const { data, error } = await supabase.rpc('admin_update_person', {
    target_user: input.id,
    target_full_name: input.fullName,
    target_job_title: input.jobTitle,
    target_is_active: input.isActive,
    target_role: input.role,
  })
  if (error) throw error
  return data
}

export async function updateSystemSetting(key: string, value: Json) {
  const { data, error } = await supabase.rpc('admin_update_setting', {
    target_key: key,
    target_value: value,
  })
  if (error) throw error
  return data
}
