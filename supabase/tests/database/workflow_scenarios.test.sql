begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

set local role authenticated;
create temporary table uat_requests (
  label text primary key,
  request_id uuid not null
) on commit drop;
create temporary table uat_flags (
  label text primary key,
  passed boolean not null default false
) on commit drop;

-- Escenario 1: solicitud nueva pendiente del jefe.
select set_config('request.jwt.claims', '{"sub":"55775321-3c95-4a17-82a6-369b60c4f374","role":"authenticated"}', true);
insert into uat_requests
select 's1', (public.create_early_friday_departure_request('2026-11-06', '14:00', 'UAT escenario 1')->>'request_id')::uuid;
select is((select status::text from public.early_friday_requests where id = (select request_id from uat_requests where label = 's1')), 'PENDING_TEAM_LEADER', '1. Nueva solicitud queda pendiente del jefe');

-- Escenario 2: aprobación del jefe y espera de Portfolio.
select set_config('request.jwt.claims', '{"sub":"55775321-3c95-4a17-82a6-369b60c4f374","role":"authenticated"}', true);
insert into uat_requests
select 's2', (public.create_early_friday_departure_request('2026-11-13', '14:00', 'UAT escenario 2')->>'request_id')::uuid;
select set_config('request.jwt.claims', '{"sub":"69adc5b0-bc79-4141-ab34-19d495860513","role":"authenticated"}', true);
select public.approve_request_as_team_leader((select request_id from uat_requests where label = 's2'));
select is((select status::text from public.early_friday_requests where id = (select request_id from uat_requests where label = 's2')), 'PENDING_PORTFOLIO', '2. Aprobación del jefe avanza a Portfolio');

-- Escenario 3: aprobación final de Portfolio.
select set_config('request.jwt.claims', '{"sub":"55775321-3c95-4a17-82a6-369b60c4f374","role":"authenticated"}', true);
insert into uat_requests
select 's3', (public.create_early_friday_departure_request('2026-11-20', '14:00', 'UAT escenario 3')->>'request_id')::uuid;
select set_config('request.jwt.claims', '{"sub":"69adc5b0-bc79-4141-ab34-19d495860513","role":"authenticated"}', true);
select public.approve_request_as_team_leader((select request_id from uat_requests where label = 's3'));
select set_config('request.jwt.claims', '{"sub":"0ca64fdb-68a8-465b-97a2-554a9c06ecf5","role":"authenticated"}', true);
select public.approve_request_as_portfolio((select request_id from uat_requests where label = 's3'));
select is((select status::text from public.early_friday_requests where id = (select request_id from uat_requests where label = 's3')), 'FINAL_APPROVED', '3. Portfolio completa la aprobación final');

-- Escenario 4: rechazo del jefe termina el flujo.
select set_config('request.jwt.claims', '{"sub":"55775321-3c95-4a17-82a6-369b60c4f374","role":"authenticated"}', true);
insert into uat_requests
select 's4', (public.create_early_friday_departure_request('2026-11-27', '14:00', 'UAT escenario 4')->>'request_id')::uuid;
select set_config('request.jwt.claims', '{"sub":"69adc5b0-bc79-4141-ab34-19d495860513","role":"authenticated"}', true);
select public.reject_request((select request_id from uat_requests where label = 's4'), 'UAT_REJECT', 'Rechazo controlado por el jefe');
select is((select status::text from public.early_friday_requests where id = (select request_id from uat_requests where label = 's4')), 'REJECTED_BY_TEAM_LEADER', '4. Rechazo del jefe cierra antes de Portfolio');

-- Escenario 5: rechazo de Portfolio después de aprobar el jefe.
select set_config('request.jwt.claims', '{"sub":"55775321-3c95-4a17-82a6-369b60c4f374","role":"authenticated"}', true);
insert into uat_requests
select 's5', (public.create_early_friday_departure_request('2026-12-04', '14:00', 'UAT escenario 5')->>'request_id')::uuid;
select set_config('request.jwt.claims', '{"sub":"69adc5b0-bc79-4141-ab34-19d495860513","role":"authenticated"}', true);
select public.approve_request_as_team_leader((select request_id from uat_requests where label = 's5'));
select set_config('request.jwt.claims', '{"sub":"0ca64fdb-68a8-465b-97a2-554a9c06ecf5","role":"authenticated"}', true);
select public.reject_request((select request_id from uat_requests where label = 's5'), 'UAT_REJECT', 'Rechazo controlado por Portfolio');
select is((select status::text from public.early_friday_requests where id = (select request_id from uat_requests where label = 's5')), 'REJECTED_BY_PORTFOLIO', '5. Portfolio puede rechazar una solicitud aprobada por el jefe');

