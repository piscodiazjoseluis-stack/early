# Etapa 2 — Base de datos

## Objetivo

Construir en el proyecto Supabase `Early` el modelo transaccional, las reglas
críticas, la seguridad por filas, la auditoría, los catálogos iniciales y las
vistas que necesitarán los módulos posteriores.

El proyecto `AniSuba` no fue modificado.

## Migraciones

1. `20260729223507_stage_2_core_schema.sql`: enums, tablas, relaciones,
   restricciones e índices principales.
2. `20260729223516_stage_2_business_logic.sql`: validaciones, auditoría,
   transiciones y funciones transaccionales.
3. `20260729223519_stage_2_rls_analytics_seed.sql`: RLS, políticas, vistas y
   catálogos iniciales.
4. `20260729224333_stage_2_advisor_fixes.sql`: `search_path`, índices de claves
   foráneas y optimización de políticas.
5. `20260729224444_stage_2_least_privilege_grants.sql`: permisos mínimos para
   `anon` y `authenticated`.

## Modelo

Se crearon 18 tablas:

- Identidad y acceso: `profiles`, `roles`, `user_roles`.
- Organización: `teams`, `team_members`.
- Operación: `early_friday_periods`, `early_friday_requests`,
  `request_approvals`, `rotation_history`, `availability_periods`,
  `blocked_dates`.
- Excepciones y comunicación: `exception_types`, `request_exceptions`,
  `notifications`.
- Gobierno: `audit_logs`, `system_settings`.
- IA: `ai_recommendations`, `ai_feedback`.

`profiles.id` referencia `auth.users.id`; no se almacenan contraseñas.

## Reglas protegidas en PostgreSQL

- Solo se aceptan viernes.
- Una solicitud activa por persona y viernes.
- Una aprobación final por equipo y viernes.
- No existe autoaprobación.
- Los rechazos requieren motivo y comentario.
- Las decisiones registradas son inmutables.
- Las transiciones ilegales de estado son rechazadas.
- El equipo de la solicitud se conserva como fotografía histórica.
- Las fechas bloqueadas, periodos y membresías se validan en base de datos.
- Solo `USED` alimenta positivamente la rotación.

## Funciones RPC

- `create_early_friday_request`
- `approve_request_as_team_leader`
- `approve_request_as_portfolio`
- `reject_request`
- `return_request_for_correction`
- `request_cancellation`
- `approve_cancellation`
- `confirm_early_friday_usage`
- `calculate_rotation_priority`
- `get_user_eligibility`
- `create_request_exception`

Las operaciones críticas no se realizan con `update` directo desde el
frontend. Las funciones identifican al usuario con `auth.uid()`, bloquean la
fila durante decisiones y producen auditoría/notificaciones.

## Seguridad

- RLS está habilitado en las 18 tablas.
- Se crearon políticas para colaborador, jefe, Portfolio Manager y admin.
- `anon` no tiene permisos sobre las tablas de negocio.
- `authenticated` no puede mutar solicitudes ni aprobaciones directamente.
- Administra configuración solo quien tenga rol `ADMIN`.
- El rol `ADMIN` no concede permiso de aprobación.
- Las vistas usan `security_invoker = true`.
- Los helpers privilegiados viven en el esquema no expuesto `private`.

## Analítica inicial

- `team_rotation_summary`
- `request_analytics`

Estas vistas preparan el backend para BI sin calcular todos los indicadores en
el navegador.

## Seed

Se cargaron:

- Cuatro roles.
- Los tres equipos aprobados.
- Un periodo inicial de 2026.
- Cuatro tipos de excepción.
- Reglas y pesos de rotación.

No se crearon usuarios ni contraseñas. En la Etapa 3 se crearán usuarios con
Supabase Auth; después se vincularán perfiles, roles, jefaturas y membresías.

## Verificación realizada

- 18 tablas y 18 tablas con RLS.
- 11 funciones RPC.
- Dos índices únicos parciales para las reglas de cupo.
- Dos vistas `security_invoker`.
- Cero claves foráneas sin índice.
- Cero avisos del asesor de seguridad.
- Migraciones registradas en Supabase.

Los avisos de rendimiento restantes indican índices aún no utilizados. Es
normal en una base nueva sin solicitudes reales y deben reevaluarse cuando
exista tráfico representativo.
