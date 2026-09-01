# Etapa 1 — Inicialización

## Arquitectura entendida

Early Fridays PMO será una SPA modular por features. React y Vite resuelven la
presentación; Supabase concentrará autenticación, PostgreSQL, RLS, funciones,
Realtime, Storage y Edge Functions. La lógica crítica se implementará en la base
de datos en etapas posteriores. TanStack Query administrará estado remoto y
Zustand se reservará para estado local transversal.

## Tecnologías instaladas

- React 19, TypeScript 5.9 y Vite 8.
- Tailwind CSS 4 y configuración compatible con shadcn/ui.
- React Router 7, TanStack Query 5 y Zustand 5.
- Supabase JS 2.
- React Hook Form, Zod y resolvers.
- Lucide React, Recharts y FullCalendar 6.
- ESLint 9, Prettier 3, Vitest y Testing Library.

## Estructura inicial

La aplicación se organiza en `src/app`, `src/components`, `src/features`,
`src/layouts`, `src/lib`, `src/services`, `src/stores`, `src/types`,
`src/schemas`, `src/hooks`, `src/constants` y `src/styles`. El backend queda
reservado bajo `supabase/migrations`, `supabase/functions` y
`supabase/seed.sql`. Las pruebas se separan en `tests/unit`,
`tests/integration` y `tests/e2e`.

## Conflictos de versiones resueltos

- TypeScript 6 de la plantilla se fijó en 5.9 porque `typescript-eslint` aún
  requiere una versión menor que 6.
- Todos los paquetes FullCalendar se fijaron en 6.1.21 para evitar mezclar la
  versión 7 del adaptador React con plugins 6.
- React Router se fijó en 7.18.2. La auditoría registra un aviso para su modo
  RSC/Server Actions; Early Fridays es una SPA Vite y no utiliza esa superficie.
- Supabase se configura con clave publicable; nunca con `service_role`.

## Orden de trabajo aplicado

1. Confirmar el repositorio real y revisar el paquete aprobado.
2. Verificar Node, npm, versiones de dependencias y cambios de Supabase.
3. Crear la plantilla React + TypeScript.
4. Instalar y fijar dependencias compatibles.
5. Crear arquitectura por features, aliases y proveedores base.
6. Configurar Tailwind, shadcn/ui, ESLint, Prettier y pruebas.
7. Preparar variables públicas y cliente Supabase sin conectarlo aún.
8. Ejecutar lint, tipos, pruebas, build y una comprobación visual.

## Comandos

```powershell
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## Variables de entorno

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_me
```

Estas variables son públicas por diseño. No agregue claves secretas ni
`SUPABASE_SERVICE_ROLE_KEY` al frontend.

## Resultado esperado

Se muestra una página de preparación de la Etapa 1 con el logo de referencia y
el estado de configuración de Supabase. No existen aún autenticación, tablas,
aprobaciones ni pantallas funcionales.

## Errores frecuentes

- `npm.ps1 cannot be loaded`: use `npm.cmd` en PowerShell.
- El estado de Supabase aparece pendiente: cree `.env.local` y reinicie Vite.
- Puerto 5173 ocupado: ejecute `npm.cmd run dev -- --port 5174`.
- Alias `@/` no resuelto: reinstale dependencias y reinicie el servidor.

## Checklist

- [x] Vite, React y TypeScript estricto.
- [x] Tailwind y shadcn/ui configurados.
- [x] Router, Query, Zustand y Supabase instalados.
- [x] ESLint, Prettier y pruebas configurados.
- [x] Estructura modular creada.
- [x] Variables documentadas sin secretos.
- [ ] Credenciales reales de Supabase agregadas localmente.
- [ ] Etapa 2 aprobada por el usuario.
