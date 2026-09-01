# Etapa 3 — Autenticación y acceso inicial

## Objetivo

Conectar el frontend con el proyecto Supabase `Early` e implementar el acceso
seguro a la aplicación sin adelantar la construcción de los paneles
operativos.

## Alcance implementado

- Inicio de sesión real con correo corporativo y contraseña.
- Persistencia opcional de sesión mediante “Recordarme”.
- Cierre de sesión y protección de rutas privadas.
- Solicitud y actualización de contraseña.
- Carga del perfil y de los roles activos del usuario autenticado.
- Tipos TypeScript generados desde el esquema remoto de Supabase.
- Aprovisionamiento automático de perfil y rol `COLLABORATOR` al crear un
  usuario en Supabase Auth.
- Pantalla de entrada autenticada mínima en `/panel`; los paneles definitivos
  se construirán en la etapa visual correspondiente.

## Rutas

| Ruta                     | Acceso       | Función                        |
| ------------------------ | ------------ | ------------------------------ |
| `/iniciar-sesion`        | Público      | Inicio de sesión               |
| `/recuperar-contrasena`  | Público      | Solicitud de recuperación      |
| `/actualizar-contrasena` | Recuperación | Definición de nueva contraseña |
| `/panel`                 | Autenticado  | Punto de entrada protegido     |

## Base de datos

La migración
`supabase/migrations/20260730031648_stage_3_auth_profile_provisioning.sql`
crea la función privada `private.handle_new_auth_user()` y el trigger
`on_auth_user_created` sobre `auth.users`.

La función:

1. crea el registro correspondiente en `public.profiles`;
2. admite `full_name`, `job_title` y `avatar_url` como metadatos de
   presentación;
3. asigna el rol base `COLLABORATOR`;
4. no utiliza metadatos del usuario para conceder privilegios adicionales.

La función usa `security definer`, tiene un `search_path` vacío y solamente
`supabase_auth_admin` puede ejecutarla. El asesor remoto de seguridad de
Supabase no reportó observaciones después de aplicar la migración.

## Creación del primer usuario

No se almacenan contraseñas de prueba en el repositorio. Para crear un usuario:

1. abra el proyecto `Early` en Supabase;
2. entre a **Authentication > Users > Add user**;
3. indique el correo corporativo y una contraseña temporal;
4. opcionalmente agregue `full_name` y `job_title` a los metadatos;
5. entregue la contraseña por un canal seguro y solicite su cambio.

El trigger generará automáticamente el perfil y el rol colaborador. Los roles
de mayor privilegio deben asignarse de forma administrativa y explícita.

## Redirecciones de recuperación

En **Authentication > URL Configuration**, registre:

- `http://localhost:5173/actualizar-contrasena`
- `http://127.0.0.1:5173/actualizar-contrasena`
- `https://<dominio-de-produccion>/actualizar-contrasena`, cuando exista el
  dominio definitivo.

## Fidelidad visual

La pantalla de acceso sigue el mockup oficial: composición de dos columnas,
marca, colores, tipografía, textos, formulario y adaptación móvil. La
ilustración se generó con el modo integrado de Imagegen y se guardó en
`public/brand/login-wellbeing-illustration.png`.

Prompt final de generación de la ilustración:

> Professional editorial corporate illustration for the Early Fridays login
> screen, closely matching the supplied approved mockup composition: a
> confident Latina professional seated comfortably in a modern deep-blue
> armchair, working on a slim laptop, welcoming expression, smart-casual
> business clothing, warm contemporary office lounge, subtle indoor plants and
> soft daylight, calm wellbeing and productivity mood, premium realistic
> digital illustration, navy and sky-blue brand palette with warm neutral
> accents, vertical composition, clean background, no text, no logo, no
> watermark.

Prompt final de corrección del pizarrón:

> Fill only the white page of the tabletop sign so it faithfully matches the
> approved reference. Preserve the entire original scene exactly. Add the
> heading “VIERNES”, a centered hand-drawn blue smiling sun, the text “Tiempo
> para ti. Energía para todos.” and a small solid blue heart. Use handwritten
> dark royal blue ink and preserve the reference hierarchy, spacing,
> perspective and sign geometry. Ensure every Spanish word is spelled exactly
> and clearly legible. No additional text, symbols, logos or watermark.

## Verificación

- Formato, lint, TypeScript, pruebas unitarias y compilación de producción.
- Inicio de sesión contra Supabase con credenciales inválidas y mensaje de
  error traducido.
- Redirección de `/panel` a inicio de sesión cuando no existe sesión.
- Pantallas de acceso y recuperación verificadas en escritorio.
- Acceso verificado a 390 × 844 px, sin desbordamiento horizontal.
- Consola del navegador sin errores en los recorridos comprobados.

No se creó un usuario ficticio. Por ello, el recorrido completo con
credenciales válidas, perfil y roles deberá validarse al crear el primer
usuario real.
