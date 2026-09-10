# Auditoría técnica integral — Early Fridays PMO

**Fecha:** 31 de agosto de 2026
**Alcance:** frontend, backend Supabase, seguridad, UX/UI, analítica, navegación y flujos de aprobación.
**Veredicto:** **NO-GO para producción**. El producto es un prototipo/UAT avanzado y valioso, pero existen bloqueadores funcionales y de autorización.

## 1. Resumen ejecutivo

Early Fridays PMO ya tiene una arquitectura y una cobertura funcional considerable: autenticación, tres experiencias por rol, solicitudes, aprobación en dos niveles, devolución, cancelación, confirmación de uso, rotación, calendarios, notificaciones, auditoría, BI y recomendaciones explicables. Las pantallas principales consumen datos reales de Supabase y no son solo mockups.

Sin embargo, el estado real no es “100 % listo”. Los hallazgos más importantes son:

1. **Bloqueo total del detalle de aprobaciones:** tanto Hugo como María llegan a una pantalla de error al abrir una solicitud. Esto impide aprobar, rechazar o devolver desde la interfaz.
2. **Autorización incompleta en el frontend:** cualquier usuario autenticado puede escribir rutas reservadas para otros roles. José pudo abrir BI global, auditoría, rotación, gestión de equipos y aprobaciones.
3. **Datos UAT mezclados con migraciones productivas:** una migración inserta casos de demostración y falla en una instalación limpia si no existen antes perfiles creados manualmente.
4. **Repositorio sin historial:** la rama `master` no tiene ningún commit y 24 entradas completas aparecen sin seguimiento. No existe una versión reproducible ni un punto seguro de reversión.
5. **Ausencia de pruebas de integración/E2E:** hay 28 pruebas unitarias que pasan, pero las carpetas de integración y E2E están vacías. Por eso el fallo crítico de aprobaciones no fue detectado.
6. **Problemas de calidad de datos y presentación:** textos con mojibake (`rotaciÃ³n`, `mÃnima`), tablas con scroll horizontal en escritorio y algunos contenidos truncados.
7. **Sin manejo global de errores:** React Router muestra su pantalla técnica por defecto con traza y archivo fuente.

### Conclusión ejecutiva

El aplicativo demuestra una solución de negocio bien planteada y una base técnica superior a un mockup, pero aún debe considerarse **UAT avanzada**, no producto listo para usuarios reales. La prioridad inmediata no es agregar módulos: es recuperar el flujo central de aprobación, cerrar RBAC, separar datos de prueba y crear una batería E2E.

## 2. Evidencia y limitaciones

### Evidencia ejecutada

- Tres sesiones reales y simultáneas:
  - José Pisco — colaborador, puerto 5174.
  - Hugo Ramírez — jefe directo, puerto 5173.
  - María Luisa Temoche — Portfolio Manager, puerto 5176.
- Navegación directa por todas las rutas protegidas principales.
- Pruebas de filtros, buscadores, calendarios, modales, corrección, confirmación de uso, gestión de equipos y exportación PDF.
- Verificación responsiva en viewport móvil de 390 × 844.
- Revisión del router, servicios, estado de autenticación, SQL, RLS, migraciones, funciones y configuración Vercel.
- Ejecución de lint, typecheck, 28 pruebas, build, Prettier, `npm audit` y verificación de Git.

### Limitaciones explícitas

- La conexión administrativa de Supabase disponible en esta sesión **no tiene permiso sobre el proyecto Early** (`vhdftudeajvnfrlaponh`). No se pudieron ejecutar `get_advisors`, inspeccionar logs del proyecto ni comparar el esquema remoto con las migraciones locales.
- No se confirmó ninguna acción final que modificara solicitudes reales. Las pruebas llegaron hasta los botones/modales de confirmación. Esto evitó contaminar más la data UAT y, además, el fallo del detalle impidió llegar a las decisiones de jefe y Portfolio.
- No se validaron correos reales de recuperación ni entrega externa de notificaciones; solo la UI y los registros internos.
- La prueba del filtro de fechas mediante automatización dejó los valores visibles, pero los KPIs no cambiaron. La función pura sí tiene pruebas unitarias. Se clasifica como **no verificado en navegador real/manual**, no como fallo definitivo del cálculo.

