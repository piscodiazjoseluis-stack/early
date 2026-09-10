create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

create or replace function private.has_role(target_role public.app_role, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = target_user
      and r.code = target_role
      and ur.valid_from <= now()
      and (ur.valid_until is null or ur.valid_until > now())
  )
$$;

create or replace function private.leads_team(target_team uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.teams t
    where t.id = target_team
      and t.leader_user_id = target_user
      and t.deleted_at is null
      and t.is_active
  )
$$;

create or replace function private.is_team_member(target_team uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = target_team
      and tm.user_id = target_user
      and tm.valid_from <= current_date
      and (tm.valid_until is null or tm.valid_until >= current_date)
  )
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create or replace function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_id text;
begin
  row_id := coalesce((to_jsonb(new) ->> 'id'), (to_jsonb(old) ->> 'id'));
  insert into public.audit_logs (
    actor_user_id, action, entity_schema, entity_table, entity_id, old_data, new_data
  )
  values (
    auth.uid(), tg_op, tg_table_schema, tg_table_name, row_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end
$$;

create or replace function private.validate_request_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = new.status then
    return new;
  end if;

  if not (
    (old.status = 'DRAFT' and new.status in ('PENDING_TEAM_LEADER', 'PENDING_PORTFOLIO', 'CANCELLED'))
    or (old.status = 'RETURNED_FOR_CORRECTION' and new.status in ('PENDING_TEAM_LEADER', 'PENDING_PORTFOLIO', 'CANCELLED'))
    or (old.status = 'PENDING_TEAM_LEADER' and new.status in ('APPROVED_BY_TEAM_LEADER', 'REJECTED_BY_TEAM_LEADER', 'RETURNED_FOR_CORRECTION', 'CANCELLED', 'EXPIRED'))
    or (old.status = 'APPROVED_BY_TEAM_LEADER' and new.status = 'PENDING_PORTFOLIO')
    or (old.status = 'PENDING_PORTFOLIO' and new.status in ('FINAL_APPROVED', 'REJECTED_BY_PORTFOLIO', 'RETURNED_FOR_CORRECTION', 'CANCELLED', 'EXPIRED'))
    or (old.status = 'FINAL_APPROVED' and new.status in ('CANCELLATION_REQUESTED', 'USED', 'NOT_USED'))
    or (old.status = 'CANCELLATION_REQUESTED' and new.status in ('FINAL_APPROVED', 'CANCELLED'))
  ) then
    raise exception 'Transición de estado no permitida: % -> %', old.status, new.status
      using errcode = 'P0001';
  end if;

  return new;
end
$$;

create or replace function private.prevent_approval_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Las decisiones de aprobación son inmutables'
    using errcode = 'P0001';
end
$$;

create or replace function private.validate_request_context()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.team_members tm
    where tm.user_id = new.requester_user_id
      and tm.team_id = new.team_id
      and tm.valid_from <= new.requested_date
      and (tm.valid_until is null or tm.valid_until >= new.requested_date)
  ) and not exists (
    select 1 from public.teams t
    where t.id = new.team_id and t.leader_user_id = new.requester_user_id
  ) then
    raise exception 'El solicitante no pertenece al equipo indicado para esa fecha'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.blocked_dates bd
    where bd.blocked_date = new.requested_date and bd.deleted_at is null
  ) then
    raise exception 'El viernes seleccionado está bloqueado' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.early_friday_periods p
    where p.id = new.period_id and p.is_active
      and new.requested_date between p.starts_on and p.ends_on
  ) then
    raise exception 'La fecha no pertenece a un periodo activo' using errcode = 'P0001';
  end if;
  return new;
end
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'roles', 'teams', 'team_members', 'early_friday_periods',
    'early_friday_requests', 'availability_periods', 'blocked_dates',
    'exception_types', 'system_settings'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function private.set_updated_at()',
      table_name || '_set_updated_at', table_name
    );
  end loop;
