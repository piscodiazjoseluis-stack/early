# Early Fridays PMO — Brand and interface specification

## Design read

- **Artifact:** enterprise workflow and analytics application.
- **Audience:** collaborators, team leaders and the Portfolio Manager.
- **Visual language:** institutional, data-first and operational, with a vivid but disciplined blue identity.
- **Mode:** visual overhaul with strict preservation of routes, permissions, business rules and data contracts.
- **Dials:** visual variance 5/10, motion 3/10, information density 8/10, asset dependence 4/10, brand fidelity 8/10.

## Identity assets

- Main logo: `public/brand/early-fridays-logo.svg`
- Sidebar animation: `public/brand/sidebar-brand-loop.webm`
- Login animation: `public/brand/login-wellbeing-loop.mp4`
- Login poster: `public/brand/login-wellbeing-illustration.png`

Identity assets must be used directly. They must not be recreated with CSS or replaced by unrelated illustrations.

## Color roles

- Institutional navy: `#071D49`
- Corporate blue: `#10336D`
- Interactive blue: `#176BFF`
- Identity cyan: `#20BDE4`
- Application background: `#F3F7FC`
- Surface: `#FFFFFF`
- Primary text: `#152540`
- Secondary text: `#64728A`
- Border: `#DCE6F2`
- Success: `#16A766`
- Warning: `#F2A21B`
- Danger: `#DF3F4D`
- Calendar selection: `#7557D5`

Blue and cyan carry identity and interaction. Green, amber, red and violet are reserved for semantic state.

## Typography

- Family: Manrope.
- Titles: 700–800 weight, compact tracking and sentence case.
- Body: 400–600 weight with a minimum 1.5 line-height for longer copy.
- Operational labels: 600–700 weight. Uppercase is limited to short orientation labels.

## Layout and component grammar

- Desktop shell: 276 px sidebar plus a flexible workspace.
- Content width: up to 1540 px, centered where the page benefits from it.
- Spacing follows a 4 px base with primary steps of 8, 12, 16, 20, 24, 32 and 40 px.
- Controls use a 12 px radius. Panels use 18–20 px. Pills are reserved for compact status labels.
- Borders and alignment establish most grouping. Shadows communicate elevation, not decoration.
- Dense operational pages use progressive disclosure instead of hiding essential information.

## Interaction and motion

- Interactive controls have visible hover, focus, active, loading and disabled states.
- Minimum target size is 44×44 px when practical.
- State feedback uses 150–240 ms transitions.
- Page-load spectacle is avoided. Motion explains selection, expansion, confirmation or navigation.
- `prefers-reduced-motion` must preserve every interaction without non-essential animation.

## Protected contracts

- Authentication and Supabase queries.
- Role permissions and access guards.
- Routes, deep links and navigation labels.
- Request, approval, rejection, correction and usage-confirmation workflows.
- Form field meaning, validation and submission behavior.
- Real data, analytics calculations and notification semantics.

