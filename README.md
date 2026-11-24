# Early Fridays PMO

Aplicación empresarial para gestionar solicitudes, rotación, aprobaciones,
calendarios, auditoría, BI y recomendaciones de Early Fridays dentro de PMO.

## Estado

Actualización del repositorio: **23 de noviembre de 2026**. Esta versión incorpora
las correcciones locales del sistema entregado en `Sistema_Completo.zip` el 9 de
noviembre: administración por Portfolio Manager, validación de comentarios en
servidor, protección de la exportación CSV y nombre real de la cuenta en la bandeja
de aprobaciones. Incluye sus migraciones y pruebas de regresión.

El alcance funcional verificado es de **14 de 14 historias de usuario** en QA
local aislado. No significa ausencia de vulnerabilidades, cobertura total de líneas
de código ni aceptación de esta misma versión en producción. Consulte la
[matriz de cumplimiento y evidencia](docs/VERIFICACION_FUNCIONAL.md).

Flujos de colaborador, jefe directo y Portfolio Manager implementados sobre
PostgreSQL/Supabase, con autenticación, aprobaciones, confirmación de uso,
calendarios, gestión de equipos, auditoría y BI responsive.

## Requisitos

- Node.js 24 (validado con 24.13.0).
- npm 11 (validado con 11.6.2).

## Inicio rápido

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
# Completar las dos variables públicas de .env.local con un proyecto propio.
npm.cmd run dev
```

Abra `http://localhost:5173`.

Configure `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` antes de iniciar.
Necesita una cuenta habilitada en ese proyecto y las migraciones de
`supabase/migrations` aplicadas en su entorno propio. El repositorio no incluye
contraseñas, claves privadas, cuentas de producción ni copias de la base real.

Para reconstruir una base **local de pruebas**, con Docker y Supabase CLI
instalados, ejecute `supabase start` y después `supabase db reset --local`.
Este último comando borra los datos locales del proyecto; úselo solo en una base
aislada que pueda reconstruir. No ejecute migraciones, limpieza o cambios de roles
en producción sin aprobación y respaldo. Crear usuarios y asignar roles en un
proyecto nuevo requiere el procedimiento autorizado de Supabase Auth.

## Verificación

```powershell
npm.cmd run format:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:run
npm.cmd run test:e2e
npm.cmd run build
```

Las pruebas PostgreSQL/RLS viven en `supabase/tests/database` y se ejecutan en CI con
`supabase test db`. Localmente requieren un runtime compatible con Docker.

La prueba SQL histórica `workflow_scenarios.test.sql` depende de identidades y
fechas fijas de sus fixtures originales: no debe confundirse con una prueba
reproducible de una base vacía. La evidencia de integración y seguridad ejecutada
en QA se distingue de esa limitación en la matriz. La repetición actual de
`npm run check` comprueba lint, TypeScript, 77 pruebas y compilación.

Las rutas de fidelidad visual `/sistema-visual/*` solo están disponibles en desarrollo. Un build
productivo requiere establecer explícitamente `VITE_ENABLE_VISUAL_PREVIEW=true` para publicarlas.

Guías de entrega:

- [Etapa 1](docs/STAGE_1.md)
- [Etapa 2](docs/STAGE_2.md)
- [Etapa 3](docs/STAGE_3.md)
- [Etapa 4](docs/STAGE_4.md)
- [Etapa 5](docs/STAGE_5.md)
- [Etapa 6](docs/STAGE_6.md)
- [Etapa 6.1](docs/STAGE_6_1.md)
- [Runbook productivo](docs/PRODUCTION_RUNBOOK.md)

## Seguridad

El navegador utiliza únicamente `VITE_SUPABASE_URL` y
`VITE_SUPABASE_PUBLISHABLE_KEY`. Nunca agregue claves secretas, claves de
proveedores de IA ni `SUPABASE_SERVICE_ROLE_KEY` al repositorio o a variables
con prefijo `VITE_`.

La auditoría de dependencias del 9 de noviembre registró avisos pendientes,
incluidos DOMPurify (transitivo) y Zod en dependencias de ejecución. El alcance
funcional no es una certificación de seguridad. No se desactivan los controles de
auditoría de CI para ocultar esos hallazgos; requieren remediación y regresión antes
de una nueva liberación productiva.

## Publicación

Actualizar este repositorio no aplica migraciones ni publica por sí mismo una
nueva versión del servicio. La actualización del 23 de noviembre se limita a
GitHub; no se modifican datos, usuarios, claves ni configuración de producción.
