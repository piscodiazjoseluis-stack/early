-- Release gate: apply to production only after explicit migration approval.
-- No historical request, decision, credential or confirmation is rewritten.
-- An expired/missing confirmation is NOT proof that the benefit was unused.

create or replace function private.consecutive_friday_blocker(
  target_user uuid, target_date date, excluded_request uuid default null
)
returns date
language sql
volatile
security definer
set search_path = ''
as $$
  select r.requested_date
  from public.early_friday_requests r
  where r.requester_user_id = target_user
    and r.requested_date in (target_date - 7, target_date + 7)
    and (excluded_request is null or r.id <> excluded_request)
    and r.status not in ('DRAFT', 'REJECTED_BY_TEAM_LEADER', 'REJECTED_BY_PORTFOLIO', 'CANCELLED')
    and not (
      r.status = 'NOT_USED' and r.usage_confirmed_at is not null
      and exists (
        select 1 from public.rotation_history rh
        where rh.request_id = r.id and rh.user_id = r.requester_user_id
          and rh.team_id = r.team_id and rh.benefit_date = r.requested_date
          and rh.usage = 'NOT_USED'
          and rh.confirmed_at >= ((r.requested_date + r.requested_end_time) at time zone 'America/Bogota')
          and rh.confirmed_at <= now()
      )
    )
  order by r.requested_date
  limit 1
$$;

-- Keep the established eligibility checks and public two-argument API intact.
-- The extra internal argument lets a returned request move dates without
-- incorrectly treating its OWN previous date as a competing reservation.
create or replace function private.get_user_eligibility_for_request_impl(
  target_user uuid, target_date date, excluded_request uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  membership public.team_members%rowtype;
  blocked_by_date date;
begin
  if auth.uid() is null then
    raise exception 'Debe iniciar sesión' using errcode = 'P0001';
  end if;
  if target_date is null or extract(isodow from target_date) <> 5 then
    return jsonb_build_object('eligible', false, 'reason', 'La fecha no es viernes',
      'reasons', jsonb_build_array('La fecha no es viernes'));
  end if;
  select * into membership from public.team_members tm
  where tm.user_id = target_user and tm.valid_from <= target_date
    and (tm.valid_until is null or tm.valid_until >= target_date)
  order by tm.valid_from desc limit 1;
  if membership.id is null or not membership.is_eligible or not membership.participates_in_rotation then
    return jsonb_build_object('eligible', false, 'reason', 'Membresía no elegible',
      'reasons', jsonb_build_array('Membresía no elegible'));
  end if;
  if exists (select 1 from public.rotation_history rh where rh.user_id = target_user
    and rh.usage = 'USED' and rh.benefit_date in (target_date - 7, target_date + 7)
    and (excluded_request is null or rh.request_id <> excluded_request)) then
    return jsonb_build_object('eligible', false, 'team_id', membership.team_id,
      'reason', 'El beneficio fue utilizado en un viernes consecutivo',
      'reasons', jsonb_build_array('No puedes reservar viernes consecutivos: existe un uso confirmado.'));
  end if;
  blocked_by_date := private.consecutive_friday_blocker(target_user, target_date, excluded_request);
  if blocked_by_date is not null then
    return jsonb_build_object('eligible', false, 'team_id', membership.team_id,
      'blocking_date', blocked_by_date,
      'reason', format('No puedes reservar viernes consecutivos: existe una solicitud para el %s.', blocked_by_date),
      'reasons', jsonb_build_array(format(
        'No puedes reservar viernes consecutivos: existe una solicitud para el %s. El bloqueo se libera con rechazo, cancelación válida o confirmación registrada de No utilizado después del horario aprobado.', blocked_by_date)));
  end if;
  if exists (select 1 from public.availability_periods ap where ap.user_id = target_user
    and target_date between ap.starts_on and ap.ends_on and ap.deleted_at is null) then
    return jsonb_build_object('eligible', false, 'reason', 'Usuario no disponible',
      'reasons', jsonb_build_array('Usuario no disponible'));
  end if;
  if exists (select 1 from public.blocked_dates bd where bd.blocked_date = target_date and bd.deleted_at is null) then
    return jsonb_build_object('eligible', false, 'reason', 'Fecha bloqueada',
      'reasons', jsonb_build_array('Fecha bloqueada'));
  end if;
  return jsonb_build_object('eligible', true, 'team_id', membership.team_id,
    'reason', 'Elegible', 'reasons', jsonb_build_array());
end
$$;

create or replace function private.get_user_eligibility_impl(target_user uuid, target_date date)
returns jsonb language sql volatile security definer set search_path = ''
as $$ select private.get_user_eligibility_for_request_impl(target_user, target_date, null) $$;

-- Every insertion / reactivation / approval takes one user-wide transaction
-- lock. A fresh VOLATILE query AFTER obtaining it sees the committed winner.
-- This is also enforced below the RPCs, not only by frontend preflight.
create or replace function private.guard_consecutive_friday_reservation()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  blocked_by_date date;
begin
  if new.status in ('DRAFT', 'REJECTED_BY_TEAM_LEADER', 'REJECTED_BY_PORTFOLIO', 'CANCELLED') then
    return new;
  end if;
  -- Closing an actual previous benefit must never be prevented by a later
  -- legacy reservation. The later request is revalidated at approval.
  if tg_op = 'UPDATE' then
    if old.requester_user_id = new.requester_user_id and old.requested_date = new.requested_date
      and (old.status = new.status or (old.status = 'FINAL_APPROVED' and new.status in ('USED', 'NOT_USED', 'CANCELLATION_REQUESTED'))) then
      return new;
    end if;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('early-reservation:' || new.requester_user_id::text, 0));
  blocked_by_date := private.consecutive_friday_blocker(new.requester_user_id, new.requested_date, new.id);
  if blocked_by_date is not null or exists (
    select 1 from public.rotation_history rh where rh.user_id = new.requester_user_id
      and rh.usage = 'USED' and rh.benefit_date in (new.requested_date - 7, new.requested_date + 7)
      and rh.request_id <> new.id
  ) then
    raise exception 'No puedes reservar viernes consecutivos: existe una solicitud o un uso confirmado en una fecha contigua.' using errcode = 'P0001';
  end if;
  return new;
