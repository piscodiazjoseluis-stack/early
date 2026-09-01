begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

select ok(
  (select count(*) = 18 from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity),
  'las 18 tablas públicas tienen RLS habilitado'
);

select ok(
  not has_function_privilege('anon', 'private.has_role(public.app_role, uuid)', 'execute'),
  'anon no ejecuta helpers privados de autorización'
);
select ok(
  has_function_privilege('authenticated', 'private.has_role(public.app_role, uuid)', 'execute'),
  'authenticated puede evaluar el helper requerido por RLS'
);
select ok(
  not has_function_privilege('authenticated', 'private.audit_row_change()', 'execute'),
  'authenticated no invoca directamente el trigger de auditoría'
);
select ok(
  not has_function_privilege('authenticated', 'private.validate_request_transition()', 'execute'),
  'authenticated no invoca directamente validaciones de trigger'
);
select ok(
  has_function_privilege('authenticated', 'public.create_early_friday_departure_request(date, time, text)', 'execute'),
  'authenticated conserva el RPC de creación permitido'
);
select ok(
  has_function_privilege('authenticated', 'public.approve_request_as_team_leader(uuid)', 'execute'),
  'authenticated conserva el RPC de aprobación del jefe'
);
select ok(
  not has_function_privilege('anon', 'public.approve_request_as_team_leader(uuid)', 'execute'),
  'anon no puede ejecutar el RPC de aprobación'
);
select ok(
  has_function_privilege('supabase_auth_admin', 'private.handle_new_auth_user()', 'execute')
  and not has_function_privilege('authenticated', 'private.handle_new_auth_user()', 'execute'),
  'el trigger de alta queda reservado al administrador de Auth'
);

select * from finish();
rollback;
