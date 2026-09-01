alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.early_friday_periods enable row level security;
alter table public.early_friday_requests enable row level security;
alter table public.request_approvals enable row level security;
alter table public.rotation_history enable row level security;
alter table public.availability_periods enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.exception_types enable row level security;
alter table public.request_exceptions enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.ai_feedback enable row level security;

grant usage on schema public to authenticated;
grant select on public.roles, public.teams, public.early_friday_periods,
  public.blocked_dates, public.exception_types to authenticated;
grant select on public.profiles, public.user_roles, public.team_members,
  public.early_friday_requests, public.request_approvals, public.rotation_history,
  public.availability_periods, public.request_exceptions, public.notifications,
  public.system_settings, public.ai_recommendations, public.ai_feedback to authenticated;
grant update (full_name, job_title, avatar_url, timezone, updated_at)
  on public.profiles to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant insert on public.ai_feedback to authenticated;
grant insert, update, delete on public.roles, public.user_roles, public.teams,
  public.team_members, public.early_friday_periods, public.availability_periods,
  public.blocked_dates, public.exception_types, public.system_settings to authenticated;

create policy profiles_read_authorized
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or private.has_role('ADMIN')
  or private.has_role('PORTFOLIO_MANAGER')
  or exists (
    select 1
    from public.team_members viewer
    join public.team_members subject on subject.team_id = viewer.team_id
    where viewer.user_id = (select auth.uid())
      and subject.user_id = profiles.id
      and viewer.valid_until is null
      and subject.valid_until is null
  )
);

create policy profiles_update_own
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy roles_read_authenticated
on public.roles for select to authenticated using (true);
create policy roles_manage_admin
on public.roles for all to authenticated
using (private.has_role('ADMIN'))
with check (private.has_role('ADMIN'));

create policy user_roles_read_relevant
on public.user_roles for select to authenticated
using (
  user_id = (select auth.uid())
  or private.has_role('ADMIN')
  or private.has_role('PORTFOLIO_MANAGER')
);
create policy user_roles_manage_admin
on public.user_roles for all to authenticated
using (private.has_role('ADMIN'))
with check (private.has_role('ADMIN'));

create policy teams_read_authenticated
on public.teams for select to authenticated
using (deleted_at is null);
create policy teams_manage_admin
on public.teams for all to authenticated
using (private.has_role('ADMIN'))
with check (private.has_role('ADMIN'));

create policy memberships_read_relevant
on public.team_members for select to authenticated
using (
  user_id = (select auth.uid())
  or private.is_team_member(team_id)
  or private.leads_team(team_id)
  or private.has_role('ADMIN')
  or private.has_role('PORTFOLIO_MANAGER')
);
create policy memberships_manage_admin
on public.team_members for all to authenticated
using (private.has_role('ADMIN'))
with check (private.has_role('ADMIN'));

create policy periods_read_authenticated
on public.early_friday_periods for select to authenticated using (true);
create policy periods_manage_admin
on public.early_friday_periods for all to authenticated
using (private.has_role('ADMIN'))
with check (private.has_role('ADMIN'));

create policy requests_read_authorized
on public.early_friday_requests for select to authenticated
using (
  requester_user_id = (select auth.uid())
  or private.leads_team(team_id)
  or private.has_role('PORTFOLIO_MANAGER')
  or private.has_role('ADMIN')
);

create policy approvals_read_authorized
on public.request_approvals for select to authenticated
using (
  requester_user_id = (select auth.uid())
  or approver_user_id = (select auth.uid())
  or exists (
    select 1 from public.early_friday_requests r
    where r.id = request_approvals.request_id
      and (
        private.leads_team(r.team_id)
        or private.has_role('PORTFOLIO_MANAGER')
        or private.has_role('ADMIN')
      )
  )
);

