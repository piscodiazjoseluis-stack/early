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

revoke all on function private.request_cancellation_impl(uuid, text) from public, anon;
grant execute on function private.request_cancellation_impl(uuid, text) to authenticated;
