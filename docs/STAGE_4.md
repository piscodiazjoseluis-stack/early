# Etapa 4 — Sistema visual

## Objetivo

Construir la base visual reutilizable de Early Fridays PMO siguiendo los
mockups oficiales, sin incorporar todavía la lógica de negocio de las etapas
5 a 12.

## Fuente de verdad

- Diez mockups aprobados del paquete entregado.
- `branding/branding-guide.txt`.
- Referencias oficiales del logotipo y del símbolo.
- Tipografía Manrope e iconografía funcional Lucide React.

## Entregables

- Logotipo vectorial escalable en
  `public/brand/early-fridays-logo.svg`.
- Símbolo vectorial y favicon fieles a la marca.
- Tokens de color, radios, sombras, tipografía y estados semánticos.
- Layout responsive de aplicación.
- Sidebar con navegación principal.
- Header con bienvenida, perfil y notificaciones.
- Botones primario, secundario, texto y peligro.
- Cards, badges semánticos, tablas y modal.
- Estado vacío.
- Patrones visibles de foco, hover y reducción de movimiento.
- Vista pública temporal de revisión en `/sistema-visual`.
- Vista autenticada en `/panel` usando el mismo sistema visual.

## Fidelidad

El panel de demostración se basa en el mockup
`02-collaborator-dashboard.png`: jerarquía, navegación, distribución de
tarjetas, colores, bordes, acciones rápidas, tabla y pie de seguridad.

Los datos visibles son solamente demostrativos. No sustituyen la conexión de
equipos, solicitudes, aprobaciones o calendario que corresponde a las etapas
siguientes.

## Responsive

- Sidebar persistente en escritorio y tipo drawer en móvil.
- Header simplificado en anchos pequeños.
- Indicadores en una, dos o cuatro columnas según el espacio.
- Tablas con desplazamiento horizontal controlado.
- Acciones y tarjetas adaptables sin desbordamiento.

## Verificación

La etapa se valida mediante:

- formato;
- lint;
- compilación TypeScript;
- pruebas unitarias del panel y del modal;
- compilación de producción;
- revisión de la vista local `/sistema-visual`.
