# Remediación productiva — Early Fridays PMO

**Fecha:** 1 de septiembre de 2026
**Auditoría de origen:** `AUDITORIA_TECNICA_INTEGRAL_2026-08-31.md`
**Resultado local:** los cuatro bloqueadores críticos quedaron resueltos en el código y en el repositorio.
**Veredicto de despliegue:** **GO CONDICIONADO**. El artefacto puede pasar a un ambiente de staging/UAT, pero no debe recibir usuarios productivos hasta completar las validaciones externas indicadas al final.

## 1. Bloqueadores críticos

| ID      | Hallazgo original                                                                   | Remediación                                                                                                                                | Evidencia                                                                                                       | Estado                                                            |
| ------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| BUG-001 | El detalle de aprobación fallaba durante la carga.                                  | Los cálculos que dependían de la solicitud se movieron después de los estados de carga/error. Se agregó una pantalla de error recuperable. | Prueba de integración y apertura real de detalles con los perfiles de jefe y Portfolio, sin errores de consola. | **Resuelto**                                                      |
| SEC-001 | Un usuario autenticado podía abrir rutas de otros roles.                            | Se incorporó `RoleRoute`, una matriz explícita de permisos y una pantalla de acceso denegado.                                              | José Pisco fue bloqueado al intentar abrir BI global. Pruebas automatizadas cubren acceso permitido y denegado. | **Resuelto en frontend**; RLS sigue siendo la autoridad en datos. |
| DB-001  | Una migración productiva insertaba datos UAT y podía romper una instalación limpia. | El fixture ahora es un no-op por defecto y exige `app.enable_uat_seed = 'on'`. Se añadió limpieza transaccional independiente.             | Revisión estática y job de PostgreSQL/Supabase en CI.                                                           | **Resuelto en código**; pendiente ejecutar CI de base.            |
| REL-001 | El proyecto no tenía historial Git ni punto de reversión.                           | Se creó un baseline reproducible con exclusión de secretos y artefactos locales.                                                           | Commit inicial y árbol de trabajo verificable.                                                                  | **Resuelto**                                                      |

## 2. Hallazgos importantes

| ID       | Resultado de la remediación                                                                                            | Estado                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| QA-001   | Se agregaron pruebas de integración, autorización y filtro analítico, además de recorridos E2E en escritorio y móvil.  | **Resuelto**                                                         |
| UX-001   | Se agregaron `errorElement`, fallback de carga y Error Boundary global sin exponer trazas al usuario.                  | **Resuelto**                                                         |
| DATA-001 | Se preparó una migración idempotente para reparar mojibake en datos históricos.                                        | **Preparado; no aplicado en Early cloud**                            |
| UX-002   | Se ajustaron puntos de quiebre, paneles y detalle móvil; el E2E verifica que el documento no desborde horizontalmente. | **Resuelto para los flujos cubiertos**                               |
| SEC-002  | Se revocó la ejecución global de funciones y se definieron concesiones explícitas para helpers y RPC autorizados.      | **Preparado; requiere prueba pgTAP y aplicación cloud**              |
| UX-003   | “Crear equipo” inicia campos vacíos; editar conserva los datos seleccionados.                                          | **Resuelto**                                                         |
| DATA-002 | Se centralizó la reconciliación de estados e incorporaron no utilizado, cancelaciones y cierres sin beneficio.         | **Resuelto**                                                         |
| UX-004   | La solicitud del jefe representa la revisión propia como “No aplica” y continúa directamente a Portfolio.              | **Resuelto**                                                         |
| OPS-001  | Hay Error Boundary, Analytics, Speed Insights, runbook, pasos de backup/restauración y quality gate.                   | **Parcial**: falta monitor externo y simulacro real de restauración. |

## 3. Hallazgos menores

| ID        | Resultado                                                                                                                 | Estado                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| STYLE-001 | Todo el repositorio cumple Prettier.                                                                                      | **Resuelto**                                                          |
| A11Y-001  | El componente de métricas usa el orden semántico `dt`/`dd`.                                                               | **Resuelto**                                                          |
| PERF-001  | Se configuró code splitting para React, Supabase, Query y dependencias; ningún chunk supera el umbral anterior de 500 kB. | **Resuelto**                                                          |
| SEC-003   | Se añadieron CSP, HSTS y cabeceras de seguridad para el hosting.                                                          | **Resuelto en configuración**; validar cabeceras en el dominio final. |

## 4. Controles ejecutados

| Control                    | Resultado                                                                |
| -------------------------- | ------------------------------------------------------------------------ |
| Prettier                   | PASS                                                                     |
| ESLint sin warnings        | PASS                                                                     |
| TypeScript                 | PASS                                                                     |
| Vitest                     | **12 archivos / 32 pruebas PASS**                                        |
| Playwright                 | **5 PASS / 1 omitida por no aplicar al proyecto desktop**                |
| Build productivo           | PASS                                                                     |
| Auditoría npm              | **0 vulnerabilidades**                                                   |
| PostgreSQL/RLS pgTAP       | **No ejecutado localmente: Docker no está instalado**                    |
| Migraciones en Early cloud | **No ejecutadas: la cuenta Supabase actual no tiene acceso al proyecto** |

## 5. Valoración actual

| Área                       | Auditoría inicial | Después de la remediación local | Motivo del límite actual                                                                 |
| -------------------------- | ----------------: | ------------------------------: | ---------------------------------------------------------------------------------------- |
| Completitud general        |               6.5 |                         **8.8** | Falta UAT firmada y aplicación cloud.                                                    |
| Frontend                   |               7.0 |                         **9.2** | Falta validación visual final en dispositivos de usuarios del área.                      |
| Backend                    |               6.5 |                         **8.4** | SQL endurecido, pero aún no probado/aplicado contra Early.                               |
| Analítica y línea de datos |               6.5 |                         **8.6** | Reconciliación mejorada; falta observabilidad productiva y control periódico de calidad. |
| UX                         |               6.0 |                         **9.0** | Flujos críticos y errores corregidos; falta UAT humana formal.                           |
| **Promedio**               |           **6.5** |                      **8.8/10** | No se otorga 10 sin evidencia operativa externa.                                         |

## 6. Condiciones para declarar 100 % / producción

1. Conceder a la cuenta técnica acceso al proyecto Supabase Early y aplicar las migraciones pendientes en staging.
2. Ejecutar el job de base de datos: instalación limpia, pgTAP, RLS/RPC y comparación de esquema.
3. Ejecutar Security Advisor y Performance Advisor de Supabase sin bloqueadores críticos.
4. Probar backup y restauración en un proyecto aislado, conservando evidencia y tiempos de recuperación.
5. Configurar monitoreo externo de excepciones y alertas, con responsables y umbrales.
6. Ejecutar la UAT con usuarios reales de PMO y obtener aceptación formal por rol.
7. Promover a producción únicamente después de que los seis controles anteriores estén en verde.

Hasta completar estas condiciones, el producto es un **release candidate sólido para staging**, no un 10/10 productivo.
