# Etapa 6 — Solicitudes

## Objetivo

Implementar el recorrido del colaborador para crear, consultar, revisar y
cancelar solicitudes de Early Friday, utilizando las funciones transaccionales
del proyecto Supabase `Early`.

## Pantallas

- Nueva solicitud fiel al mockup `05-new-request.png`.
- Historial de “Mis solicitudes”.
- Detalle y seguimiento de una solicitud.
- Vistas públicas de fidelidad:
  - `/sistema-visual/solicitudes/nueva`
  - `/sistema-visual/solicitudes`
  - `/sistema-visual/solicitudes/:requestId`
- Rutas protegidas equivalentes:
  - `/solicitudes/nueva`
  - `/solicitudes`
  - `/solicitudes/:requestId`

## Lógica conectada

- Consulta de solicitudes autorizadas por RLS.
- Consulta de elegibilidad y cálculo determinístico de prioridad.
- Envío mediante `create_early_friday_request`.
- Cancelación mediante `request_cancellation`.
- Detección visual de duplicidades antes del envío.
- Invalidación de caché después de crear o cancelar.
- Todos los estados controlados tienen presentación semántica.

Las operaciones críticas no realizan `insert` ni `update` directo desde React.
El borrador es una preferencia local del dispositivo y no se considera una
solicitud registrada hasta enviarlo.

## Validación reforzada

La migración `20260803022224_stage_6_request_validation.sql` endurece la función
de creación para rechazar:

- fechas pasadas o del mismo día;
- comentarios de más de 500 caracteres;
- horarios fuera del período habilitado;
- solicitudes fuera del plazo;
- solicitudes activas duplicadas para el mismo viernes;
- usuarios sin membresía o no elegibles.

## Límites de la verificación actual

No existen usuarios corporativos reales en el proyecto. Por ello se verificó
la estructura remota, los permisos, las funciones, los asesores y las vistas de
fidelidad, pero el recorrido autenticado completo deberá repetirse cuando se
cree la primera cuenta con membresía activa.

## Checklist

- [x] Nueva solicitud responsive.
- [x] Validación Zod y React Hook Form.
- [x] Elegibilidad y prioridad consultadas en Supabase.
- [x] Historial y detalle.
- [x] Cancelación conectada.
- [x] Accesos desde sidebar y dashboard.
- [x] Estados vacíos, carga y errores.
- [x] Pruebas, lint, TypeScript y build.