## 3. Calificaciones

| Área                       |       Nota | Justificación                                                                                                                                                                                 |
| -------------------------- | ---------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Completitud general        | **6.5/10** | La mayor parte del dominio existe, pero el flujo central de decisión está bloqueado, no hay E2E ni cierre productivo.                                                                         |
| Frontend                   | **7.0/10** | Identidad visual consistente, responsive móvil aceptable y componentes ricos. Pierde puntos por crash, scroll horizontal, truncamientos, mojibake y falta de ErrorBoundary.                   |
| Backend                    | **6.5/10** | Buen modelo relacional, RLS, funciones transaccionales, revalidaciones y bloqueo concurrente. No se pudo verificar remoto, hay grants mejorables y una migración UAT no reproducible.         |
| Analítica y línea de datos | **6.5/10** | KPIs, BI, auditoría, uso confirmado, PDF y reglas explicables consumen datos reales. Faltan pruebas de reconciliación, calidad, tracking de eventos de negocio y validación del filtro en UI. |
| UX general                 | **6.0/10** | Flujos y lenguaje son comprensibles, pero una tarea primaria termina en pantalla técnica; existen rutas indebidas, estados ambiguos y desbordamientos.                                        |
| **Promedio simple**        | **6.5/10** | Buen proyecto de portafolio/UAT; insuficiente para producción.                                                                                                                                |

## 4. Inventario por rol y pantalla

Leyenda: **F** funcional; **P** parcialmente funcional; **NF** no funcional; **NI** no implementado.

### 4.1 Acceso y autenticación

| Módulo/ruta              | Estado | Resultado                                                                                                                   |
| ------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| `/iniciar-sesion`        | F      | Auth Supabase, recordar sesión, mostrar/ocultar contraseña y recuperación enlazada. Una sesión existente redirige al panel. |
| `/recuperar-contrasena`  | P      | Vista y formulario existen; no se envió un correo real durante la auditoría.                                                |
| `/actualizar-contrasena` | P      | Vista existe; requiere sesión de recuperación válida, no disponible en esta prueba.                                         |
| `ProtectedRoute`         | P      | Protege por existencia de sesión, pero no por rol.                                                                          |
| Cierre de sesión         | P      | Botón visible en perfil; no se ejecutó para conservar las sesiones de prueba.                                               |

### 4.2 Colaborador

| Pantalla/ruta                        | Estado | Resultado                                                                                                                          |
| ------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Inicio `/panel`                      | P      | KPIs, equipo, asignación, recientes y accesos rápidos usan datos reales. Hay truncamientos/overflow en tabla y acciones.           |
| Nueva solicitud `/solicitudes/nueva` | P      | Calendario de viernes, horario, elegibilidad y preflight funcionan. El envío real no se ejecutó; borrador solo usa `localStorage`. |
| Mis solicitudes `/solicitudes`       | F      | Resumen, estados, búsqueda, detalle y cancelación modal operan.                                                                    |
| Detalle `/solicitudes/:id`           | F      | Datos, responsables, timeline y acciones por estado se renderizan correctamente.                                                   |
| Corregir `/solicitudes/:id/corregir` | P      | Conserva original/observación y habilita formulario. Reenvío real no ejecutado.                                                    |
| Mi calendario `/calendario`          | P      | Estados y detalle funcionan; textos de eventos pueden desbordarse.                                                                 |
| Elegibilidad `/elegibilidad`         | F      | Reglas, uso anual, prioridad y próximas fechas con data real.                                                                      |
| Historial `/historial`               | F      | Separa usados, rechazados y cancelados con detalle.                                                                                |
| Mi equipo `/mi-equipo`               | F      | Jefe e integrantes correctos para Team Hugo.                                                                                       |
| Notificaciones `/notificaciones`     | P      | Lectura y contadores operan; existen textos mal codificados.                                                                       |
| Perfil `/perfil`                     | P      | Datos, roles y formulario existen; actualización no ejecutada.                                                                     |
| Reglas y ayuda `/reglas-ayuda`       | F      | Acordeones y enlaces internos operan.                                                                                              |

