create or replace function private.create_request_impl(
  target_date date,
  start_time time,
  end_time time,
  request_reason text default null
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
  next_status public.request_status;
  next_level public.approval_level;
  created_request public.early_friday_requests%rowtype;
  priority jsonb;
  deadline_days integer;
begin
  if actor is null then
    raise exception 'Debe iniciar sesión' using errcode = 'P0001';
  end if;

  if target_date <= current_date then
    raise exception 'La fecha solicitada debe ser futura' using errcode = 'P0001';
  end if;

  if request_reason is not null and length(request_reason) > 500 then
    raise exception 'El comentario no puede superar 500 caracteres' using errcode = 'P0001';
  end if;

  select * into membership
  from public.team_members tm
  where tm.user_id = actor and tm.valid_until is null
  limit 1;

  if membership.id is null then
    raise exception 'No tiene una membresía de equipo activa' using errcode = 'P0001';
  end if;

  if not (private.get_user_eligibility_impl(actor, target_date) ->> 'eligible')::boolean then
    raise exception 'No es elegible para la fecha seleccionada' using errcode = 'P0001';
  end if;

  select * into selected_period
  from public.early_friday_periods p
  where p.is_active and target_date between p.starts_on and p.ends_on
  order by p.starts_on desc
  limit 1;

  if selected_period.id is null then
    raise exception 'No existe un periodo activo para esa fecha' using errcode = 'P0001';
  end if;

  if start_time < selected_period.default_start_time
    or end_time > selected_period.default_end_time
    or end_time <= start_time then
    raise exception 'El horario está fuera del rango permitido' using errcode = 'P0001';
  end if;

  deadline_days := greatest(
    0,
    ceil(extract(epoch from selected_period.request_deadline_interval) / 86400)::integer
  );
  if current_date > target_date - deadline_days then
    raise exception 'La solicitud está fuera del plazo establecido' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.early_friday_requests r
    where r.requester_user_id = actor
      and r.requested_date = target_date
      and r.status not in (
        'REJECTED_BY_TEAM_LEADER', 'REJECTED_BY_PORTFOLIO',
        'CANCELLED', 'EXPIRED'
      )
      and r.deleted_at is null
  ) then
    raise exception 'Ya existe una solicitud activa para esa fecha' using errcode = 'P0001';
  end if;

  if private.leads_team(membership.team_id, actor) then
    next_status := 'PENDING_PORTFOLIO';
    next_level := 'PORTFOLIO';
  else
    next_status := 'PENDING_TEAM_LEADER';
    next_level := 'TEAM_LEADER';
  end if;

  priority := private.calculate_rotation_priority_impl(actor, target_date);

  insert into public.early_friday_requests (
    requester_user_id, team_id, period_id, requested_date,
    requested_start_time, requested_end_time, reason, status,
    current_approval_level, rotation_priority, priority_explanation, submitted_at
  ) values (
    actor, membership.team_id, selected_period.id, target_date,
    start_time, end_time, nullif(trim(request_reason), ''), next_status,
    next_level, (priority ->> 'score')::integer, priority, now()
  ) returning * into created_request;

  insert into public.notifications (user_id, type, title, body, request_id)
  select t.leader_user_id, 'APPROVAL_REQUIRED', 'Nueva solicitud pendiente',
    'Tiene una solicitud de Early Friday por revisar.', created_request.id
  from public.teams t
  where t.id = membership.team_id and next_level = 'TEAM_LEADER'
  union all
  select ur.user_id, 'APPROVAL_REQUIRED', 'Nueva solicitud pendiente',
    'Tiene una solicitud de Early Friday por revisar.', created_request.id
  from public.user_roles ur
  join public.roles ro on ro.id = ur.role_id
  where ro.code = 'PORTFOLIO_MANAGER' and next_level = 'PORTFOLIO'
    and (ur.valid_until is null or ur.valid_until > now());

  return jsonb_build_object(
    'request_id', created_request.id,
    'status', created_request.status,
    'priority', priority
  );
end
$$;

revoke all on function private.create_request_impl(date, time, time, text) from public, anon;
grant execute on function private.create_request_impl(date, time, time, text) to authenticated;
