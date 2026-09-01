create or replace function private.resubmit_returned_request_impl(
  target_request uuid,
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
  req public.early_friday_requests%rowtype;
  membership public.team_members%rowtype;
  selected_period public.early_friday_periods%rowtype;
  next_status public.request_status;
  next_level public.approval_level;
  priority jsonb;
  deadline_days integer;
begin
  if actor is null then
    raise exception 'Debe iniciar sesión' using errcode = 'P0001';
  end if;

  select * into req
  from public.early_friday_requests
  where id = target_request
  for update;

  if req.id is null or req.requester_user_id <> actor then
    raise exception 'Solo puede corregir solicitudes propias devueltas' using errcode = 'P0001';
  end if;
  if req.status <> 'RETURNED_FOR_CORRECTION' then
    raise exception 'La solicitud no está disponible para corrección' using errcode = 'P0001';
  end if;
  if target_date <= current_date or extract(isodow from target_date) <> 5 then
    raise exception 'La fecha debe ser un viernes futuro' using errcode = 'P0001';
  end if;
  if request_reason is not null and length(request_reason) > 500 then
    raise exception 'El comentario no puede superar 500 caracteres' using errcode = 'P0001';
  end if;

  select * into membership
  from public.team_members tm
  where tm.user_id = actor
    and tm.valid_from <= target_date
    and (tm.valid_until is null or tm.valid_until >= target_date)
  order by tm.valid_from desc
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
    from public.early_friday_requests other_request
    where other_request.requester_user_id = actor
      and other_request.requested_date = target_date
      and other_request.id <> req.id
      and other_request.status not in (
        'REJECTED_BY_TEAM_LEADER', 'REJECTED_BY_PORTFOLIO', 'CANCELLED', 'EXPIRED'
      )
      and other_request.deleted_at is null
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

  update public.early_friday_requests
  set team_id = membership.team_id,
      period_id = selected_period.id,
      requested_date = target_date,
      requested_start_time = start_time,
      requested_end_time = end_time,
      reason = nullif(trim(request_reason), ''),
      status = next_status,
      current_approval_level = next_level,
      rotation_priority = (priority ->> 'score')::integer,
      priority_explanation = priority,
      submitted_at = now()
  where id = req.id;

  insert into public.notifications (user_id, type, title, body, request_id)
  select t.leader_user_id,
    'APPROVAL_REQUIRED'::public.notification_type,
    'Solicitud corregida pendiente',
    'Una solicitud corregida requiere una nueva revisión.',
    req.id
  from public.teams t
  where t.id = membership.team_id and next_level = 'TEAM_LEADER'
  union all
  select ur.user_id,
    'APPROVAL_REQUIRED'::public.notification_type,
    'Solicitud corregida pendiente',
    'Una solicitud corregida requiere una nueva revisión.',
    req.id
  from public.user_roles ur
  join public.roles ro on ro.id = ur.role_id
  where ro.code = 'PORTFOLIO_MANAGER'
    and next_level = 'PORTFOLIO'
    and (ur.valid_until is null or ur.valid_until > now());

  insert into public.notifications (user_id, type, title, body, request_id)
  values (
    actor,
    'REQUEST_UPDATED',
    'Solicitud reenviada',
    'Tu solicitud corregida volvió al flujo de aprobación.',
    req.id
  );

  return jsonb_build_object(
    'request_id', req.id,
    'status', next_status,
    'priority', priority
  );
end
$$;

revoke all on function private.resubmit_returned_request_impl(uuid, date, time, time, text)
  from public, anon;
grant execute on function private.resubmit_returned_request_impl(uuid, date, time, time, text)
  to authenticated;
