# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Early Fridays PMO serves three organizational roles: Collaborators who request and track the benefit, Team Leaders who review their team, and a Portfolio Manager who makes final decisions and oversees the whole program. Collaborator and Team Leader redesigns are user-approved. The current authorized phase extends the same identity to the complete Portfolio Manager experience, preserving the other two roles.

## Product Purpose

The product manages the complete Early Friday benefit workflow: eligibility review, request creation, team-leader review, portfolio review, correction, approval or rejection, usage confirmation, notifications, history, and auditability. Success means each person can understand the current state, the responsible party, the next permitted action, and the evidence behind a decision without searching across the application.

## Positioning

Early Fridays PMO joins personal benefit self-service with an explainable, role-based approval workflow and real operational traceability. Approval and confirmed use are intentionally distinct business events.

## Operating Context

Employees use the web application in a corporate PMO environment. Collaborators typically need to check eligibility, choose an allowed Friday and departure time, submit a request, follow the approval chain, correct returned requests, cancel when allowed, confirm actual use, review their calendar and history, and consult notifications or rules.

## Capabilities and Constraints

- React 19, TypeScript, Vite, Tailwind CSS and Supabase.
- Authentication, roles, permissions, approval hierarchy, statuses, validations, dates, queries, mutations, persistence, notifications, history, and traceability are protected functional contracts.
- Real authenticated views use Supabase-backed services. `/sistema-visual/*` routes provide clearly labelled simulated data for safe visual review.
- Collaborators and Team Leaders can both own requests. Shared pages use role-aware presentation variants: preserve the approved Collaborator and Team Leader experiences while applying the Portfolio Manager redesign. Do not change production permissions, queries, mutations or business rules.
- Existing routes, deep links, navigation labels, form field meanings, and analytics-relevant behavior remain stable.

## Brand Commitments

- Product name: Early Fridays PMO.
- Preserve the existing light theme and its institutional navy, corporate blue, interactive blue, and identity cyan.
- Preserve the official logo and sidebar animation assets documented in `brand-spec.md`.
- The desired character is enterprise, modern, minimal, professional, vivid, interactive, and transparent, without neon styling or decorative excess.
- Interface language is Spanish, direct, functional, and sentence case.

## Evidence on Hand

- Brand and interface contract: `brand-spec.md`.
- Functional and design foundation: `EARLY_FRIDAY_PMO_PRODUCT_CONTEXT.md` and `EARLY_FRIDAY_PMO_DESIGN_FOUNDATION.md`.
- Real application routes, components, tests, Supabase services, and types in `src/`, `tests/`, and `supabase/`.
- Official identity media in `public/brand/`.
- No fabricated business metrics, approvals, or statuses may be introduced. Preview data must remain explicitly identified as simulated.

## Product Principles

1. Lead with the next useful action and the request state, not decorative metrics.
2. Explain responsibility and progress in plain language across every view.
3. Keep decision evidence and history available without overwhelming the primary task.
4. Preserve role boundaries and business rules while improving composition and usability.
5. Treat accessible, responsive, and honest states as core product behavior.

## Accessibility & Inclusion

The web experience must support keyboard navigation, visible focus, semantic headings and controls, labelled form fields, contextual errors, sufficient contrast, meaningful non-color status cues, practical 44 px targets, responsive reflow, and `prefers-reduced-motion`.
