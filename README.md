# Early Fridays PMO

Aplicación empresarial para gestionar solicitudes, rotación, aprobaciones,
calendarios, auditoría, BI y recomendaciones de Early Fridays dentro de PMO.

## Estado

Flujos de colaborador, jefe directo y Portfolio Manager implementados sobre
PostgreSQL/Supabase, con autenticación, aprobaciones, confirmación de uso,
calendarios, gestión de equipos, auditoría y BI responsive.

## Requisitos

- Node.js 24 (validado con 24.13.0).
- npm 11 (validado con 11.6.2).

## Inicio rápido

```powershell
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run dev
```

Abra `http://localhost:5173`.

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
