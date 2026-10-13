---
name: Early Fridays PMO
description: Sistema visual empresarial para gestionar el beneficio Early Friday con claridad y trazabilidad.
colors:
  institutional-navy: '#071d49'
  operational-blue: '#176bff'
  cyan-signal: '#20bde4'
  success-green: '#16a766'
  warning-amber: '#f2a21b'
  danger-red: '#df3f4d'
  work-canvas: '#f3f7fc'
  surface-white: '#ffffff'
  body-ink: '#152540'
  muted-ink: '#64728a'
  cool-border: '#dce6f2'
typography:
  display:
    fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(2rem, 3.5vw, 3.25rem)'
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: '-0.035em'
  headline:
    fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(1.35rem, 2.35vw, 2rem)'
    fontWeight: 800
    lineHeight: 1.15
  body:
    fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.94rem'
    fontWeight: 500
    lineHeight: 1.6
  label:
    fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.78rem'
    fontWeight: 800
    lineHeight: 1.2
rounded:
  control: '12px'
  card: '16px'
  panel: '20px'
spacing:
  xs: '8px'
  sm: '12px'
  md: '16px'
  lg: '24px'
  xl: '36px'
components:
  button-primary:
    backgroundColor: '{colors.operational-blue}'
    textColor: '{colors.surface-white}'
    rounded: '{rounded.control}'
    padding: '12px 16px'
  button-secondary:
    backgroundColor: '{colors.surface-white}'
    textColor: '{colors.institutional-navy}'
    rounded: '{rounded.control}'
    padding: '12px 16px'
  card:
    backgroundColor: '{colors.surface-white}'
    textColor: '{colors.body-ink}'
    rounded: '{rounded.card}'
    padding: '24px'
---

# Design System: Early Fridays PMO

## Overview

**Creative North Star: "El centro de decisión sereno"**

Early Fridays PMO combina confianza institucional con una lectura operativa inmediata. El sistema usa un lienzo azul muy claro, superficies blancas y un azul profundo reservado para navegación, prioridades y acciones. La experiencia debe sentirse empresarial, precisa y calmada, no como una colección genérica de widgets.

La jerarquía nace de la decisión pendiente. Las pantallas del Colaborador destacan primero la siguiente acción útil y luego presentan fechas, estados, responsables y evidencia. El movimiento acompaña cambios de estado con transiciones breves; nunca retrasa la tarea ni desplaza contenido de forma gratuita.

**Key Characteristics:**

- Jerarquía orientada a la siguiente acción.
- Contraste institucional azul sobre superficies luminosas.
- Estados semánticos siempre acompañados por texto.
- Densidad profesional con espacio suficiente para escanear.
- Movimiento discreto y reducible.

## Colors

La paleta combina azul institucional, azul operativo y neutrales fríos; verde, ámbar y rojo se reservan para significado de estado.

### Primary

- **Azul institucional profundo:** estructura la barra lateral, titulares de alto contraste y paneles prioritarios.
- **Azul operativo vivo:** identifica acciones, selección, foco y navegación activa.

### Secondary

- **Cian de señal:** aporta profundidad controlada en gradientes institucionales y detalles de orientación.

### Tertiary

- **Verde confirmado, ámbar en curso y rojo de rechazo:** comunican resultado o riesgo y nunca funcionan como decoración.

### Neutral

- **Lienzo de trabajo frío:** fondo de aplicación de bajo brillo.
- **Superficie blanca:** base de tarjetas, formularios y tablas.
- **Tinta principal y tinta atenuada:** sostienen la jerarquía textual.
- **Borde azul frío:** separa regiones sin endurecer la interfaz.

### Named Rules

**The Semantic Color Rule.** Verde, ámbar y rojo solo aparecen cuando explican un estado real y siempre llevan una etiqueta legible.

**The Blue Hierarchy Rule.** El azul vivo identifica la acción o selección actual; no se usa para hacer competir elementos secundarios.

## Typography

