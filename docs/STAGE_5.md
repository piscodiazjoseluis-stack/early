# Etapa 5 — Equipos

## Objetivo

Implementar la organización de equipos, integrantes, jerarquía, elegibilidad y
prioridad inicial de rotación utilizando el proyecto Supabase `Early`.

## Entregables

- Consulta real de equipos y membresías activas.
- Pantalla de gestión basada en el mockup `09-team-management.png`.
- Búsqueda por nombre de equipo o integrante.
- Selección de equipo y resumen de elegibilidad.
- Prioridad inicial de rotación visible por equipo.
- Vista de consulta para Portfolio Manager y jefaturas.
- Operaciones administrativas para:
  - crear y editar equipos;
  - asignar jefatura;
  - agregar o mover integrantes;
  - configurar elegibilidad;
  - incluir o excluir de la rotación.
- Integración del bloque “Mi equipo” del dashboard con datos reales.
- Vista de fidelidad en `/sistema-visual/equipos`.
- Ruta autenticada en `/equipos`.

## Base de datos

La migración
`supabase/migrations/20260730140005_stage_5_team_management.sql` añade:

- `assign_or_move_team_member`;
- `configure_team_member`;
- `assign_team_leader`.

Las tres funciones son `security invoker`, requieren una sesión autenticada y
verifican explícitamente el rol `ADMIN`. El rol anónimo no puede ejecutarlas.
Las políticas RLS de las tablas continúan siendo la barrera de autorización.

Mover una persona cierra su membresía anterior antes de crear la nueva. Asignar
una jefatura asegura también la membresía activa y el rol `TEAM_LEADER`.

## Datos iniciales

Supabase contiene los tres equipos oficiales:

- Team Elena Chipana.
- Team Carol Flores.
- Team Hugo Ramirez.

No se crearon perfiles ni usuarios ficticios. Al cierre de esta etapa existen
cero perfiles activos y cero membresías activas; por ello la ruta autenticada
mostrará los equipos sin integrantes hasta crear las cuentas corporativas
reales. La ruta de revisión usa exclusivamente los nombres y cargos del
documento oficial para comprobar fidelidad visual.

## Acceso

- Personas autenticadas: pueden consultar únicamente los datos permitidos por
  RLS.
- Portfolio Manager: puede consultar el alcance global.
- Jefe directo: consulta su equipo.
- Administrador: puede modificar equipos, jefaturas, membresías y elegibilidad.

## Verificación

- Migración aplicada al proyecto `Early`.
- Tres funciones administrativas presentes.
- `security invoker` confirmado.
- Ejecución anónima revocada.
- Asesor de seguridad de Supabase sin observaciones.
- Tipos TypeScript actualizados.
- Pruebas de la pantalla, búsqueda y modal administrativo.
- Lint, TypeScript y compilación de producción.

Los avisos de rendimiento actuales son índices sin uso, esperables antes de
tener usuarios y tráfico real.
