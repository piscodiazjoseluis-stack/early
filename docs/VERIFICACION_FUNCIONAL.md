# Verificación funcional de Early Fridays PMO

## Versión y alcance

La sincronización de GitHub del 23 de noviembre de 2026 incorpora los cambios
locales del paquete `Sistema_Completo.zip` entregado el 9 de noviembre de 2026.
Su revisión base es `b5c9e4188224cd834e2af0ed77968edaba45a190`. La huella SHA-256
del ZIP de referencia es
`b12cbaa6942fb68bdaaf734dd7de92141807fb8260fb88d48d19618fd38bd893`.

El indicador funcional es **14 historias con escenario crítico verificado / 14
historias del alcance = 100 %**, referido al código y al entorno QA indicados.
No representa una certificación de todo el producto, una cobertura de código del
100 %, una repetición nueva de los 37 criterios históricos ni la ausencia de
hallazgos de seguridad. La aceptación humana de cambios y la liberación productiva
son comprobaciones distintas.

El sistema utiliza React, TypeScript, Vite y Supabase. Tiene tres perfiles
funcionales: Colaborador, Jefe Directo y Portfolio Manager. El valor técnico legado
`ADMIN` permanece por compatibilidad; no es un cuarto perfil funcional que deba
asignarse para operar el aplicativo.

## Matriz de las historias

Los identificadores de integración corresponden a los registros sanitizados de
[la ejecución de QA](verification/2026-11-09/results.json). Las pruebas de
componentes están en `tests/unit` y `tests/integration`; las pruebas de navegador,
en `tests/e2e`.

| Historia | Función implementada                                                      | Evidencia del escenario crítico en QA                                                                                                              |
| -------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| HU-01    | Registrar y centralizar solicitudes con identidad, equipo, fecha y estado | `SEND`, `HU01-COMMENT-LIMIT`; `RequestsPages.test.tsx`                                                                                             |
| HU-02    | Validar viernes y horario permitido                                       | `ONLY-FRIDAY`; `request-schema.test.ts`                                                                                                            |
| HU-03    | Controlar cupo de equipo, incluso en decisiones concurrentes              | `TEAM-CAPACITY`, `RACE-SAME-TEAM-APPROVAL`                                                                                                         |
| HU-04    | Controlar reservas de viernes contiguos y distinguir uso de aprobación    | `BLOCK-PENDING-NEXT`, `BLOCK-REVERSE-ORDER`, `NOT-USED-RELEASES`, `USED-REMAINS-BLOCKED`, `FAKE-NOT-USED-DOES-NOT-RELEASE`, `RACE-ADJACENT-CREATE` |
| HU-05    | Revisar por jefe y después decidir como Portfolio                         | `LEADER-APPROVES`, `FINAL-APPROVES`, `PORTFOLIO-CANNOT-SKIP-LEADER`, `OWN-APPROVAL-DENIED`                                                         |
| HU-06    | Derivar la solicitud propia del jefe directamente a Portfolio             | `LEADER-PERSONAL-REQUEST`                                                                                                                          |
| HU-07    | Conservar historial, responsables y observaciones                         | `TIMELINE`, `RETURNED-STILL-BLOCKS`, `RESUBMIT-EXCLUDES-SELF`                                                                                      |
| HU-08    | Consultar solicitudes y pendientes según identidad y rol                  | `RLS-COLLABORATOR`, `RLS-OUTSIDER`; recorridos autenticados y `RoleRoute.test.tsx`                                                                 |
| HU-09    | Consultar calendario según período, equipo y estado autorizados           | `HU09-FILTERS`; `request-calendar.test.ts`; `PortfolioDateFilter.test.tsx`                                                                         |
| HU-10    | Presentar dashboard por rol y conciliar sus agregados                     | `ANALYTICS-RECONCILE`; recorridos de los tres paneles                                                                                              |
| HU-11    | Generar notificaciones del proceso dirigidas al destinatario              | `NOTIFICATIONS`; consulta autenticada de Notificaciones en los tres perfiles                                                                       |
| HU-12    | Consultar y exportar reportes autorizados                                 | Descargas CSV reales como jefe y Portfolio; `request-report.test.ts`                                                                               |
| HU-13    | Presentar recomendaciones explicables basadas en el ámbito autorizado     | `HU13-TEAM-INSIGHT`; `TeamLeaderApprovals.test.tsx`, sin aprobación automática                                                                     |
| HU-14    | Administrar personas, roles, equipos, elegibilidad y parámetros           | `HU14-PORTFOLIO-PEOPLE`, `HU14-SETTINGS`, `HU14-ELIGIBILITY`, `HU14-COLLABORATOR-DENIED`; gestión de equipos y rutas protegidas                    |

