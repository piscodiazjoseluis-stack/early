create or replace function private.request_cancellation_impl(
  target_request uuid,
  target_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  req public.early_friday_requests%rowtype;
  resulting_status public.request_status;
begin
  if actor is null then
    raise exception 'Requiere una sesión autenticada' using errcode = 'P0001';
  end if;

  select * into req
  from public.early_friday_requests
  where id = target_request
  for update;

  if req.id is null then
    raise exception 'Solicitud no encontrada' using errcode = 'P0001';
  end if;
  if req.requester_user_id <> actor then
    raise exception 'Solo puede cancelar solicitudes propias' using errcode = 'P0001';
  end if;
  if nullif(trim(target_reason), '') is null then
    raise exception 'Debe indicar el motivo' using errcode = 'P0001';
  end if;

  if req.status = 'FINAL_APPROVED' then
    resulting_status := 'CANCELLATION_REQUESTED';
    update public.early_friday_requests
    set status = resulting_status, cancellation_reason = trim(target_reason)
    where id = req.id;

    insert into public.notifications (user_id, type, title, body, request_id)
    select distinct ur.user_id,
      'APPROVAL_REQUIRED'::public.notification_type,
      'Cancelación pendiente de aprobación',
      'Se solicitó cancelar un Early Friday aprobado. Revisa la solicitud y registra tu decisión.',
      req.id
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.profiles p on p.id = ur.user_id
    where r.code = 'PORTFOLIO_MANAGER'
      and p.is_active
      and p.deleted_at is null
      and ur.valid_from <= current_date
      and (ur.valid_until is null or ur.valid_until >= current_date)
      and ur.user_id <> actor;
  elsif req.status in ('DRAFT', 'PENDING_TEAM_LEADER', 'PENDING_PORTFOLIO', 'RETURNED_FOR_CORRECTION') then
    resulting_status := 'CANCELLED';
    update public.early_friday_requests
    set status = resulting_status, cancellation_reason = trim(target_reason)
    where id = req.id;

    insert into public.notifications (user_id, type, title, body, request_id)
    values (
      req.requester_user_id,
      'CANCELLATION',
      'Solicitud cancelada',
      'Tu solicitud de Early Friday fue cancelada correctamente.',
      req.id
    );
  else
    raise exception 'La solicitud no puede cancelarse en su estado actual' using errcode = 'P0001';
  end if;

  return jsonb_build_object('request_id', req.id, 'status', resulting_status);
end
$$;

create or replace function private.approve_cancellation_impl(target_request uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  req public.early_friday_requests%rowtype;
begin
  if actor is null or not private.has_role('PORTFOLIO_MANAGER', actor) then
    raise exception 'Requiere rol Portfolio Manager' using errcode = 'P0001';
  end if;

  select * into req
  from public.early_friday_requests
  where id = target_request
  for update;

  if req.id is null then
    raise exception 'Solicitud no encontrada' using errcode = 'P0001';
  end if;
  if req.status <> 'CANCELLATION_REQUESTED' then
    raise exception 'No existe una cancelación pendiente' using errcode = 'P0001';
  end if;
  if req.requester_user_id = actor then
    raise exception 'No puede autorizar su propia cancelación' using errcode = 'P0001';
  end if;

  insert into public.request_approvals (
    request_id, approver_user_id, requester_user_id, level, decision, comment
  ) values (
    req.id, actor, req.requester_user_id, 'PORTFOLIO', 'CANCELLATION_APPROVED', req.cancellation_reason
  );

  update public.early_friday_requests
  set status = 'CANCELLED', current_approval_level = 'COMPLETED'
  where id = req.id;

  insert into public.notifications (user_id, type, title, body, request_id)
  values (
    req.requester_user_id,
    'CANCELLATION',
    'Cancelación aprobada',
    'Portfolio aprobó la cancelación de tu Early Friday.',
    req.id
  );

  return jsonb_build_object('request_id', req.id, 'status', 'CANCELLED');
end
$$;

create or replace function private.confirm_usage_impl(
  target_request uuid,
  usage_value public.usage_status,
  usage_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  req public.early_friday_requests%rowtype;
  new_status public.request_status;
begin
  if actor is null then
    raise exception 'Requiere una sesión autenticada' using errcode = 'P0001';
  end if;

  select * into req
  from public.early_friday_requests
  where id = target_request
  for update;

  if req.id is null then
    raise exception 'Solicitud no encontrada' using errcode = 'P0001';
  end if;
  if req.status <> 'FINAL_APPROVED' then
    raise exception 'Solo puede confirmar solicitudes aprobadas finalmente' using errcode = 'P0001';
  end if;
  if current_date <= req.requested_date then
    raise exception 'El uso se confirma después del viernes' using errcode = 'P0001';
  end if;
  if actor <> req.requester_user_id and not private.has_role('PORTFOLIO_MANAGER', actor) then
    raise exception 'No tiene permiso para confirmar el uso' using errcode = 'P0001';
  end if;

  new_status := usage_value::text::public.request_status;

  insert into public.rotation_history (
    request_id, user_id, team_id, benefit_date, usage, confirmed_by, notes
  ) values (
    req.id, req.requester_user_id, req.team_id, req.requested_date, usage_value, actor, usage_notes
  );

  update public.early_friday_requests
  set status = new_status, usage_confirmed_at = now()
  where id = req.id;

  insert into public.notifications (user_id, type, title, body, request_id)
  values (
    req.requester_user_id,
    'USAGE_CONFIRMATION',
    case when usage_value = 'USED' then 'Uso confirmado' else 'No uso confirmado' end,
    case
      when usage_value = 'USED' then 'Registramos el uso de tu Early Friday para la rotación.'
      else 'Registramos que el Early Friday no fue utilizado; no contará como uso normal en la rotación.'
    end,
    req.id
  );

  return jsonb_build_object('request_id', req.id, 'status', new_status);
end
$$;

revoke all on function private.request_cancellation_impl(uuid, text) from public, anon;
revoke all on function private.approve_cancellation_impl(uuid) from public, anon;
revoke all on function private.confirm_usage_impl(uuid, public.usage_status, text) from public, anon;
grant execute on function private.request_cancellation_impl(uuid, text) to authenticated;
grant execute on function private.approve_cancellation_impl(uuid) to authenticated;
grant execute on function private.confirm_usage_impl(uuid, public.usage_status, text) to authenticated;
