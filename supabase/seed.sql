-- Reference seed for local resets. Static catalogs are also inserted by the
-- Stage 2 migration so cloud and local environments share the same baseline.

insert into public.roles (code, display_name, description) values
  ('COLLABORATOR', 'Colaborador', 'Solicita y consulta sus Early Fridays.'),
  ('TEAM_LEADER', 'Jefe directo', 'Gestiona solicitudes y analítica de sus equipos.'),
  ('PORTFOLIO_MANAGER', 'Portfolio Manager', 'Realiza aprobación final y consulta alcance global.'),
  ('ADMIN', 'Administrador', 'Administra configuración sin obtener permisos de aprobación.')
on conflict (code) do nothing;

insert into public.teams (code, name, description) values
  ('TEAM_ELENA_CHIPANA', 'Team Elena Chipana', 'Equipo dirigido inicialmente por Elena Chipana.'),
  ('TEAM_CAROL_FLORES', 'Team Carol Flores', 'Equipo dirigido inicialmente por Carol Flores Espinoza.'),
  ('TEAM_HUGO_RAMIREZ', 'Team Hugo Ramirez', 'Equipo dirigido inicialmente por Hugo Ramirez.')
on conflict (code) do nothing;

insert into public.exception_types (code, name, description, requires_evidence) values
  ('ROTATION_OVERRIDE', 'Excepción de rotación', 'Autoriza una desviación justificada de la rotación equitativa.', false),
  ('BLOCKED_DATE_OVERRIDE', 'Excepción de fecha bloqueada', 'Autoriza excepcionalmente una fecha normalmente bloqueada.', true),
  ('TEAM_CAPACITY_OVERRIDE', 'Excepción de cupo de equipo', 'Documenta una decisión excepcional sobre el cupo semanal.', true),
  ('ELIGIBILITY_OVERRIDE', 'Excepción de elegibilidad', 'Autoriza una excepción temporal de elegibilidad.', true)
on conflict (code) do nothing;

-- No se crean usuarios ni contraseñas. Los perfiles se vincularán a auth.users
-- durante la Etapa 3 y después se asignarán roles, jefaturas y membresías.