end
$$;

create trigger requests_guard_consecutive_reservations
before insert or update of requester_user_id, requested_date, status
on public.early_friday_requests
for each row execute function private.guard_consecutive_friday_reservation();

do $patch$
declare
  definition text := pg_get_functiondef('private.resubmit_returned_request_impl(uuid,date,time without time zone,time without time zone,text)'::regprocedure);
  anchor text := 'private.get_user_eligibility_impl(actor, target_date)';
begin
  if position(anchor in definition) = 0 then
    raise exception 'Unexpected resubmission implementation: review before applying';
  end if;
  execute replace(definition, anchor, 'private.get_user_eligibility_for_request_impl(actor, target_date, req.id)');
end
$patch$;

-- The existing form already consumes server eligibility/all_ready. Show the
-- actual blocking reason instead of a generic rotation failure.
do $patch$
declare
  definition text := pg_get_functiondef('private.get_request_form_context_impl(date,time without time zone)'::regprocedure);
  anchor text := 'else ''No cumples las reglas de elegibilidad o rotación para esta fecha.'' end';
begin
  if position(anchor in definition) = 0 then
    raise exception 'Unexpected form context implementation: review before applying';
  end if;
  execute replace(definition, anchor,
    'else coalesce(eligibility ->> ''reason'', ''No cumples las reglas de elegibilidad o rotación para esta fecha.'') end');
end
$patch$;

revoke all on function private.consecutive_friday_blocker(uuid,date,uuid) from public, anon, authenticated;
revoke all on function private.get_user_eligibility_for_request_impl(uuid,date,uuid) from public, anon, authenticated;
revoke all on function private.guard_consecutive_friday_reservation() from public, anon, authenticated;
revoke all on function private.get_user_eligibility_impl(uuid,date) from public, anon;
grant execute on function private.get_user_eligibility_impl(uuid,date) to authenticated;