**Display Font:** Manrope (con ui-sans-serif y system-ui como respaldo)

**Body Font:** Manrope (con ui-sans-serif y system-ui como respaldo)

**Character:** Manrope ofrece una voz corporativa contemporánea, de lectura limpia y numerales claros. La jerarquía depende de peso, escala y espacio antes que de múltiples familias.

### Hierarchy

- **Display** (800, escala fluida, línea 1.02): encabezados únicos de página y saludos.
- **Headline** (800, escala fluida, línea 1.15): decisión principal y títulos de sección.
- **Title** (800, 0.82 a 1.05rem): tarjetas, filas y grupos de información.
- **Body** (500, 0.82 a 0.94rem, línea 1.6): instrucciones y contexto; limitar el ancho para facilitar lectura.
- **Label** (700 a 800, 0.66 a 0.78rem): metadatos, acciones compactas y estados.

### Named Rules

**The One Heading Rule.** Cada pantalla expone un solo encabezado principal y organiza el resto con niveles semánticos descendentes.

## Layout

En escritorio, la navegación lateral ocupa 264px en la experiencia del Colaborador y el contenido utiliza contenedores fluidos de hasta 1420px. El ritmo base alterna 8, 12, 16, 24 y 36px. El dashboard combina una banda prioritaria de ancho completo con una columna principal de seguimiento y una columna lateral de contexto. Por debajo de 1080px, las columnas se apilan; por debajo de 720px, acciones, hechos y filas se reorganizan en una sola columna sin perder el orden de lectura.

## Extensión de identidad: Jefe Directo (Fase 2)

La identidad del Colaborador permanece como base, sin reemplazar sus tokens ni composición. La variante está acotada a `.app-shell[data-experience='leader']` y organiza pendientes, evidencia de decisión e historial antes de información secundaria. El detalle presenta evidencia principal y un rail cronológico; los controles de decisión conservan sus confirmaciones.

Se conserva Manrope. La densidad del rol usa títulos de página de 2rem en escritorio y 1.65rem a ≤767px, títulos compactos de 1rem, cuerpo de 0.875rem y metadatos de 0.68–0.72rem, con numerales tabulares. El lienzo azul frío específico del líder es #eef5fc. Las tonalidades complementarias #e3efff, #ccdbee, #b7d0f5 y #9ebff4 son superficies, bordes y foco azul frío, no colores de estado nuevos. Los modales del líder usan 18px de radio y scroll interior; las tarjetas mantienen 16px. Los quiebres responsive de esta variante son 1350, 1100 y 767px. Los estados semánticos siguen acompañados de texto y las transiciones respetan movimiento reducido.

Estas variaciones describen lo implementado en el rol, no sustituyen la rampa general del sistema ni autorizan cambios del Portfolio Manager. Conservación y evidencia: `evidencias/leader-redesign/INVENTARIO_Y_CONSERVACION.md` y `RESULTADO_FASE_2.md`.

## Portfolio Manager: extensión ejecutiva (Fase 3)

Variante exclusivamente `.app-shell[data-experience='portfolio']`, no aplicada a Administración. Conserva Manrope, lienzo #f3f7fc, navy #071d49, azul #176bff, estados existentes y medios de marca. Superficie contextual complementaria #edf4ff y borde #b7d0f5 para atención; tarjetas16px, controles12px, modales16px. Títulos2rem escritorio/1.65rem móvil, secciones1rem, valores KPI1.75rem con numerales tabulares; metadatos .7–.75rem.

La banda ejecutiva agrupa ocho métricas sin tarjetas flotantes independientes. La columna de atención combina SLA y resumen inteligente; el registro comparativo de equipos conserva todas las cifras y anillos de uso. BI separa toolbar, indicadores, gráficos comparativos y tendencia de ancho completo. Detalle de revisión agrupa evidencia junto a cronología no flotante y conserva barra de decisión. Breakpoints1450/1100/767px; móvil apila sin perder campos y acciones. Formularios/modal mantienen validaciones y controles originales. La entrada existente se adapta a opacidad sin transformación, para no desplazar los diálogos fijos; feedback de controles y movimiento reducido permanecen dentro del sistema existente.

