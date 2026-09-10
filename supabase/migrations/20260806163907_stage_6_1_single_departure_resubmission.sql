create or replace function public.resubmit_returned_departure_request(
  target_request uuid,
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
  selected_period public.early_friday_periods%rowtype;
begin
  select * into selected_period
  from public.early_friday_periods p
  where p.is_active and target_date between p.starts_on and p.ends_on
  order by p.starts_on desc
  limit 1;

  if selected_period.id is null then
    raise exception 'No existe un periodo activo para esa fecha' using errcode = 'P0001';
  end if;
  if departure_time < selected_period.default_start_time
    or departure_time >= selected_period.default_end_time then
    raise exception 'La hora propuesta debe estar dentro del horario permitido' using errcode = 'P0001';
  end if;

  return private.resubmit_returned_request_impl(
    target_request,
    target_date,
    departure_time,
    selected_period.default_end_time,
    request_reason
  );
end
$$;

revoke execute on function public.resubmit_returned_departure_request(uuid, date, time, text)
  from public, anon;
grant execute on function public.resubmit_returned_departure_request(uuid, date, time, text)
  to authenticated;
