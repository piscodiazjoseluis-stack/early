-- Keep the same ADMIN and PORTFOLIO_MANAGER authorization while evaluating a
-- single permissive policy per operation.
drop policy if exists teams_admin_insert on public.teams;
drop policy if exists teams_portfolio_insert on public.teams;
drop policy if exists teams_admin_update on public.teams;
drop policy if exists teams_portfolio_update on public.teams;

create policy teams_management_insert
on public.teams
for insert
to authenticated
with check (
  (select private.has_role('ADMIN'::public.app_role))
  or (select private.has_role('PORTFOLIO_MANAGER'::public.app_role))
);

create policy teams_management_update
on public.teams
for update
to authenticated
using (
  (select private.has_role('ADMIN'::public.app_role))
  or (select private.has_role('PORTFOLIO_MANAGER'::public.app_role))
)
with check (
  (select private.has_role('ADMIN'::public.app_role))
  or (select private.has_role('PORTFOLIO_MANAGER'::public.app_role))
);