### 4.3 Jefe directo

| Pantalla/ruta                                | Estado | Resultado                                                                                                                            |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Inicio `/panel`                              | P      | KPIs, prioridades, pendientes, calendario, alertas y análisis basado en reglas. La prioridad y calendario desbordan horizontalmente. |
| Aprobaciones `/aprobaciones`                 | F      | Lista real, filtros de estado/prioridad y búsqueda funcionan. Tabla requiere scroll horizontal.                                      |
| Detalle `/aprobaciones/:id`                  | **NF** | Crash antes de cargar: `Cannot read properties of undefined (reading 'requesterId')`.                                                |
| Aprobar/rechazar/devolver                    | **NF** | Las tres acciones dependen del detalle roto.                                                                                         |
| Mi equipo `/mi-equipo`                       | F      | José y Valeria se muestran correctamente.                                                                                            |
| Rotación `/rotacion`                         | F      | Ranking, criterios y recomendación visibles.                                                                                         |
| Calendario `/calendario`                     | P      | Calendario y detalle funcionan; eventos largos se cortan.                                                                            |
| Mis solicitudes `/solicitudes`               | F      | El jefe puede solicitar su propio beneficio y se deriva a Portfolio.                                                                 |
| BI del equipo `/bi-equipo`                   | P      | KPIs y distribución con data real. No explica explícitamente todos los estados residuales.                                           |
| Análisis inteligente `/analisis-inteligente` | F      | Es un motor determinístico explicable; correctamente declara que no usa modelo generativo.                                           |
| Notificaciones / Reglas                      | P/F    | Funcionan; notificaciones presentan mojibake en algunos registros.                                                                   |

### 4.4 Portfolio Manager

| Pantalla/ruta                                    | Estado | Resultado                                                                                                                                         |
| ------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resumen ejecutivo `/panel`                       | F      | 22 solicitudes, desglose reconciliable por equipo, SLA, calendario, distribución e insights reales.                                               |
| Aprobaciones finales `/aprobaciones`             | F      | 5 pendientes de 22, filtros y búsqueda.                                                                                                           |
| Detalle y decisión final `/aprobaciones/:id`     | **NF** | Mismo crash crítico del jefe directo.                                                                                                             |
| Calendario global `/calendario`                  | F      | Muestra personas, equipos, estados y hora de salida solicitada.                                                                                   |
| Equipos `/equipos`                               | P      | Lectura, selección, resumen, detalle y modales funcionan. Mutaciones no ejecutadas; “Crear equipo” aparece prellenado con el equipo seleccionado. |
| BI y analítica `/bi-global`                      | P      | KPIs, gráficos, modal de personas y PDF funcionan. Filtro de fecha requiere UAT manual adicional.                                                 |
| Análisis inteligente `/analisis-inteligente`     | F      | Insights determinísticos, auditables y coherentes con SLA/uso. No es IA generativa.                                                               |
| Excepciones y auditoría `/excepciones-auditoria` | P      | Registro real de decisiones y buscador; datos antiguos tienen codificación dañada.                                                                |
| Notificaciones / Reglas                          | P/F    | Vistas disponibles; entrega externa no verificada.                                                                                                |

### 4.5 Administración y capacidades transversales

| Capacidad                         | Estado | Observación                                                                                          |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| Rol `ADMIN` en base de datos      | P      | Existe en RLS/funciones, pero no hay panel administrativo dedicado.                                  |
| Vista pública `/sistema-visual/*` | F      | Mock/demo navegable sin sesión. Debe separarse o deshabilitarse en producción para evitar confusión. |
| Exportación PDF                   | F      | Click comprobado; generó `early-fridays-inicio-actual (1).pdf` de 36 626 bytes.                      |
| Analítica de producto             | P      | Vercel Analytics y Speed Insights registran web vitals/páginas. No hay eventos de negocio definidos. |
| Monitoreo de errores              | NI     | No Sentry/OpenTelemetry ni ErrorBoundary global.                                                     |
| Copilot/LLM                       | NI     | Deliberadamente postergado. Los “insights IA” actuales son reglas.                                   |
| CI/CD                             | NI     | Configuración Vercel existe, pero no hay workflow versionado ni historial Git.                       |
| Backups/restore probado           | NI     | No se encontró evidencia ejecutable de restauración.                                                 |