La previsualización Portfolio reutiliza fixtures existentes en caché local aislada y rotulada; producción mantiene Supabase. Reporte y matriz: `evidencias/portfolio-redesign`.

## Elevation & Depth

El sistema usa profundidad ambiental suave, no sombras estructurales duras. La separación principal proviene de contraste tonal, bordes fríos de un píxel y espacio.

### Shadow Vocabulary

- **Superficie ambiental** (`0 12px 34px rgb(7 29 73 / 6%)`): tarjetas de trabajo sobre el lienzo.
- **Panel prioritario** (`0 22px 48px rgb(7 29 73 / 16%)`): una única situación o decisión principal.
- **Acción elevada** (`0 10px 24px rgb(23 107 255 / 20%)`): botón primario y su respuesta al hover.

### Named Rules

**The One Focal Elevation Rule.** Solo el elemento de mayor prioridad puede concentrar color, profundidad y escala al mismo tiempo.

## Shapes

Los controles usan esquinas de 12px, las tarjetas de trabajo 16px y los paneles principales 20px. Las píldoras se reservan para estados o conteos breves. Los avatares pueden ser circulares; los iconos funcionales se presentan sin contenedores redundantes salvo cuando el contenedor comunica estado.

## Components

### Buttons

- **Shape:** rectángulo compacto de esquinas suaves (12px).
- **Primary:** azul operativo con texto blanco y separación interna de 12px por 16px.
- **Hover / Focus:** elevación de un píxel, sombra azul moderada y foco visible.
- **Secondary / Ghost:** superficie blanca o transparente con texto azul institucional; se usa para navegación y acciones de menor prioridad.

### Chips

- **Style:** fondo tonal ligero, texto de alto contraste y borde discreto cuando mejora la definición.
- **State:** el texto explica el estado; el color refuerza, nunca reemplaza, su significado.

### Cards / Containers

- **Corner Style:** esquinas de 16 a 20px según jerarquía.
- **Background:** blanco sobre lienzo azul frío; el panel prioritario usa azul institucional.
- **Shadow Strategy:** ambiente suave y reservado.
- **Border:** trazo frío de un píxel.
- **Internal Padding:** 16 a 24px; 36px solo en regiones principales.

### Inputs / Fields

- **Style:** fondo blanco, borde frío de un píxel y esquinas de 12px.
- **Focus:** borde azul y anillo visible sin cambiar el tamaño del control.
- **Error / Disabled:** rojo semántico para error; gris azulado y contraste suficiente para deshabilitado.

### Navigation

La barra lateral usa un gradiente azul profundo, texto blanco atenuado en reposo y azul vivo para la ruta activa. En móvil se transforma en panel controlado por un botón con nombre accesible; el contenido conserva la misma secuencia.

### Next Action Panel

El panel prioritario resume la situación actual, el paso siguiente y tres hechos operativos. Solo aparece como pieza dominante cuando existe una decisión o acción clara y usa datos reales o demostrativos explícitamente etiquetados.

## Do's and Don'ts

### Do:

- **Do** organizar cada pantalla alrededor de la pregunta que el usuario necesita resolver.
- **Do** mostrar estado, responsable y siguiente acción en la misma zona de lectura.
- **Do** mantener estados de hover y foco visibles, breves y compatibles con movimiento reducido.
- **Do** preservar rutas, permisos, validaciones y semántica de los datos al cambiar la presentación.

### Don't:

- **Don't** usar cuatro tarjetas equivalentes cuando una decisión tiene prioridad clara.
- **Don't** convertir estados semánticos en color sin texto.
- **Don't** añadir contenedores decorativos alrededor de cada icono o dato.
- **Don't** introducir tipografías, paletas o patrones que compitan con la identidad institucional aprobada.