-- Escenario 6: un rechazo previo no impide una nueva aprobación para la misma fecha.
select set_config('request.jwt.claims', '{"sub":"55775321-3c95-4a17-82a6-369b60c4f374","role":"authenticated"}', true);
insert into uat_requests
select 's6_old', (public.create_early_friday_departure_request('2026-12-11', '14:00', 'UAT escenario 6 anterior')->>'request_id')::uuid;
select set_config('request.jwt.claims', '{"sub":"69adc5b0-bc79-4141-ab34-19d495860513","role":"authenticated"}', true);
select public.reject_request((select request_id from uat_requests where label = 's6_old'), 'UAT_REJECT', 'Intento anterior rechazado');
select set_config('request.jwt.claims', '{"sub":"55775321-3c95-4a17-82a6-369b60c4f374","role":"authenticated"}', true);
insert into uat_requests
select 's6_new', (public.create_early_friday_departure_request('2026-12-11', '14:00', 'UAT escenario 6 vigente')->>'request_id')::uuid;
select set_config('request.jwt.claims', '{"sub":"69adc5b0-bc79-4141-ab34-19d495860513","role":"authenticated"}', true);
select public.approve_request_as_team_leader((select request_id from uat_requests where label = 's6_new'));
select set_config('request.jwt.claims', '{"sub":"0ca64fdb-68a8-465b-97a2-554a9c06ecf5","role":"authenticated"}', true);
select public.approve_request_as_portfolio((select request_id from uat_requests where label = 's6_new'));
select ok((select bool_and(status = expected::public.request_status) from (values ((select status from public.early_friday_requests where id = (select request_id from uat_requests where label = 's6_old')), 'REJECTED_BY_TEAM_LEADER'), ((select status from public.early_friday_requests where id = (select request_id from uat_requests where label = 's6_new')), 'FINAL_APPROVED')) as checks(status, expected)), '6. La solicitud más reciente puede aprobarse sin borrar el rechazo histórico');

-- Escenario 7: personas de equipos distintos pueden obtener el mismo viernes.
select set_config('request.jwt.claims', '{"sub":"55775321-3c95-4a17-82a6-369b60c4f374","role":"authenticated"}', true);
insert into uat_requests select 's7_hugo', (public.create_early_friday_departure_request('2026-12-18', '14:00', 'UAT equipo Hugo')->>'request_id')::uuid;
select set_config('request.jwt.claims', '{"sub":"13135fef-3bc8-4dbe-9b34-303439d0bf81","role":"authenticated"}', true);
insert into uat_requests select 's7_carol', (public.create_early_friday_departure_request('2026-12-18', '14:00', 'UAT equipo Carol')->>'request_id')::uuid;
select set_config('request.jwt.claims', '{"sub":"69adc5b0-bc79-4141-ab34-19d495860513","role":"authenticated"}', true);
select public.approve_request_as_team_leader((select request_id from uat_requests where label = 's7_hugo'));
select set_config('request.jwt.claims', '{"sub":"9e22a463-951c-464f-a1a8-088fd37391e1","role":"authenticated"}', true);
select public.approve_request_as_team_leader((select request_id from uat_requests where label = 's7_carol'));
select set_config('request.jwt.claims', '{"sub":"0ca64fdb-68a8-465b-97a2-554a9c06ecf5","role":"authenticated"}', true);
select public.approve_request_as_portfolio((select request_id from uat_requests where label = 's7_hugo'));
select public.approve_request_as_portfolio((select request_id from uat_requests where label = 's7_carol'));
select is((select count(*)::integer from public.early_friday_requests where id in (select request_id from uat_requests where label like 's7_%') and status = 'FINAL_APPROVED'), 2, '7. Equipos distintos pueden compartir fecha');

