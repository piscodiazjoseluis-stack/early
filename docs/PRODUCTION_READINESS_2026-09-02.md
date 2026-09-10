# Evidencia de preparación productiva — Early Fridays PMO

**Fecha de cierre técnico:** 2 de septiembre de 2026  
**Supabase:** `Early` (`vhdftudeajvnfrlaponh`)  
**Vercel:** `jose-luis-projects-2ba5b05b/early-fridays-pmo`  
**Producción:** <https://early-fridays-pmo.vercel.app>

## Resultado ejecutivo

El aplicativo pasó de un release candidate local a una versión desplegada y conectada con su
base cloud real. Los bloqueadores técnicos de autorización, integridad, migraciones, trazabilidad,
errores del cliente y despliegue quedaron resueltos. No se declara 10/10 productivo porque la
aceptación humana, el ensayo de restauración y el monitoreo externo requieren decisiones o cuentas
organizacionales que no pueden reemplazarse con una prueba automática.

## Controles ejecutados

| Control                  | Evidencia                                                                              | Resultado               |
| ------------------------ | -------------------------------------------------------------------------------------- | ----------------------- |
| Migraciones cloud        | Cinco remediaciones nuevas aplicadas y visibles en el historial remoto                 | PASS                    |
| RLS e integridad         | 19 tablas públicas con RLS; sin huérfanos, duplicidad activa ni estados inconciliables | PASS                    |
| pgTAP de seguridad       | 11 aserciones, incluido mínimo privilegio del reporter                                 | PASS                    |
| Flujo feliz              | Colaborador crea, jefe aprueba y Portfolio emite decisión final                        | PASS                    |
| Segregación de funciones | Autoaprobación y aprobación Portfolio por colaborador rechazadas                       | PASS                    |
| Corrección               | Devolución y reenvío retornan al nivel de aprobación correcto                          | PASS                    |
| Rechazo                  | Rechazo Portfolio conserva decisión, estado y notificación                             | PASS                    |
| Cupo por equipo          | Una segunda aprobación final para el mismo team/viernes es rechazada                   | PASS                    |
| Cancelaciones            | Cancelación directa y cancelación final autorizada por Portfolio                       | PASS                    |
| Uso real                 | `USED` consume rotación; `NOT_USED` exige motivo y no consume cupo                     | PASS                    |
| Calidad frontend         | 13 archivos / 35 pruebas Vitest                                                        | PASS                    |
| Calidad estática         | Prettier, ESLint y TypeScript                                                          | PASS                    |
| Dependencias             | `npm audit --audit-level=moderate`                                                     | 0 vulnerabilidades      |
| E2E                      | Login y detalle en escritorio/móvil; control de overflow móvil                         | 5 PASS / 1 no aplicable |
| Build                    | Vite productivo y code splitting                                                       | PASS                    |
| Hosting                  | Deployment `dpl_7YsbwmSqv3HgF2VUDzzEMpMZYFFs`, alias productivo y health check         | READY                   |
| Cabeceras                | CSP, HSTS, anti-framing, referrer y permissions policy                                 | PASS                    |
| Consola navegador        | Login productivo escritorio/móvil                                                      | Sin errores             |

Todas las pruebas de negocio cloud se ejecutaron dentro de transacciones con `ROLLBACK`; no se
conservaron solicitudes, decisiones ni telemetría artificial.

## Observabilidad incorporada

- Vercel Web Analytics y Speed Insights.
- `GET /health.json` como señal de disponibilidad del frontend.
- Error Boundary y página de error segura.
- Registro sanitizado de excepciones para usuarios autenticados.
- Redacción de correos y tokens, exclusión de query strings y límite de 10 eventos cada 5 minutos.
- Acceso a telemetría restringido por RLS a Portfolio Manager y Admin.
- Vista operativa en **Excepciones y auditoría → Salud del cliente**, con refresco cada minuto.

## Advisors

- **Security Advisor:** una advertencia externa: protección de contraseñas filtradas deshabilitada.
  No existen tablas públicas sin RLS ni RPC `SECURITY DEFINER` expuestos.
- **Performance Advisor:** sin `WARN`; los avisos `INFO` corresponden a índices aún no utilizados
  por el bajo volumen de datos. No se retiraron índices preventivamente sin métricas representativas.

## Pendientes que requieren intervención organizacional

1. Ejecutar UAT con representantes reales de colaborador, jefe directo y Portfolio y firmar la
   aceptación.
2. Acordar RPO/RTO y ejecutar una restauración en un proyecto o branch aislado. Crear ese recurso
   puede tener costo y requiere confirmación expresa de la organización propietaria.
3. Habilitar protección de contraseñas filtradas si el plan de Supabase contratado la ofrece.
4. Conectar `/health.json` a un monitor externo con notificaciones y responsable operativo.

## Veredicto

**Preparación técnica: 9.5/10.** El código, la base real y el hosting están listos para una UAT
formal. El 0.5 restante no es desarrollo pendiente: corresponde a evidencia operativa y aceptación
humana necesarias antes de afirmar 10/10 de producción con objetividad.
