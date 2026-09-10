-- Align the approved mockup and expose one authoritative preflight payload for
-- the collaborator request form. The public wrappers are intentionally limited
-- to the signed-in user; privileged reads remain in the private schema.

update public.early_friday_periods
set default_end_time = time '15:00',
    updated_at = now()
where name = 'Periodo inicial 2026'
  and default_end_time = time '15:30';

create or replace function private.get_request_form_context_impl(
  target_date date,
  departure_time time
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  membership public.team_members%rowtype;
  selected_period public.early_friday_periods%rowtype;
  eligibility jsonb := jsonb_build_object('eligible', false, 'reasons', jsonb_build_array());
  priority jsonb := jsonb_build_object('score', 0, 'uses', 0, 'last_used_date', null);
  deadline_days integer := 0;
  date_valid boolean := false;
  period_valid boolean := false;
  schedule_valid boolean := false;
  duplicate_free boolean := false;
  capacity_available boolean := false;
  rotation_valid boolean := false;
  within_deadline boolean := false;
  personal_last_used date;
  personal_last_approved_by text;
  team_last_used_date date;
  team_last_used_by_name text;
  team_last_used_by_title text;
  team_last_used_by_avatar text;
  annual_uses integer := 0;
  score integer := 0;
  priority_label text := 'Baja';
begin
  if actor is null then
    raise exception 'Debe iniciar sesión' using errcode = 'P0001';
  end if;

  select * into membership
  from public.team_members tm
  where tm.user_id = actor
    and tm.valid_from <= target_date
    and (tm.valid_until is null or tm.valid_until >= target_date)
  order by tm.valid_from desc
  limit 1;

  date_valid := extract(isodow from target_date) = 5 and target_date > current_date;

  select * into selected_period
  from public.early_friday_periods p
  where p.is_active
    and target_date between p.starts_on and p.ends_on
  order by p.starts_on desc
  limit 1;

  period_valid := selected_period.id is not null;

  if period_valid then
    deadline_days := greatest(
      0,
      ceil(extract(epoch from selected_period.request_deadline_interval) / 86400)::integer
    );
    schedule_valid := departure_time >= selected_period.default_start_time
      and departure_time < selected_period.default_end_time;
    within_deadline := current_date <= target_date - deadline_days;
  end if;

  if membership.id is not null then
    eligibility := private.get_user_eligibility_impl(actor, target_date);
    priority := private.calculate_rotation_priority_impl(actor, target_date);
    rotation_valid := coalesce((eligibility ->> 'eligible')::boolean, false);

    duplicate_free := not exists (
      select 1
      from public.early_friday_requests r
      where r.requester_user_id = actor
        and r.requested_date = target_date
        and r.status not in (
          'REJECTED_BY_TEAM_LEADER', 'REJECTED_BY_PORTFOLIO',
          'CANCELLED', 'EXPIRED'
        )
        and r.deleted_at is null
    );

    capacity_available := not exists (
      select 1
      from public.early_friday_requests r
      where r.team_id = membership.team_id
        and r.requested_date = target_date
        and r.status in ('FINAL_APPROVED', 'USED', 'NOT_USED')
        and r.deleted_at is null
    );

    select rh.benefit_date
      into personal_last_used
    from public.rotation_history rh
    where rh.user_id = actor and rh.usage = 'USED'
    order by rh.benefit_date desc
    limit 1;

    if personal_last_used is not null then
      select approver.full_name
        into personal_last_approved_by
      from public.early_friday_requests r
      join public.request_approvals ra on ra.request_id = r.id
      join public.profiles approver on approver.id = ra.approver_user_id
      where r.requester_user_id = actor
        and r.requested_date = personal_last_used
        and ra.decision = 'APPROVED'
      order by ra.decided_at desc
      limit 1;
    end if;

    select rh.benefit_date, p.full_name, p.job_title, p.avatar_url
      into team_last_used_date, team_last_used_by_name, team_last_used_by_title, team_last_used_by_avatar
    from public.rotation_history rh
    join public.profiles p on p.id = rh.user_id
    where rh.team_id = membership.team_id and rh.usage = 'USED'
    order by rh.benefit_date desc
    limit 1;

    select count(*)::integer
      into annual_uses
    from public.rotation_history rh
    where rh.user_id = actor
      and rh.usage = 'USED'
      and extract(year from rh.benefit_date) = extract(year from target_date);
  end if;

  score := coalesce((priority ->> 'score')::integer, 0);
  priority_label := case
    when score >= 75 then 'Alta'
    when score >= 45 then 'Media'
    else 'Baja'
  end;

  return jsonb_build_object(
    'applicant_has_team', membership.id is not null,
    'period', case when period_valid then jsonb_build_object(
      'name', selected_period.name,
      'starts_on', selected_period.starts_on,
      'ends_on', selected_period.ends_on,
      'minimum_departure_time', selected_period.default_start_time,
      'maximum_departure_time', selected_period.default_end_time,
      'deadline_days', deadline_days
    ) else null end,
    'eligibility', jsonb_build_object(
      'eligible', rotation_valid,
      'score', score,
      'priority_label', priority_label,
      'annual_uses', annual_uses,
      'annual_limit', 6,
      'personal_last_used_date', personal_last_used,
      'personal_last_approved_by', personal_last_approved_by,
      'team_last_used_date', team_last_used_date,
      'team_last_used_by_name', team_last_used_by_name,
      'team_last_used_by_title', team_last_used_by_title,
      'team_last_used_by_avatar', team_last_used_by_avatar,
      'reasons', coalesce(eligibility -> 'reasons', '[]'::jsonb),
      'evidence', coalesce(priority -> 'evidence', '[]'::jsonb)
    ),
    'checks', jsonb_build_array(
      jsonb_build_object('key', 'date', 'label', 'Fecha válida', 'detail', case when date_valid then 'Es un viernes futuro disponible.' else 'Selecciona un viernes futuro.' end, 'valid', date_valid),
      jsonb_build_object('key', 'period', 'label', 'Período habilitado', 'detail', case when period_valid then 'El período actual permite solicitudes de Early Friday.' else 'No existe un período habilitado para esta fecha.' end, 'valid', period_valid),
      jsonb_build_object('key', 'schedule', 'label', 'Horario permitido', 'detail', case when period_valid then format('La hora propuesta debe estar entre %s y %s.', to_char(selected_period.default_start_time, 'HH24:MI'), to_char(selected_period.default_end_time, 'HH24:MI')) else 'No hay un horario disponible para esta fecha.' end, 'valid', schedule_valid),
      jsonb_build_object('key', 'duplicate', 'label', 'Sin duplicidad personal', 'detail', case when duplicate_free then 'No tienes otra solicitud activa para la misma fecha.' else 'Ya tienes una solicitud activa para la misma fecha.' end, 'valid', duplicate_free),
      jsonb_build_object('key', 'capacity', 'label', 'Cupo del equipo disponible', 'detail', case when capacity_available then 'Tu equipo tiene cupo disponible para esta fecha.' else 'Tu equipo ya tiene un Early Friday aprobado para esta fecha.' end, 'valid', capacity_available),
      jsonb_build_object('key', 'rotation', 'label', 'Rotación válida', 'detail', case when rotation_valid then format('Tu prioridad en la rotación actual es %s.', priority_label) else 'No cumples las reglas de elegibilidad o rotación para esta fecha.' end, 'valid', rotation_valid),
      jsonb_build_object('key', 'deadline', 'label', 'Dentro del plazo', 'detail', case when within_deadline then format('La solicitud se registra con al menos %s días de anticipación.', deadline_days) else format('La solicitud debe registrarse con al menos %s días de anticipación.', deadline_days) end, 'valid', within_deadline)
    ),
    'all_ready', date_valid and period_valid and schedule_valid and duplicate_free
      and capacity_available and rotation_valid and within_deadline
  );
end
$$;

create or replace function public.get_request_form_context(
  target_date date,
  departure_time time
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.get_request_form_context_impl(target_date, departure_time)
$$;

create or replace function public.create_early_friday_departure_request(
  target_date date,
  departure_time time,
  request_reason text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  configured_end_time time;
begin
  select p.default_end_time
    into configured_end_time
  from public.early_friday_periods p
  where p.is_active and target_date between p.starts_on and p.ends_on
  order by p.starts_on desc
  limit 1;

  if configured_end_time is null then
    raise exception 'No existe un periodo activo para esa fecha' using errcode = 'P0001';
  end if;

  if departure_time >= configured_end_time then
    raise exception 'La hora propuesta debe ser anterior al límite del horario permitido' using errcode = 'P0001';
  end if;

  return private.create_request_impl(target_date, departure_time, configured_end_time, request_reason);
end
$$;

revoke all on function private.get_request_form_context_impl(date, time) from public, anon;
revoke all on function public.get_request_form_context(date, time) from public, anon;
revoke all on function public.create_early_friday_departure_request(date, time, text) from public, anon;
grant execute on function public.get_request_form_context(date, time) to authenticated;
grant execute on function public.create_early_friday_departure_request(date, time, text) to authenticated;
grant execute on function private.get_request_form_context_impl(date, time) to authenticated;