-- Escenario 8: dos personas del mismo equipo no pueden quedar aprobadas para la misma fecha.
select set_config('request.jwt.claims', '{"sub":"55775321-3c95-4a17-82a6-369b60c4f374","role":"authenticated"}', true);
insert into uat_requests select 's8_jose', (public.create_early_friday_departure_request('2026-11-27', '13:30', 'UAT cupo Jose')->>'request_id')::uuid;
select set_config('request.jwt.claims', '{"sub":"c5ea570a-55d2-4ce3-b180-22a82b725824","role":"authenticated"}', true);
insert into uat_requests select 's8_valeria', (public.create_early_friday_departure_request('2026-11-27', '14:00', 'UAT cupo Valeria')->>'request_id')::uuid;
select set_config('request.jwt.claims', '{"sub":"69adc5b0-bc79-4141-ab34-19d495860513","role":"authenticated"}', true);
select public.approve_request_as_team_leader((select request_id from uat_requests where label = 's8_jose'));
select public.approve_request_as_team_leader((select request_id from uat_requests where label = 's8_valeria'));
select set_config('request.jwt.claims', '{"sub":"0ca64fdb-68a8-465b-97a2-554a9c06ecf5","role":"authenticated"}', true);
select public.approve_request_as_portfolio((select request_id from uat_requests where label = 's8_jose'));
insert into uat_flags(label) values ('same_team_conflict');
do $$
begin
  perform public.approve_request_as_portfolio((select request_id from uat_requests where label = 's8_valeria'));
exception when others then
  update uat_flags set passed = true where label = 'same_team_conflict';
end
$$;
select ok((select passed from uat_flags where label = 'same_team_conflict'), '8. Se bloquea el segundo cupo final del mismo equipo y fecha');

-- Escenario 9: se preservan varios intentos históricos de una persona y el último puede quedar vigente.
select set_config('request.jwt.claims', '{"sub":"55775321-3c95-4a17-82a6-369b60c4f374","role":"authenticated"}', true);
insert into uat_requests select 's9_old_1', (public.create_early_friday_departure_request('2026-12-04', '13:30', 'UAT histórico 1')->>'request_id')::uuid;
select set_config('request.jwt.claims', '{"sub":"69adc5b0-bc79-4141-ab34-19d495860513","role":"authenticated"}', true);
select public.reject_request((select request_id from uat_requests where label = 's9_old_1'), 'UAT_REJECT', 'Histórico uno');
select set_config('request.jwt.claims', '{"sub":"55775321-3c95-4a17-82a6-369b60c4f374","role":"authenticated"}', true);
insert into uat_requests select 's9_old_2', (public.create_early_friday_departure_request('2026-12-04', '13:45', 'UAT histórico 2')->>'request_id')::uuid;
select set_config('request.jwt.claims', '{"sub":"69adc5b0-bc79-4141-ab34-19d495860513","role":"authenticated"}', true);
select public.reject_request((select request_id from uat_requests where label = 's9_old_2'), 'UAT_REJECT', 'Histórico dos');
select set_config('request.jwt.claims', '{"sub":"55775321-3c95-4a17-82a6-369b60c4f374","role":"authenticated"}', true);
insert into uat_requests select 's9_current', (public.create_early_friday_departure_request('2026-12-04', '14:00', 'UAT histórico vigente')->>'request_id')::uuid;
select set_config('request.jwt.claims', '{"sub":"69adc5b0-bc79-4141-ab34-19d495860513","role":"authenticated"}', true);
select public.approve_request_as_team_leader((select request_id from uat_requests where label = 's9_current'));
select set_config('request.jwt.claims', '{"sub":"0ca64fdb-68a8-465b-97a2-554a9c06ecf5","role":"authenticated"}', true);
select public.approve_request_as_portfolio((select request_id from uat_requests where label = 's9_current'));
select ok((select count(*) = 4 and count(*) filter (where status = 'FINAL_APPROVED') = 1 from public.early_friday_requests where requester_user_id = '55775321-3c95-4a17-82a6-369b60c4f374' and requested_date = '2026-12-04' and id in (select request_id from uat_requests where label in ('s5', 's9_old_1', 's9_old_2', 's9_current'))), '9. El histórico conserva cuatro intentos y uno queda vigente');

select * from finish();
rollback;