create policy rotation_read_authorized
on public.rotation_history for select to authenticated
using (
  user_id = (select auth.uid())
  or private.leads_team(team_id)
  or private.has_role('PORTFOLIO_MANAGER')
  or private.has_role('ADMIN')
);

create policy availability_read_authorized
on public.availability_periods for select to authenticated
using (
  user_id = (select auth.uid())
  or private.has_role('ADMIN')
  or private.has_role('PORTFOLIO_MANAGER')
  or exists (
    select 1 from public.team_members tm
    where tm.user_id = availability_periods.user_id
      and tm.valid_until is null
      and private.leads_team(tm.team_id)
  )
);
create policy availability_insert_own_or_admin
on public.availability_periods for insert to authenticated
with check (
  (user_id = (select auth.uid()) and created_by = (select auth.uid()))
  or private.has_role('ADMIN')
);
create policy availability_update_own_or_admin
on public.availability_periods for update to authenticated
using (user_id = (select auth.uid()) or private.has_role('ADMIN'))
with check (user_id = (select auth.uid()) or private.has_role('ADMIN'));
create policy availability_delete_admin
on public.availability_periods for delete to authenticated
using (private.has_role('ADMIN'));

create policy blocked_dates_read_authenticated
on public.blocked_dates for select to authenticated using (deleted_at is null);
create policy blocked_dates_manage_admin
on public.blocked_dates for all to authenticated
using (private.has_role('ADMIN'))
with check (private.has_role('ADMIN'));

create policy exception_types_read_authenticated
on public.exception_types for select to authenticated using (is_active);
create policy exception_types_manage_admin
on public.exception_types for all to authenticated
using (private.has_role('ADMIN'))
with check (private.has_role('ADMIN'));

create policy request_exceptions_read_authorized
on public.request_exceptions for select to authenticated
using (
  exists (
    select 1 from public.early_friday_requests r
    where r.id = request_exceptions.request_id
      and (
        r.requester_user_id = (select auth.uid())
        or private.leads_team(r.team_id)
        or private.has_role('PORTFOLIO_MANAGER')
        or private.has_role('ADMIN')
      )
  )
);

create policy notifications_read_own
on public.notifications for select to authenticated
using (user_id = (select auth.uid()));
create policy notifications_update_own
on public.notifications for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy audit_read_privileged
on public.audit_logs for select to authenticated
using (private.has_role('ADMIN') or private.has_role('PORTFOLIO_MANAGER'));

create policy settings_read_authorized
on public.system_settings for select to authenticated
using (is_public or private.has_role('ADMIN') or private.has_role('PORTFOLIO_MANAGER'));
create policy settings_manage_admin
on public.system_settings for all to authenticated
using (private.has_role('ADMIN'))
with check (private.has_role('ADMIN'));

create policy ai_recommendations_read_authorized
on public.ai_recommendations for select to authenticated
using (
  (scope = 'TEAM' and private.leads_team(team_id))
  or (scope = 'GLOBAL' and private.has_role('PORTFOLIO_MANAGER'))
  or private.has_role('ADMIN')
);

create policy ai_feedback_read_own_or_privileged
on public.ai_feedback for select to authenticated
using (
  user_id = (select auth.uid())
  or private.has_role('PORTFOLIO_MANAGER')
  or private.has_role('ADMIN')
);
create policy ai_feedback_insert_own
on public.ai_feedback for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.ai_recommendations ar
    where ar.id = ai_feedback.recommendation_id
      and (
        (ar.scope = 'TEAM' and private.leads_team(ar.team_id))
        or (ar.scope = 'GLOBAL' and private.has_role('PORTFOLIO_MANAGER'))
      )
  )
);

create view public.team_rotation_summary
with (security_invoker = true)
as
select
  tm.team_id,
  tm.user_id,
  p.full_name,
  count(rh.id) filter (where rh.usage = 'USED') as total_used,
  max(rh.benefit_date) filter (where rh.usage = 'USED') as last_used_date,
  count(rh.id) filter (where rh.usage = 'NOT_USED') as total_not_used