## 5. Auditoría de permisos

### Comportamiento esperado

- Colaborador: solo sus solicitudes, calendario, elegibilidad, historial y equipo.
- Jefe: lo anterior para sí mismo, más decisiones y BI de su equipo.
- Portfolio: visión global, decisiones finales, equipos, BI y auditoría.
- Admin: configuración técnica/maestros.

### Resultado real

El sidebar cambia correctamente por rol, pero el router solo valida sesión. No existe un guard como `RoleRoute` o `allowedRoles`.

Prueba con José Pisco:

| Ruta escrita manualmente | Resultado                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `/aprobaciones`          | Abrió la bandeja del jefe con “Hola, Hugo”, aunque no mostró filas pendientes.            |
| `/equipos`               | Abrió la gestión global; mutaciones deshabilitadas, pero mostró estructura parcial.       |
| `/bi-equipo`             | Abrió BI de equipo con datos vacíos.                                                      |
| `/bi-global`             | **Mostró 10 solicitudes, 2 aprobadas, 3 rechazadas, 3 pendientes y 1 uso del Team Hugo.** |
| `/analisis-inteligente`  | Abrió el análisis reservado al jefe.                                                      |
| `/excepciones-auditoria` | **Mostró decisiones, responsables y comentarios del Team Hugo.**                          |
| `/rotacion`              | Abrió la rotación del jefe con datos vacíos.                                              |

**Clasificación:** crítico por exposición horizontal de información y confusión de contexto. RLS evita parte del acceso, pero la defensa debe existir tanto en UI/router como en PostgreSQL.

## 6. Pruebas de flujos de aprobación

| ID    | Flujo probado                   | Esperado                                   | Resultado real                                                                                                    | Estado                                      |
| ----- | ------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| FL-01 | Sesión y panel por rol          | Cada usuario ve su panel                   | José, Hugo y María cargaron roles/perfiles correctos                                                              | PASS                                        |
| FL-02 | Preflight de nueva solicitud    | Solo viernes, horario y reglas válidas     | Calendario, 13:00–14:30 y elegibilidad cargaron                                                                   | PASS parcial                                |
| FL-03 | Crear solicitud                 | Persistir y enviar al jefe/Portfolio       | No se mutó data; RPC local contiene validaciones. Sin prueba E2E actual                                           | NO VERIFICADO                               |
| FL-04 | Jefe abre pendiente             | Ver detalle y reglas                       | Crash en `ApprovalDetailPage`                                                                                     | FAIL crítico                                |
| FL-05 | Jefe aprueba                    | Estado pasa a `PENDING_PORTFOLIO`          | Inalcanzable por FL-04; SQL revalida elegibilidad, periodo, cupo y límite                                         | FAIL UI                                     |
| FL-06 | Jefe rechaza                    | Estado terminal y auditoría                | Inalcanzable por FL-04                                                                                            | FAIL UI                                     |
| FL-07 | Jefe devuelve                   | Estado `RETURNED_FOR_CORRECTION`           | Inalcanzable por FL-04                                                                                            | FAIL UI                                     |
| FL-08 | Colaborador corrige             | Ver original, observación y reenviar       | Pantalla y validación funcionan; reenvío no ejecutado                                                             | PASS parcial                                |
| FL-09 | Portfolio abre pendiente        | Ver detalle y evidencias                   | Mismo crash con solicitud de Leonardo                                                                             | FAIL crítico                                |
| FL-10 | Portfolio aprueba/rechaza       | Decisión final y notificación              | Inalcanzable por FL-09; SQL usa advisory lock por equipo/fecha                                                    | FAIL UI                                     |
| FL-11 | Solicitud de jefe               | Saltar revisión propia y pasar a Portfolio | Datos existentes prueban el salto; timeline de solicitud propia puede mostrar “jefe pendiente”, lo que es ambiguo | PASS con gap UX                             |
| FL-12 | Cancelación                     | Pedir motivo y decidir según estado        | Modal abre, motivo requerido y confirmar inicia deshabilitado                                                     | PASS parcial                                |
| FL-13 | Confirmación de uso             | Después del horario, USED/NOT_USED         | Modal ofrece ambas opciones y exige motivo para NOT_USED; no se confirmó en vivo                                  | PASS parcial                                |
| FL-14 | Uso confirmado en toda la línea | Contabilizar rotación, BI e historial      | José figura USED; 1 de 6; BI muestra 1 beneficiado                                                                | PASS histórico                              |
| FL-15 | Exclusión de mismo equipo/fecha | Solo un aprobado final por equipo/viernes  | SQL revalida en ambos niveles y Portfolio usa lock transaccional                                                  | PASS estático                               |
| FL-16 | SLA/escalamiento                | Identificar decisiones >24 h               | Dashboard identifica 5 críticas                                                                                   | PASS visual; no hay escalamiento automático |

