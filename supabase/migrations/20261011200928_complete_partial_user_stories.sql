-- Completes the backend gaps identified in HU-04, HU-07, HU-13 and HU-14.
-- The migration is additive: it does not delete business data or rewrite
-- historical decisions. Every privileged implementation validates auth.uid()
-- and is exposed through a SECURITY INVOKER wrapper.

-- HU-04: using the benefit on the immediately previous Friday is a hard
-- eligibility constraint, not merely a rotation-score penalty. Because every
-- approval RPC revalidates this function, the rule is enforced again at both
-- approval boundaries even if the request was created earlier.
create or replace function private.get_user_eligibility_impl(
  target_user uuid,
  target_date date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  membership public.team_members%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Debe iniciar sesión' using errcode = 'P0001';
  end if;

  if extract(isodow from target_date) <> 5 then
    return jsonb_build_object(
      'eligible', false,
      'reason', 'La fecha no es viernes',
      'reasons', jsonb_build_array('La fecha no es viernes')
    );
  end if;

  select * into membership
  from public.team_members tm
  where tm.user_id = target_user
    and tm.valid_from <= target_date
    and (tm.valid_until is null or tm.valid_until >= target_date)
  order by tm.valid_from desc
  limit 1;

  if membership.id is null or not membership.is_eligible or not membership.participates_in_rotation then
    return jsonb_build_object(
      'eligible', false,
      'reason', 'Membresía no elegible',
      'reasons', jsonb_build_array('Membresía no elegible')
    );
  end if;

  if exists (
    select 1
    from public.rotation_history rh
    where rh.user_id = target_user
      and rh.usage = 'USED'
      and rh.benefit_date = target_date - 7
  ) then
    return jsonb_build_object(
      'eligible', false,
      'team_id', membership.team_id,
      'reason', 'El beneficio fue utilizado el viernes anterior',
      'reasons', jsonb_build_array('No se permiten Early Fridays utilizados en viernes consecutivos')
    );
  end if;

  if exists (
    select 1 from public.availability_periods ap
    where ap.user_id = target_user
      and target_date between ap.starts_on and ap.ends_on
      and ap.deleted_at is null
  ) then
    return jsonb_build_object(
      'eligible', false,
      'reason', 'Usuario no disponible',
      'reasons', jsonb_build_array('Usuario no disponible')
    );
  end if;

  if exists (
    select 1 from public.blocked_dates bd
    where bd.blocked_date = target_date and bd.deleted_at is null
  ) then
    return jsonb_build_object(
      'eligible', false,
      'reason', 'Fecha bloqueada',
      'reasons', jsonb_build_array('Fecha bloqueada')
    );
  end if;

  return jsonb_build_object(
    'eligible', true,
    'team_id', membership.team_id,
    'reason', 'Elegible',
    'reasons', jsonb_build_array()
  );
end
$$;

-- HU-07: return a sanitized, authorized and chronological request trail. Raw
-- JSON audit payloads remain private; callers only receive operational fields.
create or replace function private.get_request_timeline_impl(target_request uuid)
returns table (
  event_id text,
  event_type text,
  action text,
  occurred_at timestamptz,
  actor_name text,
  from_status text,
  to_status text,
  approval_level public.approval_level,
  decision public.approval_decision,
  comment text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  req public.early_friday_requests%rowtype;
begin
  if actor is null then
    raise exception 'Debe iniciar sesión' using errcode = 'P0001';
  end if;

  select * into req
  from public.early_friday_requests r
  where r.id = target_request and r.deleted_at is null;

  if req.id is null then
    raise exception 'Solicitud no encontrada' using errcode = 'P0002';
  end if;

  if not (
    req.requester_user_id = actor
    or private.leads_team(req.team_id, actor)
    or private.has_role('PORTFOLIO_MANAGER'::public.app_role, actor)
    or private.has_role('ADMIN'::public.app_role, actor)
  ) then
    raise exception 'No tiene permiso para consultar esta trazabilidad' using errcode = '42501';
  end if;

  return query
  select * from (
    select
      'audit-' || al.id::text as event_id,
      'STATUS'::text as event_type,
      al.action,
      al.occurred_at,
      coalesce(p.full_name, 'Sistema') as actor_name,
      al.old_data ->> 'status' as from_status,
      al.new_data ->> 'status' as to_status,
      null::public.approval_level as approval_level,
      null::public.approval_decision as decision,
      case
        when al.action = 'INSERT' then 'Solicitud registrada'
        when al.old_data ->> 'status' is distinct from al.new_data ->> 'status'
          then 'Cambio de estado'
        else 'Solicitud actualizada'
      end as comment
    from public.audit_logs al
    left join public.profiles p on p.id = al.actor_user_id
    where al.entity_table = 'early_friday_requests'
      and al.entity_id = target_request::text

    union all

    select
      'approval-' || ra.id::text,
      'DECISION'::text,
      'DECISION'::text,
      ra.decided_at,
      approver.full_name,
      null::text,
      null::text,
      ra.level,
      ra.decision,
      coalesce(ra.comment, ra.reason_code, 'Decisión registrada')
    from public.request_approvals ra
    join public.profiles approver on approver.id = ra.approver_user_id
    where ra.request_id = target_request
  ) events
  order by events.occurred_at asc, events.event_id asc;
end
$$;

create or replace function public.get_request_timeline(target_request uuid)
returns table (
  event_id text,
  event_type text,
  action text,
  occurred_at timestamptz,
  actor_name text,
  from_status text,
  to_status text,
  approval_level public.approval_level,
  decision public.approval_decision,
  comment text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.get_request_timeline_impl(target_request)
$$;

-- HU-13: persist an explainable recommendation generated only from authorized,
-- real operational data. This is deliberately advisory and cannot mutate a
-- request or execute an approval.
create or replace function private.generate_ai_recommendation_impl(
  target_scope public.ai_scope_type,
  target_team uuid default null,
  target_date date default null
)
returns public.ai_recommendations
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  analysis_date date := coalesce(target_date, current_date + ((5 - extract(isodow from current_date)::integer + 7) % 7));
  candidate record;
  request_count integer := 0;
  pending_count integer := 0;
  recommendation public.ai_recommendations;
begin
  if actor is null then
    raise exception 'Debe iniciar sesión' using errcode = 'P0001';
  end if;

  if target_scope = 'TEAM' then
    if target_team is null or not private.leads_team(target_team, actor) then
      raise exception 'Solo el jefe del equipo puede generar este análisis' using errcode = '42501';
    end if;
  elsif target_scope = 'GLOBAL' then
    if target_team is not null or not private.has_role('PORTFOLIO_MANAGER'::public.app_role, actor) then
      raise exception 'Solo Portfolio puede generar el análisis global' using errcode = '42501';
    end if;
  else
    raise exception 'Alcance de análisis no permitido' using errcode = 'P0001';
  end if;

  select count(*)::integer,
         count(*) filter (where r.status in ('PENDING_TEAM_LEADER', 'PENDING_PORTFOLIO'))::integer
    into request_count, pending_count
  from public.early_friday_requests r
  where r.deleted_at is null
    and (target_scope = 'GLOBAL' or r.team_id = target_team);

  select
    p.id as user_id,
    p.full_name,
    t.id as team_id,
    t.name as team_name,
    count(rh.id) filter (where rh.usage = 'USED')::integer as used_count,
    max(rh.benefit_date) filter (where rh.usage = 'USED') as last_used_date
  into candidate
  from public.team_members tm
  join public.profiles p on p.id = tm.user_id and p.is_active and p.deleted_at is null
  join public.teams t on t.id = tm.team_id and t.is_active and t.deleted_at is null
  left join public.rotation_history rh on rh.user_id = tm.user_id
  where tm.valid_until is null
    and tm.is_eligible
    and tm.participates_in_rotation
    and (target_scope = 'GLOBAL' or tm.team_id = target_team)
    and not exists (
      select 1 from public.rotation_history previous_use
      where previous_use.user_id = tm.user_id
        and previous_use.usage = 'USED'
        and previous_use.benefit_date = analysis_date - 7
    )
  group by p.id, p.full_name, t.id, t.name
  order by count(rh.id) filter (where rh.usage = 'USED') asc,
           max(rh.benefit_date) filter (where rh.usage = 'USED') asc nulls first,
           p.full_name asc
  limit 1;

  insert into public.ai_recommendations (
    scope, team_id, target_date, title, summary, confidence, evidence,
    warnings, suggested_action, deterministic_inputs, model_provider,
    model_name, generated_by, expires_at
  ) values (
    target_scope,
    case when target_scope = 'TEAM' then target_team else null end,
    analysis_date,
    case
      when candidate.user_id is null then 'No hay una candidatura elegible para el próximo viernes'
      else candidate.full_name || ' presenta la mayor oportunidad de rotación'
    end,
    case
      when candidate.user_id is null then 'Los datos actuales no permiten recomendar a una persona sin vulnerar las reglas de elegibilidad.'
      else format('%s registra %s usos confirmados en %s.', candidate.full_name, candidate.used_count, candidate.team_name)
    end,
    case when candidate.user_id is null then 35 else 85 end,
    jsonb_build_array(
      format('%s solicitudes autorizadas alimentan el análisis', request_count),
      format('%s solicitudes requieren una decisión', pending_count),
      case when candidate.user_id is null then 'Sin personas elegibles' else format('Último uso: %s', coalesce(candidate.last_used_date::text, 'sin uso previo')) end
    ),
    case when pending_count > 0
      then jsonb_build_array('Existen decisiones pendientes que pueden cambiar el resultado')
      else jsonb_build_array('Contrastar siempre con la cobertura operativa')
    end,
    'Usar esta evidencia como apoyo; la aprobación final sigue siendo humana.',
    jsonb_build_object(
      'request_count', request_count,
      'pending_count', pending_count,
      'candidate_user_id', candidate.user_id,
      'candidate_used_count', candidate.used_count,
      'generated_for_date', analysis_date
    ),
    'EARLY_FRIDAYS',
    'explainable-rules-v1',
    actor,
    now() + interval '7 days'
  ) returning * into recommendation;

  return recommendation;
end
$$;

create or replace function public.generate_ai_recommendation(
  target_scope public.ai_scope_type,
  target_team uuid default null,
  target_date date default null
)
returns public.ai_recommendations
language sql
security invoker
set search_path = ''
as $$
  select private.generate_ai_recommendation_impl(target_scope, target_team, target_date)
$$;

grant update (feedback, comment) on public.ai_feedback to authenticated;
drop policy if exists ai_feedback_update_own on public.ai_feedback;
create policy ai_feedback_update_own
on public.ai_feedback for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- HU-14: explicit administrator-only operations for people, roles and public
-- parameters. Portfolio team-management permissions remain unchanged because
-- they are an established operational responsibility, while these organization
-- and parameter operations require the ADMIN role at the database boundary.
create or replace function private.admin_update_profile_impl(
  target_user uuid,
  target_full_name text,
  target_job_title text,
  target_is_active boolean
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare updated_profile public.profiles;
begin
  if auth.uid() is null or not private.has_role('ADMIN'::public.app_role, auth.uid()) then
    raise exception 'Requiere rol Administrador' using errcode = '42501';
  end if;
  if target_user = auth.uid() and not target_is_active then
    raise exception 'No puede desactivar su propia cuenta administrativa' using errcode = 'P0001';
  end if;
  update public.profiles
  set full_name = trim(target_full_name),
      job_title = trim(target_job_title),
      is_active = target_is_active,
      updated_at = now()
  where id = target_user and deleted_at is null
  returning * into updated_profile;
  if updated_profile.id is null then
    raise exception 'Perfil no encontrado' using errcode = 'P0002';
  end if;
  return updated_profile;
end
$$;

create or replace function public.admin_update_profile(
  target_user uuid,
  target_full_name text,
  target_job_title text,
  target_is_active boolean
)
returns public.profiles
language sql
security invoker
set search_path = ''
as $$ select private.admin_update_profile_impl(target_user, target_full_name, target_job_title, target_is_active) $$;

create or replace function private.admin_assign_role_impl(
  target_user uuid,
  target_role public.app_role
)
returns public.user_roles
language plpgsql
security definer
set search_path = ''
as $$
declare selected_role_id uuid; assigned_role public.user_roles;
begin
  if auth.uid() is null or not private.has_role('ADMIN'::public.app_role, auth.uid()) then
    raise exception 'Requiere rol Administrador' using errcode = '42501';
  end if;
  if target_user = auth.uid() and target_role <> 'ADMIN' then
    raise exception 'No puede retirar su propio rol Administrador' using errcode = 'P0001';
  end if;
  select id into selected_role_id from public.roles where code = target_role;
  if selected_role_id is null then raise exception 'Rol no encontrado' using errcode = 'P0002'; end if;

  update public.user_roles
  set valid_until = now()
  where user_id = target_user
    and valid_until is null
    and role_id <> selected_role_id;

  select * into assigned_role
  from public.user_roles ur
  where ur.user_id = target_user and ur.role_id = selected_role_id
    and ur.valid_from <= now() and (ur.valid_until is null or ur.valid_until > now())
  order by ur.valid_from desc limit 1;

  if assigned_role.id is null then
    insert into public.user_roles(user_id, role_id, assigned_by)
    values(target_user, selected_role_id, auth.uid())
    returning * into assigned_role;
  end if;
  return assigned_role;
end
$$;

create or replace function public.admin_assign_role(target_user uuid, target_role public.app_role)
returns public.user_roles
language sql
security invoker
set search_path = ''
as $$ select private.admin_assign_role_impl(target_user, target_role) $$;

create or replace function private.admin_update_person_impl(
  target_user uuid,
  target_full_name text,
  target_job_title text,
  target_is_active boolean,
  target_role public.app_role
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare updated_profile public.profiles;
begin
  updated_profile := private.admin_update_profile_impl(
    target_user, target_full_name, target_job_title, target_is_active
  );
  perform private.admin_assign_role_impl(target_user, target_role);
  return updated_profile;
end
$$;

create or replace function public.admin_update_person(
  target_user uuid,
  target_full_name text,
  target_job_title text,
  target_is_active boolean,
  target_role public.app_role
)
returns public.profiles
language sql
security invoker
set search_path = ''
as $$
  select private.admin_update_person_impl(
    target_user, target_full_name, target_job_title, target_is_active, target_role
  )
$$;

create or replace function private.admin_update_setting_impl(target_key text, target_value jsonb)
returns public.system_settings
language plpgsql
security definer
set search_path = ''
as $$
declare updated_setting public.system_settings;
begin
  if auth.uid() is null or not private.has_role('ADMIN'::public.app_role, auth.uid()) then
    raise exception 'Requiere rol Administrador' using errcode = '42501';
  end if;
  update public.system_settings
  set value = target_value, updated_by = auth.uid(), updated_at = now()
  where key = target_key
  returning * into updated_setting;
  if updated_setting.key is null then raise exception 'Parámetro no encontrado' using errcode = 'P0002'; end if;
  return updated_setting;
end
$$;

create or replace function public.admin_update_setting(target_key text, target_value jsonb)
returns public.system_settings
language sql
security invoker
set search_path = ''
as $$ select private.admin_update_setting_impl(target_key, target_value) $$;

-- Least-privilege function exposure.
revoke all on function private.get_request_timeline_impl(uuid) from public, anon;
revoke all on function private.generate_ai_recommendation_impl(public.ai_scope_type, uuid, date) from public, anon;
revoke all on function private.admin_update_profile_impl(uuid, text, text, boolean) from public, anon;
revoke all on function private.admin_assign_role_impl(uuid, public.app_role) from public, anon;
revoke all on function private.admin_update_person_impl(uuid, text, text, boolean, public.app_role) from public, anon;
revoke all on function private.admin_update_setting_impl(text, jsonb) from public, anon;

revoke all on function public.get_request_timeline(uuid) from public, anon;
revoke all on function public.generate_ai_recommendation(public.ai_scope_type, uuid, date) from public, anon;
revoke all on function public.admin_update_profile(uuid, text, text, boolean) from public, anon;
revoke all on function public.admin_assign_role(uuid, public.app_role) from public, anon;
revoke all on function public.admin_update_person(uuid, text, text, boolean, public.app_role) from public, anon;
revoke all on function public.admin_update_setting(text, jsonb) from public, anon;

grant execute on function private.get_request_timeline_impl(uuid) to authenticated;
grant execute on function private.generate_ai_recommendation_impl(public.ai_scope_type, uuid, date) to authenticated;
grant execute on function private.admin_update_profile_impl(uuid, text, text, boolean) to authenticated;
grant execute on function private.admin_assign_role_impl(uuid, public.app_role) to authenticated;
grant execute on function private.admin_update_person_impl(uuid, text, text, boolean, public.app_role) to authenticated;
grant execute on function private.admin_update_setting_impl(text, jsonb) to authenticated;

grant execute on function public.get_request_timeline(uuid) to authenticated;
grant execute on function public.generate_ai_recommendation(public.ai_scope_type, uuid, date) to authenticated;
grant execute on function public.admin_update_profile(uuid, text, text, boolean) to authenticated;
grant execute on function public.admin_assign_role(uuid, public.app_role) to authenticated;
grant execute on function public.admin_update_person(uuid, text, text, boolean, public.app_role) to authenticated;
grant execute on function public.admin_update_setting(text, jsonb) to authenticated;
