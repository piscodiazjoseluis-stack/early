-- Portfolio is the final integrity boundary. Revalidate every mutable rule and
-- serialize decisions by team/date before promoting a request.
create or replace function private.approve_portfolio_impl(target_request uuid)
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
  if actor is null or not private.has_role('PORTFOLIO_MANAGER', actor) then
    raise exception 'Requiere rol Portfolio Manager' using errcode = 'P0001';
  end if;

  select * into req
  from public.early_friday_requests
  where id = target_request
  for update;

  if req.id is null then raise exception 'Solicitud no encontrada' using errcode = 'P0001'; end if;
  if req.requester_user_id = actor then raise exception 'No puede aprobar su propia solicitud' using errcode = 'P0001'; end if;
  if req.status <> 'PENDING_PORTFOLIO' then raise exception 'La solicitud no está pendiente de aprobación final' using errcode = 'P0001'; end if;
  if req.requested_date < current_date then raise exception 'La fecha solicitada ya venció' using errcode = 'P0001'; end if;

  -- Every final decision for the same team and Friday takes the same lock.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(req.team_id::text || ':' || req.requested_date::text, 0)
  );

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
    req.id, actor, req.requester_user_id, 'PORTFOLIO', 'APPROVED'
  );

  update public.early_friday_requests
  set status = 'FINAL_APPROVED',
      current_approval_level = 'COMPLETED',
      final_decided_at = now()
  where id = req.id;

  insert into public.notifications (user_id, type, title, body, request_id)
  values (
    req.requester_user_id,
    'REQUEST_APPROVED'::public.notification_type,
    'Early Friday aprobado',
    'Portfolio aprobó tu solicitud. Ya se encuentra registrada en el calendario.',
    req.id
  );

  return jsonb_build_object('request_id', req.id, 'status', 'FINAL_APPROVED');
end
$$;

revoke all on function private.approve_portfolio_impl(uuid) from public, anon;
grant execute on function private.approve_portfolio_impl(uuid) to authenticated;
