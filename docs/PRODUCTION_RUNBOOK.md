# Operación productiva - Early Fridays PMO

## Precondiciones de salida

- `npm.cmd run check` y `npm.cmd run test:e2e` sin errores.
- Workflow `quality-gate` verde, incluidos pgTAP y reconstrucción local de Supabase.
- UAT firmada por un colaborador, un jefe directo y Portfolio Manager.
- Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` configuradas en producción.
- Protección de contraseñas filtradas habilitada en Supabase Auth cuando el plan sea Pro o superior.
- Confirmar en Supabase que los respaldos administrados/PITR correspondan al RPO acordado por PMO.
- Ejecutar advisors de seguridad y rendimiento sin hallazgos críticos.

## Remediación técnica del 1 de septiembre de 2026

- El detalle real de aprobaciones carga para jefe directo y Portfolio sin exponer trazas.
- Las rutas autenticadas aplican una matriz explícita por rol y responden con una vista 403.
- Las vistas `/sistema-visual/*` se excluyen del build productivo salvo que
  `VITE_ENABLE_VISUAL_PREVIEW=true` se configure deliberadamente.
- Las funciones privadas y los RPC públicos tienen permisos explícitos de mínimo privilegio.
- Los escenarios UAT ya no se insertan automáticamente; requieren
  `set app.enable_uat_seed = 'on'` en una base exclusiva de pruebas.
- El pipeline ejecuta formato, lint, TypeScript, unitarias/integración, build, auditoría npm,
  Playwright en escritorio/móvil y pgTAP sobre Supabase local.
- Pendiente externo: aplicar las migraciones nuevas y ejecutar advisors/restore usando la cuenta
  propietaria del proyecto Supabase Early.

## Estado verificado el 2 de septiembre de 2026

- Producción: `https://early-fridays-pmo.vercel.app`.
- Salud del frontend: `GET /health.json` responde `200` y `status: ok`.
- Vercel Web Analytics y Speed Insights: habilitados en el proyecto y cargados por la aplicación.
- Supabase `Early`: `ACTIVE_HEALTHY`, plan Free.
- Las migraciones productivas están sincronizadas hasta `move_client_error_reporter_private`.
- La matriz transaccional de creación, aprobación, devolución, reenvío, rechazo,
  cancelación, cupo de equipo y confirmación de uso pasó contra la base cloud y se revirtió.
- Security Advisor no reporta tablas sin RLS ni funciones privilegiadas expuestas. Permanece la
  advertencia de protección de contraseñas filtradas, dependiente del plan/configuración de Auth.
- Performance Advisor no reporta advertencias; solo índices todavía sin uso en el volumen UAT.
- El plan Free no ofrece una restauración administrada que deba darse por garantizada. Antes de la UAT final se debe acordar una de estas alternativas: subir a Pro para respaldos diarios, o programar y custodiar dumps lógicos fuera del repositorio.
- Pendiente organizacional: firma de UAT por representantes reales de los tres roles.

## Monitoreo

- Vercel Web Analytics y Speed Insights están integrados en el cliente.
- Los errores React, `window.error` y promesas no controladas de usuarios autenticados se
  sanitizan y registran mediante un RPC con límite antiabuso. Portfolio los consulta en
  **Excepciones y auditoría → Salud del cliente**.
- Comprobar `GET /health.json` para disponibilidad del frontend.
- Revisar errores de navegador y Auth/API de Supabase después de cada despliegue.
- Alertas recomendadas: disponibilidad menor a 99.9%, aumento de errores Auth, solicitudes Portfolio con SLA mayor a 24 horas y beneficios aprobados sin confirmación de uso.
- El monitor de errores no sustituye un servicio externo de disponibilidad. Para operación real,
  conectar `/health.json` a un monitor con alertas y responsable de guardia.

## Respaldo y recuperación

- Supabase es la fuente de verdad. No respaldar únicamente el artefacto frontend.
- Antes de cambios de esquema, verificar respaldo administrado o crear un dump cifrado fuera del repositorio.
- Mientras el proyecto continúe en Free, generar un dump lógico periódico con Supabase CLI y almacenarlo cifrado fuera del equipo y del repositorio.
- Conservar migraciones en `supabase/migrations` y probar la restauración en un proyecto aislado.
- RPO recomendado: 24 horas. RTO recomendado: 4 horas. Para un RPO menor, habilitar PITR según el plan contratado.
- Nunca almacenar dumps, claves secretas o datos personales dentro del repositorio.

### Ensayo obligatorio de restauración

1. Crear un proyecto Supabase aislado de recuperación.
2. Aplicar todas las migraciones con la semilla UAT desactivada.
3. Restaurar el dump cifrado más reciente.
4. Ejecutar `supabase test db` y el flujo crear → aprobar → confirmar uso.
5. Medir y registrar RPO/RTO, responsable, fecha, hash del dump y resultado.
6. Eliminar el proyecto aislado solo después de conservar la evidencia aprobada.

### Retiro de datos UAT existentes

El archivo `supabase/seeds/cleanup_uat_cross_team.sql` identifica únicamente registros con
`priority_explanation.source = 'uat_cross_team'` y termina en `ROLLBACK`. Tras respaldar y revisar
el listado, el responsable de datos puede cambiar el cierre a `COMMIT` y ejecutarlo en una ventana
controlada. Nunca eliminar perfiles de personas como parte de esta limpieza.

## Rollback

1. Reasignar producción al despliegue Vercel anterior.
2. Si hubo migración, aplicar una migración compensatoria; no editar el historial remoto.
3. Validar acceso por los tres roles, bandejas de aprobación y confirmación de uso.
4. Registrar el incidente y su causa en auditoría operativa.

## Confirmación de uso

- Una aprobación final queda en `FINAL_APPROVED`; todavía no cuenta como utilizada.
- Después del horario aprobado aparece la acción para confirmar `USED` o `NOT_USED`.
- El colaborador lo ve en Mis solicitudes, detalle, historial y calendario.
- El jefe directo lo ve en Aprobaciones, detalle, calendario, rotación y BI del equipo.
- Portfolio lo ve en Aprobaciones finales, calendario global, dashboard y BI global.
- Solo `USED` consume el límite anual y modifica la rotación. `NOT_USED` conserva trazabilidad sin consumir cupo.