end $$;

create trigger requests_validate_transition
before update of status on public.early_friday_requests
for each row execute function private.validate_request_transition();

create trigger requests_validate_context
before insert or update of requester_user_id, team_id, period_id, requested_date
on public.early_friday_requests
for each row execute function private.validate_request_context();

create trigger approvals_immutable
before update or delete on public.request_approvals
for each row execute function private.prevent_approval_mutation();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'user_roles', 'teams', 'team_members', 'early_friday_periods',
    'early_friday_requests', 'request_approvals', 'rotation_history',
    'availability_periods', 'blocked_dates', 'request_exceptions',
    'exception_types', 'system_settings', 'ai_recommendations', 'ai_feedback'
  ]
  loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function private.audit_row_change()',
      table_name || '_audit', table_name
    );
  end loop;
end $$;

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
  result jsonb;
begin
  if extract(isodow from target_date) <> 5 then
    return jsonb_build_object('eligible', false, 'reason', 'La fecha no es viernes');
  end if;

  select * into membership
  from public.team_members tm
  where tm.user_id = target_user
    and tm.valid_from <= target_date
    and (tm.valid_until is null or tm.valid_until >= target_date)
  order by tm.valid_from desc
  limit 1;

  if membership.id is null or not membership.is_eligible or not membership.participates_in_rotation then
    return jsonb_build_object('eligible', false, 'reason', 'Membresía no elegible');
  end if;

  if exists (
    select 1 from public.availability_periods ap
    where ap.user_id = target_user
      and target_date between ap.starts_on and ap.ends_on
      and ap.deleted_at is null
  ) then
    return jsonb_build_object('eligible', false, 'reason', 'Usuario no disponible');
  end if;

  if exists (
    select 1 from public.blocked_dates bd
    where bd.blocked_date = target_date and bd.deleted_at is null
  ) then
    return jsonb_build_object('eligible', false, 'reason', 'Fecha bloqueada');
  end if;

  result := jsonb_build_object(
    'eligible', true,
    'team_id', membership.team_id,
    'reason', 'Elegible'
  );
  return result;
end
$$;