## Pruebas y fechas

| Comprobación                   | Resultado documentado                                       | Entorno y alcance                                                                                |
| ------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Unitarias y componentes        | 77 aprobadas, 21 archivos                                   | Servicios simulados cuando corresponde; no prueban por sí solos Supabase                         |
| Integración con Supabase       | 35 casos aprobados                                          | Auth, API, funciones y PostgreSQL reales en una instancia local aislada, con datos sintéticos    |
| Navegador autenticado          | 29 comprobaciones aprobadas                                 | Tres perfiles, consultas, navegación, CSV y cierre de sesión; sin tráfico al proyecto productivo |
| Interfaz de escritorio y móvil | 37 aprobadas y 1 omisión esperada                           | Vistas de desarrollo; no equivale a aceptación de datos productivos                              |
| Seguridad SQL                  | 11 comprobaciones aprobadas                                 | pgTAP sobre permisos y RLS, con reversión de la transacción                                      |
| Instalación del ZIP            | Instalación, lint, TypeScript, 77 pruebas y build conformes | Extracción independiente del paquete                                                             |

Las baterías de integración, navegador y SQL anteriores se ejecutaron el
**9 de noviembre de 2026 en America/Bogota**; los logs posteriores a las 19:00
indican 10 de noviembre en UTC. No se cambian sus fechas para presentarlas como una
nueva ejecución. La sincronización del 23 de noviembre repite las comprobaciones
que figuran en [su propio registro](verification/2026-11-23/results.json).

Los intentos visuales iniciales incluyeron tiempos de espera y una pérdida de
contexto de navegación mientras se generaban otros archivos. La repetición final
se realizó con dos procesos y sin escrituras paralelas de artefactos; obtuvo
37 aprobadas, una omisión esperada y ningún fallo. La omisión corresponde a una
condición de dispositivo, no a una prueba declarada como aprobada.

## Reglas de negocio preservadas

- El jefe puede consultar sus solicitudes, pero no autoaprobarlas.
- El colaborador pasa por jefe y Portfolio; el jefe solicitante pasa a Portfolio.
- Una reserva activa bloquea fechas contiguas; un rechazo, cancelación válida o
  no uso con confirmación válida pueden liberar la reserva. La falta de respuesta
  no demuestra que el beneficio no se utilizó. El uso confirmado mantiene el bloqueo.
- La elegibilidad y el cupo se comprueban en servidor. Los insights informan;
  nunca deciden ni aprueban automáticamente.
- Portfolio administra los tres perfiles funcionales y los parámetros con las
  migraciones incluidas. El cliente no concede permisos por ocultar o mostrar menús.

## Límites y seguridad pendientes

La auditoría del 9 de noviembre registró 16 avisos de dependencias, incluidos
DOMPurify (transitivo, crítico) y Zod (alto) al excluir desarrollo. No se debe
interpretar el 100 % funcional como ausencia de vulnerabilidades ni como estado
apto para una nueva liberación sin remediación. Los controles de CI no se desactivan
para producir un resultado artificialmente favorable.

`supabase/tests/database/workflow_scenarios.test.sql` conserva fixtures históricos
con UUID y fechas fijas. Necesita adaptación antes de afirmar que toda la batería
SQL se reproduce en una base vacía. No se certifican entrega de correo externo,
restauración de respaldos, carga de producción, disponibilidad continua ni mejoras
de tiempo de gestión medidas por cronometraje.

La consulta de auditoría repetida el **23 de noviembre** registra 16 avisos
(1 bajo, 9 moderados, 6 altos y ninguno crítico). Al excluir desarrollo quedan
DOMPurify (bajo, transitivo) y Zod (alto). Esta clasificación actual no modifica
retroactivamente el resultado que informó el registro del 9 de noviembre. La
batería completa de GitHub Actions incluye además controles de formato y las
pruebas SQL históricas: no se declara que ese flujo completo esté aprobado.

No se aplicaron migraciones ni se cambiaron usuarios, datos o claves de producción
al sincronizar GitHub. Una actualización de código no demuestra que la misma
versión esté publicada en Vercel. El manual y el Word entregados documentan el QA;
no se incluyen en Git credenciales, sesiones, respaldos ni directorios privados de
las pruebas.
