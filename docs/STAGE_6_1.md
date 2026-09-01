# Etapa 6.1 — Cierre del perfil colaborador

## Objetivo

Completar el recorrido cotidiano del colaborador trainee antes de iniciar los paneles de jefatura y Portfolio.

## Módulos cerrados

- Dashboard del colaborador con accesos rápidos conectados.
- Nueva solicitud, listado, detalle y cancelación.
- Corrección y reenvío de solicitudes devueltas.
- Calendario personal con detalle por viernes.
- Elegibilidad detallada, prioridad y evidencias.
- Historial personal y confirmación de uso real.
- Equipo personal en modo de solo lectura.
- Centro de notificaciones y marcado de lectura.
- Perfil, preferencias básicas y cierre de sesión.
- Reglas y preguntas frecuentes.

## Backend

La migración `20260804020809_stage_6_1_collaborator_closure.sql` agrega la función
`resubmit_returned_request`. La función valida propiedad, estado, viernes futuro,
membresía, elegibilidad, período, horario, plazo y duplicidad antes de reenviar.

El resto de flujos reutiliza las funciones ya existentes:

- `create_early_friday_request`
- `request_cancellation`
- `confirm_early_friday_usage`
- `get_user_eligibility`
- `calculate_rotation_priority`

## Rutas de demostración

- `/sistema-visual`
- `/sistema-visual/solicitudes`
- `/sistema-visual/calendario`
- `/sistema-visual/elegibilidad`
- `/sistema-visual/historial`
- `/sistema-visual/mi-equipo`
- `/sistema-visual/notificaciones`
- `/sistema-visual/perfil`
- `/sistema-visual/reglas-ayuda`

Las rutas equivalentes sin `/sistema-visual` requieren una sesión real y consultan Supabase.

## Verificación

- Lint sin errores.
- TypeScript estricto sin errores.
- 16 pruebas unitarias aprobadas.
- Build de producción aprobado.
- Asesor de seguridad de Supabase sin observaciones.
- La función nueva puede ser ejecutada por `authenticated` y no por `anon`.
