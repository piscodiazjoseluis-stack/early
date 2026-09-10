-- Escenarios controlados para UAT y demostración de portfolio.
-- En producción este bloque es NO-OP. Solo se activa expresamente en una sesión
-- de validación mediante: set app.enable_uat_seed = 'on';
do $$
declare
  period_id uuid;
  portfolio_id uuid;
  carol_id uuid;
  elena_id uuid;
  carol_team_id uuid;
  elena_team_id uuid;
  gabriela_id uuid;
  leonardo_id uuid;
  annie_id uuid;
  yanira_id uuid;
  miguel_id uuid;
begin
  if coalesce(current_setting('app.enable_uat_seed', true), 'off') <> 'on' then
    raise notice 'UAT cross-team seed omitido; app.enable_uat_seed no está activo';
    return;
  end if;

  select id into period_id
  from public.early_friday_periods
  where is_active and date '2026-08-14' between starts_on and ends_on
  order by starts_on desc
  limit 1;

  select id into portfolio_id from public.profiles where full_name = 'Maria Luisa Temoche';
  select id into carol_id from public.profiles where full_name = 'Carol Flores Espinoza';
  select id into elena_id from public.profiles where full_name = 'Elena Chipana';
  select id into gabriela_id from public.profiles where full_name = 'Gabriela Lopez';
  select id into leonardo_id from public.profiles where full_name = 'Leonardo Navarrete';
  select id into annie_id from public.profiles where full_name = 'Annie Huamani';
  select id into yanira_id from public.profiles where full_name = 'Yanira Palomino';
  select id into miguel_id from public.profiles where full_name = 'Miguel Atencio';
  select id into carol_team_id from public.teams where name = 'Team Carol Flores';
  select id into elena_team_id from public.teams where name = 'Team Elena Chipana';

  if period_id is null or portfolio_id is null or carol_id is null or elena_id is null
    or carol_team_id is null or elena_team_id is null or gabriela_id is null
    or leonardo_id is null or annie_id is null or yanira_id is null or miguel_id is null then
    raise exception 'No se encontraron todos los perfiles, equipos o periodo requeridos para los escenarios UAT';
  end if;

  insert into public.early_friday_requests (
    id, requester_user_id, team_id, period_id, requested_date,
    requested_start_time, requested_end_time, reason, status,
    current_approval_level, rotation_priority, priority_explanation,
    submitted_at, final_decided_at, created_at, updated_at
  ) values
    ('c1000000-0000-4000-8000-000000000001', gabriela_id, carol_team_id, period_id,
      date '2026-08-14', time '13:30', time '15:00',
      'Escenario UAT: desarrollo profesional planificado.', 'FINAL_APPROVED', 'COMPLETED', 78,
      '{"source":"uat_cross_team","summary":"Elegible y sin conflictos del equipo"}'::jsonb,
      timestamptz '2026-08-12 09:10:00-05', timestamptz '2026-08-12 11:20:00-05',
      timestamptz '2026-08-12 09:10:00-05', timestamptz '2026-08-12 11:20:00-05'),
    ('c1000000-0000-4000-8000-000000000002', leonardo_id, carol_team_id, period_id,
      date '2026-08-21', time '13:30', time '15:00',
      'Escenario UAT: trámite personal planificado.', 'PENDING_PORTFOLIO', 'PORTFOLIO', 66,
      '{"source":"uat_cross_team","summary":"Aprobada por el jefe; pendiente de Portfolio"}'::jsonb,
      timestamptz '2026-08-12 09:35:00-05', null,
      timestamptz '2026-08-12 09:35:00-05', timestamptz '2026-08-12 10:05:00-05'),
    ('c1000000-0000-4000-8000-000000000003', annie_id, carol_team_id, period_id,
      date '2026-08-28', time '14:00', time '15:00',
      'Escenario UAT: actividad personal coordinada.', 'PENDING_TEAM_LEADER', 'TEAM_LEADER', 58,
      '{"source":"uat_cross_team","summary":"Pendiente de revisión del jefe directo"}'::jsonb,
      timestamptz '2026-08-12 10:10:00-05', null,
      timestamptz '2026-08-12 10:10:00-05', timestamptz '2026-08-12 10:10:00-05'),
    ('c1000000-0000-4000-8000-000000000004', yanira_id, carol_team_id, period_id,
      date '2026-09-04', time '13:30', time '15:00',
      'Escenario UAT: solicitud fuera de la cobertura operativa prevista.',
      'REJECTED_BY_TEAM_LEADER', 'COMPLETED', 52,
      '{"source":"uat_cross_team","summary":"Rechazada por cobertura operativa"}'::jsonb,
      timestamptz '2026-08-12 10:30:00-05', timestamptz '2026-08-12 10:55:00-05',
      timestamptz '2026-08-12 10:30:00-05', timestamptz '2026-08-12 10:55:00-05'),
    ('c1000000-0000-4000-8000-000000000005', carol_id, carol_team_id, period_id,
      date '2026-09-11', time '13:30', time '15:00',
      'Escenario UAT: solicitud personal de la jefa directa.',
      'PENDING_PORTFOLIO', 'PORTFOLIO', 70,
      '{"source":"uat_cross_team","summary":"La jefa solicita directamente a Portfolio"}'::jsonb,
      timestamptz '2026-08-12 11:05:00-05', null,
      timestamptz '2026-08-12 11:05:00-05', timestamptz '2026-08-12 11:05:00-05'),
    ('e1000000-0000-4000-8000-000000000001', miguel_id, elena_team_id, period_id,
      date '2026-08-14', time '13:30', time '15:00',
      'Escenario UAT: gestión académica planificada.', 'FINAL_APPROVED', 'COMPLETED', 82,
      '{"source":"uat_cross_team","summary":"Elegible y aprobado por ambos niveles"}'::jsonb,
      timestamptz '2026-08-12 08:50:00-05', timestamptz '2026-08-12 11:25:00-05',
      timestamptz '2026-08-12 08:50:00-05', timestamptz '2026-08-12 11:25:00-05'),
    ('e1000000-0000-4000-8000-000000000002', elena_id, elena_team_id, period_id,
      date '2026-08-21', time '14:00', time '15:00',
      'Escenario UAT: solicitud personal de la jefa directa.',
      'PENDING_PORTFOLIO', 'PORTFOLIO', 74,
      '{"source":"uat_cross_team","summary":"La jefa solicita directamente a Portfolio"}'::jsonb,
      timestamptz '2026-08-12 11:15:00-05', null,
      timestamptz '2026-08-12 11:15:00-05', timestamptz '2026-08-12 11:15:00-05'),
    ('e1000000-0000-4000-8000-000000000003', miguel_id, elena_team_id, period_id,
      date '2026-08-28', time '13:30', time '15:00',
      'Escenario UAT: solicitud incompatible con la cobertura operativa.',
      'REJECTED_BY_TEAM_LEADER', 'COMPLETED', 48,
      '{"source":"uat_cross_team","summary":"Rechazada por cobertura operativa"}'::jsonb,
      timestamptz '2026-08-12 11:30:00-05', timestamptz '2026-08-12 11:50:00-05',
      timestamptz '2026-08-12 11:30:00-05', timestamptz '2026-08-12 11:50:00-05')
  on conflict (id) do nothing;

  insert into public.request_approvals (
    id, request_id, approver_user_id, requester_user_id, level, decision,
    reason_code, comment, decided_at, metadata
  ) values
    ('a1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', carol_id, gabriela_id,
      'TEAM_LEADER', 'APPROVED', null, 'Cobertura del equipo confirmada.', timestamptz '2026-08-12 10:00:00-05', '{"source":"uat_cross_team"}'),
    ('a1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', portfolio_id, gabriela_id,
      'PORTFOLIO', 'APPROVED', null, 'Reglas y rotación validadas.', timestamptz '2026-08-12 11:20:00-05', '{"source":"uat_cross_team"}'),
    ('a1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000002', carol_id, leonardo_id,
      'TEAM_LEADER', 'APPROVED', null, 'Cobertura del equipo confirmada.', timestamptz '2026-08-12 10:05:00-05', '{"source":"uat_cross_team"}'),
    ('a1000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000004', carol_id, yanira_id,
      'TEAM_LEADER', 'REJECTED', 'COVERAGE', 'La fecha no mantiene la cobertura operativa mínima del equipo.', timestamptz '2026-08-12 10:55:00-05', '{"source":"uat_cross_team"}'),
    ('a1000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000001', elena_id, miguel_id,
      'TEAM_LEADER', 'APPROVED', null, 'Cobertura del equipo confirmada.', timestamptz '2026-08-12 10:10:00-05', '{"source":"uat_cross_team"}'),
    ('a1000000-0000-4000-8000-000000000006', 'e1000000-0000-4000-8000-000000000001', portfolio_id, miguel_id,
      'PORTFOLIO', 'APPROVED', null, 'Reglas y rotación validadas.', timestamptz '2026-08-12 11:25:00-05', '{"source":"uat_cross_team"}'),
    ('a1000000-0000-4000-8000-000000000007', 'e1000000-0000-4000-8000-000000000003', elena_id, miguel_id,
      'TEAM_LEADER', 'REJECTED', 'COVERAGE', 'La fecha no mantiene la cobertura operativa mínima del equipo.', timestamptz '2026-08-12 11:50:00-05', '{"source":"uat_cross_team"}')
  on conflict (id) do nothing;

  insert into public.notifications (id, user_id, type, title, body, request_id, created_at) values
    ('d1000000-0000-4000-8000-000000000001', gabriela_id, 'REQUEST_APPROVED', 'Early Friday aprobado', 'Tu solicitud UAT recibió aprobación final.', 'c1000000-0000-4000-8000-000000000001', timestamptz '2026-08-12 11:20:00-05'),
    ('d1000000-0000-4000-8000-000000000002', portfolio_id, 'APPROVAL_REQUIRED', 'Solicitud pendiente de aprobación final', 'Leonardo Navarrete requiere una decisión final.', 'c1000000-0000-4000-8000-000000000002', timestamptz '2026-08-12 10:05:00-05'),
    ('d1000000-0000-4000-8000-000000000003', carol_id, 'APPROVAL_REQUIRED', 'Solicitud pendiente del equipo', 'Annie Huamani requiere revisión del jefe directo.', 'c1000000-0000-4000-8000-000000000003', timestamptz '2026-08-12 10:10:00-05'),
    ('d1000000-0000-4000-8000-000000000004', yanira_id, 'REQUEST_REJECTED', 'Solicitud rechazada', 'No existe cobertura operativa suficiente para la fecha solicitada.', 'c1000000-0000-4000-8000-000000000004', timestamptz '2026-08-12 10:55:00-05'),
    ('d1000000-0000-4000-8000-000000000005', portfolio_id, 'APPROVAL_REQUIRED', 'Solicitud de jefa directa', 'Carol Flores Espinoza requiere una decisión final.', 'c1000000-0000-4000-8000-000000000005', timestamptz '2026-08-12 11:05:00-05'),
    ('d1000000-0000-4000-8000-000000000006', miguel_id, 'REQUEST_APPROVED', 'Early Friday aprobado', 'Tu solicitud UAT recibió aprobación final.', 'e1000000-0000-4000-8000-000000000001', timestamptz '2026-08-12 11:25:00-05'),
    ('d1000000-0000-4000-8000-000000000007', portfolio_id, 'APPROVAL_REQUIRED', 'Solicitud de jefa directa', 'Elena Chipana requiere una decisión final.', 'e1000000-0000-4000-8000-000000000002', timestamptz '2026-08-12 11:15:00-05'),
    ('d1000000-0000-4000-8000-000000000008', miguel_id, 'REQUEST_REJECTED', 'Solicitud rechazada', 'No existe cobertura operativa suficiente para la fecha solicitada.', 'e1000000-0000-4000-8000-000000000003', timestamptz '2026-08-12 11:50:00-05')
  on conflict (id) do nothing;
end
$$;