## 7. Auditoría de backend y datos

### Fortalezas verificadas en código

- 28 archivos de migración.
- 18 tablas, 35 políticas declaradas, 62 definiciones/reemplazos de funciones, 4 triggers y 36 índices.
- RLS habilitado en las 18 tablas principales.
- Modelo de estados completo: borrador, revisión de jefe, corrección, Portfolio, aprobada final, rechazos, cancelación, usada, no usada y vencida.
- Las decisiones de aprobación son inmutables.
- Las funciones sensibles usan `SECURITY DEFINER` con `search_path = ''`.
- Aprobación revalida sesión, rol, autoría, membresía, elegibilidad, periodo, horario, fecha, conflicto de cupo y límite anual.
- Portfolio serializa por equipo/fecha con `pg_advisory_xact_lock`, mitigando dobles aprobaciones concurrentes.
- `NOT_USED` exige explicación mínima y no consume uno de los seis usos.
- `rotation_history`, `request_approvals`, notificaciones y auditoría permiten trazabilidad.

### Riesgos y gaps

1. `grant execute on all functions in schema private to authenticated` es demasiado amplio. Aunque varias funciones hacen sus propias comprobaciones, el principio de mínimo privilegio recomienda revocar todo y conceder solo wrappers públicos necesarios.
2. La migración `20260813012540_seed_cross_team_uat_scenarios.sql` inserta datos demo y lanza excepción si faltan perfiles creados manualmente. Esto rompe una restauración limpia y mezcla fixture con esquema productivo.
3. No fue posible comparar migraciones con el esquema remoto ni ejecutar advisors de seguridad/performance.
4. No se encontró test automatizado de migraciones, RLS o RPC contra una base efímera.
5. La data UAT contiene comentarios mal codificados, aunque los SQL locales estén en UTF-8 correcto.
6. No existe política/versionado visible para retención, anonimización o eliminación de datos.

## 8. Auditoría de analítica

### Qué sí existe

- KPI de solicitudes, aprobadas, rechazadas, pendientes, usadas y personas sin uso.
- Segmentación por equipo y por persona.
- Evolución semanal de solicitudes/aprobaciones.
- Distribución por estado y tasa de aprobación.
- Calendario global operativo.
- SLA de 24 horas para pendientes críticos.
- Uso confirmado separado de aprobación.
- PDF exportable.
- Recomendaciones determinísticas y explicables.
- Auditoría de quién decidió, nivel, comentario y fecha.

### Qué falta para una línea de datos productiva