create or replace function private.calculate_rotation_priority_impl(
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
  eligibility jsonb;
  used_count integer;
  last_used date;
  team_average numeric;
  score integer := 0;
  evidence jsonb := '[]'::jsonb;
  user_team uuid;
begin
  eligibility := private.get_user_eligibility_impl(target_user, target_date);
  if not (eligibility ->> 'eligible')::boolean then
    return jsonb_build_object('eligible', false, 'score', null, 'evidence', jsonb_build_array(eligibility ->> 'reason'));
  end if;
  user_team := (eligibility ->> 'team_id')::uuid;

  select count(*) filter (where usage = 'USED'), max(benefit_date) filter (where usage = 'USED')
  into used_count, last_used
  from public.rotation_history
  where user_id = target_user;

  select coalesce(avg(member_uses), 0)
  into team_average
  from (
    select tm.user_id, count(rh.id) filter (where rh.usage = 'USED')::numeric as member_uses
    from public.team_members tm
    left join public.rotation_history rh on rh.user_id = tm.user_id
    where tm.team_id = user_team and tm.valid_until is null
    group by tm.user_id
  ) s;

  if used_count = 0 then
    score := score + 40;
    evidence := evidence || jsonb_build_array('Nunca utilizó el beneficio: +40');
  end if;
  if last_used is null or last_used <= target_date - 28 then
    score := score + 30;
    evidence := evidence || jsonb_build_array('Más de cuatro semanas sin uso: +30');
  end if;
  if used_count < team_average then
    score := score + 20;
    evidence := evidence || jsonb_build_array('Uso menor al promedio del equipo: +20');
  end if;
  if last_used = target_date - 7 then
    score := score - 50;
    evidence := evidence || jsonb_build_array('Utilizó el beneficio la semana anterior: -50');
  end if;
  if exists (
    select 1 from public.early_friday_requests r
    where r.requester_user_id = target_user
      and r.requested_date > target_date
      and r.status in ('FINAL_APPROVED', 'USED', 'NOT_USED')
  ) then
    score := score - 30;
    evidence := evidence || jsonb_build_array('Tiene otro Early Friday próximo aprobado: -30');
  end if;

  return jsonb_build_object(
    'eligible', true, 'score', score, 'uses', used_count,
    'last_used_date', last_used, 'team_average', team_average,
    'evidence', evidence
  );
end
$$;

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
  selected_period uuid;
  next_status public.request_status;
  next_level public.approval_level;
  created_request public.early_friday_requests%rowtype;
  priority jsonb;
begin
  if actor is null then raise exception 'Debe iniciar sesión' using errcode = 'P0001'; end if;
  select * into membership from public.team_members tm
  where tm.user_id = actor and tm.valid_until is null limit 1;
  if membership.id is null then raise exception 'No tiene una membresía de equipo activa' using errcode = 'P0001'; end if;

  if not (private.get_user_eligibility_impl(actor, target_date) ->> 'eligible')::boolean then
    raise exception 'No es elegible para la fecha seleccionada' using errcode = 'P0001';
  end if;

  select p.id into selected_period from public.early_friday_periods p
  where p.is_active and target_date between p.starts_on and p.ends_on
  order by p.starts_on desc limit 1;
  if selected_period is null then raise exception 'No existe un periodo activo para esa fecha' using errcode = 'P0001'; end if;

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
    actor, membership.team_id, selected_period, target_date,
    start_time, end_time, request_reason, next_status,
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
  from public.user_roles ur join public.roles ro on ro.id = ur.role_id
  where ro.code = 'PORTFOLIO_MANAGER' and next_level = 'PORTFOLIO'
    and (ur.valid_until is null or ur.valid_until > now());

  return jsonb_build_object('request_id', created_request.id, 'status', created_request.status, 'priority', priority);
end
$$;

create or replace function private.approve_team_leader_impl(target_request uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid(); req public.early_friday_requests%rowtype;
begin
  select * into req from public.early_friday_requests where id = target_request for update;
  if req.id is null then raise exception 'Solicitud no encontrada' using errcode = 'P0001'; end if;
  if req.requester_user_id = actor then raise exception 'No puede aprobar su propia solicitud' using errcode = 'P0001'; end if;
  if not private.leads_team(req.team_id, actor) then raise exception 'No es jefe de este equipo' using errcode = 'P0001'; end if;
  if req.status <> 'PENDING_TEAM_LEADER' then raise exception 'La solicitud no está pendiente del jefe' using errcode = 'P0001'; end if;

  insert into public.request_approvals (request_id, approver_user_id, requester_user_id, level, decision)
  values (req.id, actor, req.requester_user_id, 'TEAM_LEADER', 'APPROVED');
  update public.early_friday_requests set status = 'APPROVED_BY_TEAM_LEADER', current_approval_level = 'PORTFOLIO' where id = req.id;
  update public.early_friday_requests set status = 'PENDING_PORTFOLIO' where id = req.id;
  insert into public.notifications (user_id, type, title, body, request_id)
  select ur.user_id, 'APPROVAL_REQUIRED', 'Solicitud pendiente de aprobación final',
    'Una solicitud aprobada por el jefe requiere decisión final.', req.id
  from public.user_roles ur join public.roles ro on ro.id = ur.role_id
  where ro.code = 'PORTFOLIO_MANAGER' and (ur.valid_until is null or ur.valid_until > now());
  return jsonb_build_object('request_id', req.id, 'status', 'PENDING_PORTFOLIO');
end
$$;

create or replace function private.approve_portfolio_impl(target_request uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid(); req public.early_friday_requests%rowtype;
begin
  if not private.has_role('PORTFOLIO_MANAGER', actor) then raise exception 'Requiere rol Portfolio Manager' using errcode = 'P0001'; end if;
  select * into req from public.early_friday_requests where id = target_request for update;
  if req.id is null then raise exception 'Solicitud no encontrada' using errcode = 'P0001'; end if;
  if req.requester_user_id = actor then raise exception 'No puede aprobar su propia solicitud' using errcode = 'P0001'; end if;
  if req.status <> 'PENDING_PORTFOLIO' then raise exception 'La solicitud no está pendiente de aprobación final' using errcode = 'P0001'; end if;

  insert into public.request_approvals (request_id, approver_user_id, requester_user_id, level, decision)
  values (req.id, actor, req.requester_user_id, 'PORTFOLIO', 'APPROVED');
  update public.early_friday_requests
  set status = 'FINAL_APPROVED', current_approval_level = 'COMPLETED', final_decided_at = now()
  where id = req.id;
  insert into public.notifications (user_id, type, title, body, request_id)
  values (req.requester_user_id, 'REQUEST_APPROVED', 'Early Friday aprobado',
    'Su solicitud recibió aprobación final.', req.id);
  return jsonb_build_object('request_id', req.id, 'status', 'FINAL_APPROVED');
end
$$;

create or replace function private.reject_request_impl(
  target_request uuid,
  rejection_reason text,
  rejection_comment text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid(); req public.early_friday_requests%rowtype; rejection_status public.request_status; decision_level public.approval_level;
begin
  if length(trim(rejection_reason)) = 0 or length(trim(rejection_comment)) = 0 then
    raise exception 'El rechazo requiere motivo y comentario' using errcode = 'P0001';
  end if;
  select * into req from public.early_friday_requests where id = target_request for update;
  if req.requester_user_id = actor then raise exception 'No puede decidir su propia solicitud' using errcode = 'P0001'; end if;
  if req.status = 'PENDING_TEAM_LEADER' and private.leads_team(req.team_id, actor) then
    rejection_status := 'REJECTED_BY_TEAM_LEADER'; decision_level := 'TEAM_LEADER';
  elsif req.status = 'PENDING_PORTFOLIO' and private.has_role('PORTFOLIO_MANAGER', actor) then
    rejection_status := 'REJECTED_BY_PORTFOLIO'; decision_level := 'PORTFOLIO';
  else
    raise exception 'No tiene permiso para rechazar esta solicitud' using errcode = 'P0001';
  end if;
  insert into public.request_approvals (request_id, approver_user_id, requester_user_id, level, decision, reason_code, comment)
  values (req.id, actor, req.requester_user_id, decision_level, 'REJECTED', rejection_reason, rejection_comment);
  update public.early_friday_requests set status = rejection_status, current_approval_level = 'COMPLETED', final_decided_at = now() where id = req.id;
  insert into public.notifications (user_id, type, title, body, request_id)
  values (req.requester_user_id, 'REQUEST_REJECTED', 'Solicitud rechazada', rejection_comment, req.id);
  return jsonb_build_object('request_id', req.id, 'status', rejection_status);
end
$$;

create or replace function private.return_for_correction_impl(
  target_request uuid,
  return_reason text,
  return_comment text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid(); req public.early_friday_requests%rowtype; decision_level public.approval_level;
begin
  select * into req from public.early_friday_requests where id = target_request for update;
  if req.requester_user_id = actor then raise exception 'No puede devolver su propia solicitud' using errcode = 'P0001'; end if;
  if req.status = 'PENDING_TEAM_LEADER' and private.leads_team(req.team_id, actor) then decision_level := 'TEAM_LEADER';
  elsif req.status = 'PENDING_PORTFOLIO' and private.has_role('PORTFOLIO_MANAGER', actor) then decision_level := 'PORTFOLIO';
  else raise exception 'No tiene permiso para devolver esta solicitud' using errcode = 'P0001'; end if;
  insert into public.request_approvals (request_id, approver_user_id, requester_user_id, level, decision, reason_code, comment)
  values (req.id, actor, req.requester_user_id, decision_level, 'RETURNED_FOR_CORRECTION', return_reason, return_comment);
  update public.early_friday_requests set status = 'RETURNED_FOR_CORRECTION', current_approval_level = 'NONE' where id = req.id;
  insert into public.notifications (user_id, type, title, body, request_id)
  values (req.requester_user_id, 'REQUEST_RETURNED', 'Solicitud devuelta para corrección', return_comment, req.id);
  return jsonb_build_object('request_id', req.id, 'status', 'RETURNED_FOR_CORRECTION');
end
$$;

create or replace function private.request_cancellation_impl(target_request uuid, target_reason text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid(); req public.early_friday_requests%rowtype;
begin
  select * into req from public.early_friday_requests where id = target_request for update;
  if req.requester_user_id <> actor then raise exception 'Solo puede cancelar solicitudes propias' using errcode = 'P0001'; end if;
  if length(trim(target_reason)) = 0 then raise exception 'Debe indicar el motivo' using errcode = 'P0001'; end if;
  if req.status = 'FINAL_APPROVED' then
    update public.early_friday_requests set status = 'CANCELLATION_REQUESTED', cancellation_reason = target_reason where id = req.id;
  elsif req.status in ('DRAFT', 'PENDING_TEAM_LEADER', 'PENDING_PORTFOLIO', 'RETURNED_FOR_CORRECTION') then
    update public.early_friday_requests set status = 'CANCELLED', cancellation_reason = target_reason where id = req.id;
  else raise exception 'La solicitud no puede cancelarse en su estado actual' using errcode = 'P0001'; end if;
  return jsonb_build_object('request_id', req.id, 'status',
    (select status from public.early_friday_requests where id = req.id));
end
$$;

create or replace function private.approve_cancellation_impl(target_request uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid(); req public.early_friday_requests%rowtype;
begin
  if not private.has_role('PORTFOLIO_MANAGER', actor) then raise exception 'Requiere rol Portfolio Manager' using errcode = 'P0001'; end if;
  select * into req from public.early_friday_requests where id = target_request for update;
  if req.status <> 'CANCELLATION_REQUESTED' then raise exception 'No existe una cancelación pendiente' using errcode = 'P0001'; end if;
  if req.requester_user_id = actor then raise exception 'No puede autorizar su propia cancelación' using errcode = 'P0001'; end if;
  insert into public.request_approvals (request_id, approver_user_id, requester_user_id, level, decision, comment)
  values (req.id, actor, req.requester_user_id, 'PORTFOLIO', 'CANCELLATION_APPROVED', req.cancellation_reason);
  update public.early_friday_requests set status = 'CANCELLED', current_approval_level = 'COMPLETED' where id = req.id;
  return jsonb_build_object('request_id', req.id, 'status', 'CANCELLED');
end
$$;

create or replace function private.confirm_usage_impl(target_request uuid, usage_value public.usage_status, usage_notes text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid(); req public.early_friday_requests%rowtype; new_status public.request_status;
begin
  select * into req from public.early_friday_requests where id = target_request for update;
  if req.status <> 'FINAL_APPROVED' then raise exception 'Solo puede confirmar solicitudes aprobadas finalmente' using errcode = 'P0001'; end if;
  if current_date <= req.requested_date then raise exception 'El uso se confirma después del viernes' using errcode = 'P0001'; end if;
  if actor <> req.requester_user_id and not private.has_role('PORTFOLIO_MANAGER', actor) then
    raise exception 'No tiene permiso para confirmar el uso' using errcode = 'P0001';
  end if;
  new_status := usage_value::text::public.request_status;
  insert into public.rotation_history (request_id, user_id, team_id, benefit_date, usage, confirmed_by, notes)
  values (req.id, req.requester_user_id, req.team_id, req.requested_date, usage_value, actor, usage_notes);
  update public.early_friday_requests set status = new_status, usage_confirmed_at = now() where id = req.id;
  return jsonb_build_object('request_id', req.id, 'status', new_status);
end
$$;

create or replace function private.create_exception_impl(
  target_request uuid,
  target_exception_type uuid,
  target_rule text,
  target_justification text,
  target_evidence_path text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid(); created_id uuid;
begin
  if not private.has_role('PORTFOLIO_MANAGER', actor) then raise exception 'Requiere rol Portfolio Manager' using errcode = 'P0001'; end if;
  insert into public.request_exceptions (
    request_id, exception_type_id, violated_rule, justification, authorized_by, evidence_path
  ) values (
    target_request, target_exception_type, target_rule, target_justification, actor, target_evidence_path
  ) returning id into created_id;
  return jsonb_build_object('exception_id', created_id, 'request_id', target_request);
end
$$;

create or replace function public.get_user_eligibility(target_user uuid, target_date date)
returns jsonb language sql stable security invoker set search_path = ''
as $$ select private.get_user_eligibility_impl(target_user, target_date) $$;
create or replace function public.calculate_rotation_priority(target_user uuid, target_date date)
returns jsonb language sql stable security invoker set search_path = ''
as $$ select private.calculate_rotation_priority_impl(target_user, target_date) $$;
create or replace function public.create_early_friday_request(target_date date, start_time time, end_time time, request_reason text default null)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.create_request_impl(target_date, start_time, end_time, request_reason) $$;
create or replace function public.approve_request_as_team_leader(target_request uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.approve_team_leader_impl(target_request) $$;
create or replace function public.approve_request_as_portfolio(target_request uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.approve_portfolio_impl(target_request) $$;
create or replace function public.reject_request(target_request uuid, rejection_reason text, rejection_comment text)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.reject_request_impl(target_request, rejection_reason, rejection_comment) $$;
create or replace function public.return_request_for_correction(target_request uuid, return_reason text, return_comment text)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.return_for_correction_impl(target_request, return_reason, return_comment) $$;
create or replace function public.request_cancellation(target_request uuid, cancellation_reason text)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.request_cancellation_impl(target_request, cancellation_reason) $$;
create or replace function public.approve_cancellation(target_request uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.approve_cancellation_impl(target_request) $$;
create or replace function public.confirm_early_friday_usage(target_request uuid, usage_value public.usage_status, usage_notes text default null)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.confirm_usage_impl(target_request, usage_value, usage_notes) $$;
create or replace function public.create_request_exception(target_request uuid, target_exception_type uuid, target_rule text, target_justification text, target_evidence_path text default null)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.create_exception_impl(target_request, target_exception_type, target_rule, target_justification, target_evidence_path) $$;

revoke all on all functions in schema private from public, anon;
grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;
revoke execute on all functions in schema public from public, anon;
grant execute on function public.get_user_eligibility(uuid, date) to authenticated;
grant execute on function public.calculate_rotation_priority(uuid, date) to authenticated;
grant execute on function public.create_early_friday_request(date, time, time, text) to authenticated;
grant execute on function public.approve_request_as_team_leader(uuid) to authenticated;
grant execute on function public.approve_request_as_portfolio(uuid) to authenticated;
grant execute on function public.reject_request(uuid, text, text) to authenticated;
grant execute on function public.return_request_for_correction(uuid, text, text) to authenticated;
grant execute on function public.request_cancellation(uuid, text) to authenticated;
grant execute on function public.approve_cancellation(uuid) to authenticated;
grant execute on function public.confirm_early_friday_usage(uuid, public.usage_status, text) to authenticated;
grant execute on function public.create_request_exception(uuid, uuid, text, text, text) to authenticated;
