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
  confirmer_name text;
begin
  if actor is null then
    raise exception 'Requiere una sesión autenticada' using errcode = 'P0001';
  end if;

  select * into req
  from public.early_friday_requests
  where id = target_request
  for update;

  if req.id is null then raise exception 'Solicitud no encontrada' using errcode = 'P0001'; end if;
  if req.status <> 'FINAL_APPROVED' then
    raise exception 'Solo puede confirmar solicitudes aprobadas finalmente' using errcode = 'P0001';
  end if;
  if now() < ((req.requested_date + req.requested_end_time) at time zone 'America/Bogota') then
    raise exception 'El uso se confirma después de finalizar el horario aprobado' using errcode = 'P0001';
  end if;
  if actor <> req.requester_user_id
     and not private.leads_team(req.team_id, actor)
     and not private.has_role('PORTFOLIO_MANAGER', actor) then
    raise exception 'No tiene permiso para confirmar el uso' using errcode = 'P0001';
  end if;
  if usage_value = 'NOT_USED' and length(trim(coalesce(usage_notes, ''))) < 10 then
    raise exception 'Indique brevemente por qué no se utilizó el beneficio' using errcode = 'P0001';
  end if;

  new_status := usage_value::text::public.request_status;
  select p.full_name into confirmer_name from public.profiles p where p.id = actor;

  insert into public.rotation_history (
    request_id, user_id, team_id, benefit_date, usage, confirmed_by, notes
  ) values (
    req.id, req.requester_user_id, req.team_id, req.requested_date,
    usage_value, actor, nullif(trim(usage_notes), '')
  );

  update public.early_friday_requests
  set status = new_status, usage_confirmed_at = now()
  where id = req.id;

  insert into public.notifications (user_id, type, title, body, request_id)
  select req.requester_user_id,
    'USAGE_CONFIRMATION'::public.notification_type,
    case when usage_value = 'USED' then 'Uso de Early Friday confirmado' else 'Early Friday registrado como no utilizado' end,
    case
      when usage_value = 'USED' then coalesce(confirmer_name, 'Un responsable') || ' confirmó que utilizaste el beneficio. Este uso cuenta en tu rotación y límite anual.'
      else coalesce(confirmer_name, 'Un responsable') || ' confirmó que no utilizaste el beneficio. No consumirá uno de tus seis usos anuales.'
    end,
    req.id
  where actor <> req.requester_user_id;

  insert into public.notifications (user_id, type, title, body, request_id)
  select ur.user_id,
    'USAGE_CONFIRMATION'::public.notification_type,
    case when usage_value = 'USED' then 'Beneficio utilizado' else 'Beneficio no utilizado' end,
    coalesce(confirmer_name, 'Un responsable') || ' cerró la confirmación de uso del Early Friday.',
    req.id
  from public.user_roles ur
  join public.roles ro on ro.id = ur.role_id
  where ro.code = 'PORTFOLIO_MANAGER'
    and ur.user_id <> actor
    and (ur.valid_until is null or ur.valid_until > now());

  return jsonb_build_object(
    'request_id', req.id,
    'status', new_status,
    'counts_as_annual_use', usage_value = 'USED',
    'confirmed_by', actor,
    'confirmed_at', now()
  );
end
$$;

revoke all on function private.confirm_usage_impl(uuid, public.usage_status, text) from public, anon;
grant execute on function private.confirm_usage_impl(uuid, public.usage_status, text) to authenticated;