- Pruebas de reconciliación: total = aprobadas + rechazadas + pendientes + canceladas/vencidas/otras.
- Data dictionary formal para cada KPI, periodicidad y timezone.
- Tests de calidad: unicidad, completitud, estados válidos, fechas, equipos sin jefe y solicitudes huérfanas.
- Eventos de negocio: solicitud creada, validación fallida, abandono de formulario, tiempo por etapa, decisión, cancelación, confirmación de uso y exportación.
- Observabilidad de consultas/RPC y alertas por error o latencia.
- Separación entre datos demo/UAT y datos reales.
- Versionado del modelo analítico y snapshots de cierre por periodo.

## 9. Bugs y hallazgos priorizados

### Críticos

| ID      | Evidencia                                                                                                                                        | Impacto                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| BUG-001 | `/aprobaciones/:id` en Hugo y María: `request` es `undefined` mientras carga, pero líneas 116–138 leen `request.requesterId` y `request.status`. | Bloquea aprobar, rechazar y devolver; muestra traza técnica.   |
| SEC-001 | `ProtectedRoute` solo valida sesión; José accedió por URL a BI global y auditoría con datos.                                                     | Exposición horizontal y violación de permisos.                 |
| REL-001 | Git: `fatal: ... master does not have any commits yet`; 24 entradas sin seguimiento.                                                             | No hay versión, rollback, revisión ni despliegue reproducible. |
| DB-001  | Migración UAT depende de perfiles preexistentes y aborta si faltan.                                                                              | Una instalación/restauración limpia puede fallar.              |

### Importantes

| ID       | Evidencia                                                                                                                         | Impacto                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| QA-001   | 28 unit tests pasan; `tests/e2e` e `tests/integration` están vacíos.                                                              | No se detectan regresiones de rutas ni flujo real.         |
| UX-001   | Sin ErrorBoundary/errorElement: React Router expone “Unexpected Application Error” y stack.                                       | Mala UX y fuga de detalles técnicos.                       |
| DATA-001 | Auditoría/notificaciones: `rotaciÃ³n`, `mÃnima`, `revisiÃ³n`.                                                                     | Baja confianza y calidad de datos.                         |
| UX-002   | Tablas de aprobaciones y prioridad requieren scroll horizontal en escritorio; calendario corta eventos.                           | Lectura deficiente y fidelidad inconsistente.              |
| SEC-002  | `execute on all functions in schema private` para `authenticated`.                                                                | Superficie de ataque mayor a la necesaria.                 |
| UX-003   | Modal “Crear equipo” aparece con código/nombre/descripción del equipo seleccionado.                                               | Riesgo de duplicar/editar accidentalmente en vez de crear. |
| DATA-002 | Pantallas de jefe/global omiten una categoría residual visible en ciertos resúmenes; el dashboard global ya la aclara por equipo. | Totales difíciles de reconciliar entre pantallas.          |
| UX-004   | Solicitud propia del jefe puede representar la revisión del jefe como “Pendiente” en vez de “No aplica/omitida”.                  | Timeline lógicamente confuso.                              |
| OPS-001  | Sin monitoreo de excepciones ni prueba de backup/restore.                                                                         | Diagnóstico y recuperación insuficientes.                  |

### Menores

| ID        | Evidencia                                                                | Impacto                                                       |
| --------- | ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| STYLE-001 | Prettier falla en 21 archivos.                                           | Inconsistencia y ruido en futuras revisiones.                 |
| A11Y-001  | `DetailMetric` genera `<dd>` antes de `<dt>`.                            | Semántica de lector de pantalla incorrecta.                   |
| PERF-001  | Bundle principal ~499 kB y chunks de jsPDF/analítica/calendario grandes. | Carga inicial/descarga mejorable.                             |
| SEC-003   | Headers útiles presentes, pero falta CSP; HSTS dependerá del host.       | Endurecimiento web incompleto.                                |
| UX-005    | Borrador de solicitud solo se guarda en navegador.                       | Se pierde al cambiar de dispositivo o limpiar almacenamiento. |
| DEMO-001  | Rutas `/sistema-visual/*` siguen desplegables.                           | Confusión entre demo y producto real.                         |

## 10. Calidad estática y pruebas

