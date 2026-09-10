-- Make the database the authoritative boundary for request submission and
-- team-leader approval. The form preflight remains useful UX, but it is not a
-- security or integrity boundary.

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
  annual_uses integer;
begin
  if actor is null then
    raise exception 'Debe iniciar sesión' using errcode = 'P0001';
  end if;

  if extract(isodow from target_date) <> 5 or target_date <= current_date then
    raise exception 'La fecha debe ser un viernes futuro' using errcode = 'P0001';
  end if;

  select * into membership
  from public.team_members tm
  where tm.user_id = actor
    and tm.valid_from <= target_date
    and (tm.valid_until is null or tm.valid_until >= target_date)
  order by tm.valid_from desc
  limit 1;

  if membership.id is null then
    raise exception 'No tiene una membresía de equipo activa para esa fecha' using errcode = 'P0001';
  end if;

  if not coalesce((private.get_user_eligibility_impl(actor, target_date) ->> 'eligible')::boolean, false) then
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
     or start_time >= selected_period.default_end_time
     or end_time <> selected_period.default_end_time then
    raise exception 'El horario propuesto está fuera del rango permitido' using errcode = 'P0001';
  end if;

  if current_date > target_date - greatest(
    0,
    ceil(extract(epoch from selected_period.request_deadline_interval) / 86400)::integer
  ) then
    raise exception 'La solicitud está fuera del plazo permitido' using errcode = 'P0001';
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
    raise exception 'Ya tiene una solicitud activa para la misma fecha' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.early_friday_requests r
    where r.team_id = membership.team_id
      and r.requested_date = target_date
      and r.status in ('FINAL_APPROVED', 'USED', 'NOT_USED')
      and r.deleted_at is null
  ) then
    raise exception 'El equipo ya tiene un Early Friday aprobado para esa fecha' using errcode = 'P0001';
  end if;

  select count(*)::integer into annual_uses
  from public.rotation_history rh
  where rh.user_id = actor
    and rh.usage = 'USED'
    and extract(year from rh.benefit_date) = extract(year from target_date);

  if annual_uses >= 6 then
    raise exception 'Alcanzó el límite anual de Early Fridays' using errcode = 'P0001';
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
    start_time, selected_period.default_end_time, request_reason, next_status,
    next_level, (priority ->> 'score')::integer, priority, now()
  ) returning * into created_request;

  insert into public.notifications (user_id, type, title, body, request_id)
  select t.leader_user_id,
    'APPROVAL_REQUIRED'::public.notification_type,
    'Nueva solicitud pendiente',
    'Tiene una solicitud de Early Friday por revisar.',
    created_request.id
  from public.teams t
  where t.id = membership.team_id and next_level = 'TEAM_LEADER'
  union all
  select ur.user_id,
    'APPROVAL_REQUIRED'::public.notification_type,
    'Nueva solicitud pendiente',
    'Tiene una solicitud de Early Friday por revisar.',
    created_request.id
  from public.user_roles ur
  join public.roles ro on ro.id = ur.role_id
  where ro.code = 'PORTFOLIO_MANAGER'
    and next_level = 'PORTFOLIO'
    and (ur.valid_until is null or ur.valid_until > now());

  return jsonb_build_object(
    'request_id', created_request.id,
    'status', created_request.status,
    'priority', priority
  );
end
$$;

create or replace function private.approve_team_leader_impl(target_request uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  req public.early_friday_requests%rowtype;
  selected_period public.early_friday_periods%rowtype;
  annual_uses integer;
begin
  select * into req
  from public.early_friday_requests
  where id = target_request
  for update;

  if req.id is null then raise exception 'Solicitud no encontrada' using errcode = 'P0001'; end if;
  if req.requester_user_id = actor then raise exception 'No puede aprobar su propia solicitud' using errcode = 'P0001'; end if;
  if not private.leads_team(req.team_id, actor) then raise exception 'No es jefe de este equipo' using errcode = 'P0001'; end if;
  if req.status <> 'PENDING_TEAM_LEADER' then raise exception 'La solicitud no está pendiente del jefe' using errcode = 'P0001'; end if;
  if req.requested_date < current_date then raise exception 'La fecha solicitada ya venció' using errcode = 'P0001'; end if;

  if not coalesce((private.get_user_eligibility_impl(req.requester_user_id, req.requested_date) ->> 'eligible')::boolean, false) then
    raise exception 'El colaborador ya no es elegible para esa fecha' using errcode = 'P0001';
  end if;

  select * into selected_period
  from public.early_friday_periods p
  where p.id = req.period_id and p.is_active
  limit 1;

  if selected_period.id is null
     or req.requested_start_time < selected_period.default_start_time
     or req.requested_start_time >= selected_period.default_end_time
     or req.requested_end_time <> selected_period.default_end_time then
    raise exception 'La solicitud ya no cumple el horario o periodo habilitado' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.early_friday_requests conflict
    where conflict.team_id = req.team_id
      and conflict.requested_date = req.requested_date
      and conflict.id <> req.id
      and conflict.status in ('FINAL_APPROVED', 'USED', 'NOT_USED')
      and conflict.deleted_at is null
  ) then
    raise exception 'El equipo ya tiene un Early Friday aprobado para esa fecha' using errcode = 'P0001';
  end if;

  select count(*)::integer into annual_uses
  from public.rotation_history rh
  where rh.user_id = req.requester_user_id
    and rh.usage = 'USED'
    and extract(year from rh.benefit_date) = extract(year from req.requested_date);

  if annual_uses >= 6 then
    raise exception 'El colaborador alcanzó el límite anual de Early Fridays' using errcode = 'P0001';
  end if;

  insert into public.request_approvals (
    request_id, approver_user_id, requester_user_id, level, decision
  ) values (
    req.id, actor, req.requester_user_id, 'TEAM_LEADER', 'APPROVED'
  );

  update public.early_friday_requests
  set status = 'PENDING_PORTFOLIO', current_approval_level = 'PORTFOLIO'
  where id = req.id;

  insert into public.notifications (user_id, type, title, body, request_id)
  select ur.user_id,
    'APPROVAL_REQUIRED'::public.notification_type,
    'Solicitud pendiente de aprobación final',
    'Una solicitud aprobada por el jefe requiere decisión final.',
    req.id
  from public.user_roles ur
  join public.roles ro on ro.id = ur.role_id
  where ro.code = 'PORTFOLIO_MANAGER'
    and (ur.valid_until is null or ur.valid_until > now());

  return jsonb_build_object('request_id', req.id, 'status', 'PENDING_PORTFOLIO');
end
$$;

revoke all on function private.create_request_impl(date, time, time, text) from public, anon;
revoke all on function private.approve_team_leader_impl(uuid) from public, anon;
grant execute on function private.create_request_impl(date, time, time, text) to authenticated;
grant execute on function private.approve_team_leader_impl(uuid) to authenticated;