from public.team_members tm
join public.profiles p on p.id = tm.user_id
left join public.rotation_history rh on rh.user_id = tm.user_id
where tm.valid_until is null
group by tm.team_id, tm.user_id, p.full_name;

create view public.request_analytics
with (security_invoker = true)
as
select
  r.team_id,
  date_trunc('month', r.requested_date)::date as month,
  count(*) as total_requests,
  count(*) filter (where r.status in ('FINAL_APPROVED', 'USED', 'NOT_USED')) as approved_requests,
  count(*) filter (where r.status in ('REJECTED_BY_TEAM_LEADER', 'REJECTED_BY_PORTFOLIO')) as rejected_requests,
  count(*) filter (where r.status = 'EXPIRED') as expired_requests,
  count(*) filter (where r.status = 'USED') as used_benefits,
  avg(extract(epoch from (r.final_decided_at - r.submitted_at)) / 3600)
    filter (where r.final_decided_at is not null) as average_approval_hours
from public.early_friday_requests r
where r.deleted_at is null
group by r.team_id, date_trunc('month', r.requested_date);

grant select on public.team_rotation_summary, public.request_analytics to authenticated;

insert into public.roles (code, display_name, description) values
  ('COLLABORATOR', 'Colaborador', 'Solicita y consulta sus Early Fridays.'),
  ('TEAM_LEADER', 'Jefe directo', 'Gestiona solicitudes y analítica de sus equipos.'),
  ('PORTFOLIO_MANAGER', 'Portfolio Manager', 'Realiza aprobación final y consulta alcance global.'),
  ('ADMIN', 'Administrador', 'Administra configuración sin obtener permisos de aprobación.');

insert into public.teams (code, name, description) values
  ('TEAM_ELENA_CHIPANA', 'Team Elena Chipana', 'Equipo dirigido inicialmente por Elena Chipana.'),
  ('TEAM_CAROL_FLORES', 'Team Carol Flores', 'Equipo dirigido inicialmente por Carol Flores Espinoza.'),
  ('TEAM_HUGO_RAMIREZ', 'Team Hugo Ramirez', 'Equipo dirigido inicialmente por Hugo Ramirez.');

insert into public.early_friday_periods (
  name, starts_on, ends_on, default_start_time, default_end_time, is_active
) values (
  'Periodo inicial 2026', date '2026-01-01', date '2026-12-31',
  time '13:00', time '15:30', true
);

insert into public.exception_types (code, name, description, requires_evidence) values
  ('ROTATION_OVERRIDE', 'Excepción de rotación', 'Autoriza una desviación justificada de la rotación equitativa.', false),
  ('BLOCKED_DATE_OVERRIDE', 'Excepción de fecha bloqueada', 'Autoriza excepcionalmente una fecha normalmente bloqueada.', true),
  ('TEAM_CAPACITY_OVERRIDE', 'Excepción de cupo de equipo', 'Documenta una decisión excepcional sobre el cupo semanal.', true),
  ('ELIGIBILITY_OVERRIDE', 'Excepción de elegibilidad', 'Autoriza una excepción temporal de elegibilidad.', true);

insert into public.system_settings (key, value, description, is_public) values
  ('request_rules', '{"only_fridays": true, "one_active_per_person": true, "one_final_per_team": true}'::jsonb,
   'Reglas principales de creación y aprobación.', true),
  ('rotation_weights', '{"never_used": 40, "over_four_weeks": 30, "below_average": 20, "used_previous_week": -50, "future_approval": -30}'::jsonb,
   'Pesos determinísticos iniciales para la prioridad de rotación.', false),
  ('cancellation_policy', '{"before_final_approval": "allowed", "after_final_approval": "requires_portfolio_authorization"}'::jsonb,
   'Política inicial de cancelaciones.', true);

revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;