| Verificación                       | Resultado                           |
| ---------------------------------- | ----------------------------------- |
| ESLint                             | PASS                                |
| TypeScript                         | PASS                                |
| Vitest                             | PASS — 10 archivos, 28 tests        |
| Build producción                   | PASS                                |
| `npm audit --audit-level=moderate` | PASS — 0 vulnerabilidades conocidas |
| `git diff --check`                 | PASS                                |
| Prettier                           | FAIL — 21 archivos                  |
| Integración                        | NO IMPLEMENTADA                     |
| E2E                                | NO IMPLEMENTADA                     |
| Cobertura mínima obligatoria       | NO CONFIGURADA                      |

## 11. Recomendaciones priorizadas

### P0 — antes de cualquier UAT adicional

1. Corregir `ApprovalDetailPage` con estados explícitos de loading/error/not-found antes de cualquier acceso a `request`.
2. Agregar pruebas E2E para abrir el detalle desde jefe y Portfolio.
3. Implementar guard de rutas por rol y página 403; probar matriz completa de acceso.
4. Validar que RLS niegue las mismas consultas mediante pruebas de base de datos por cada rol.
5. Crear el primer commit, rama protegida y tag de baseline auditado.

### P1 — antes de producción

1. Sacar los seeds UAT de `migrations`; crear comando separado, reversible y bloqueado en producción.
2. Crear pipeline CI: format, lint, typecheck, unit, integración Supabase, E2E, build y audit.
3. Corregir mojibake en registros existentes y normalizar UTF-8 de la carga.
4. Agregar ErrorBoundary global, páginas 403/404/500 y reporte de errores.
5. Probar todos los RPC en una base efímera con rollback y concurrencia real.
6. Revocar grants globales de `private` y conceder funciones mínimas.
7. Ejecutar advisors/logs de Supabase con la cuenta propietaria de Early.
8. Crear backup y ejecutar una restauración verificada.

### P2 — calidad y experiencia

1. Eliminar scroll horizontal innecesario y truncamientos en escritorio/calendarios.
2. Corregir “Crear equipo” para iniciar vacío y confirmar acciones sensibles.
3. Cambiar la etapa del jefe propio a “No aplica / derivada directamente a Portfolio”.
4. Completar reconciliación y tooltip de definiciones de KPIs.
5. Validar manualmente el filtro de fechas y añadir E2E que compruebe el cambio de KPIs/PDF.
6. Sincronizar borradores en backend si se requiere continuidad multidispositivo.
7. Aplicar Prettier y dividir componentes minificados en una sola línea.
8. Optimizar carga diferida de gráficos, calendario y PDF.

### P3 — evolución de producto

1. Instrumentar eventos de negocio y funnel de solicitudes.
2. Añadir alertas automáticas de SLA, no solo indicadores.
3. Incorporar Sentry/OpenTelemetry y panel operativo.
4. Separar explícitamente ambientes demo, UAT y producción.
5. Evaluar Copilot/LLM solo después de gobernanza, seguridad, costos y grounding; conservar explicación y fuentes.

## 12. Criterio de salida a producción

No recomendaría producción hasta cumplir todos estos puntos:

- 0 bugs P0 abiertos.
- RBAC probado en router y RLS para los cuatro roles.
- Flujo E2E completo: crear → aprobar jefe → aprobar/rechazar Portfolio → notificar → confirmar uso/no uso → reflejar BI.
- Cancelación y devolución probadas end-to-end.
- Migraciones reproducibles desde base vacía.
- Datos UAT fuera de producción.
- CI verde y repositorio versionado.
- Error monitoring y runbook de incidentes.
- Backup restaurado exitosamente al menos una vez.
- UAT formal con usuarios del área y evidencia firmada.

## 13. Veredicto final

**Estado actual: 6.5/10 — UAT avanzada, NO-GO productivo.**

El proyecto tiene buen valor de portafolio porque combina frontend, UX/UI, PostgreSQL/Supabase, RLS, arquitectura de estados, analítica, auditoría, reglas explicables y visualización de datos. Lo que más elevará su valor profesional ahora no es añadir otra función: es demostrar disciplina de ingeniería cerrando autorización, E2E, observabilidad, reproducibilidad y calidad de datos.
