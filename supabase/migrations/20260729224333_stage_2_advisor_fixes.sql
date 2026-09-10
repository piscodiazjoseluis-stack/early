create or replace function private.current_user_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select auth.uid()
$$;

create index ai_feedback_user_id_idx on public.ai_feedback (user_id);
create index ai_recommendations_generated_by_idx on public.ai_recommendations (generated_by);
create index ai_recommendations_team_id_idx on public.ai_recommendations (team_id);
create index availability_created_by_idx on public.availability_periods (created_by);
create index blocked_dates_created_by_idx on public.blocked_dates (created_by);
create index periods_created_by_idx on public.early_friday_periods (created_by);
create index requests_period_id_idx on public.early_friday_requests (period_id);
create index notifications_request_id_idx on public.notifications (request_id);
create index approvals_approver_idx on public.request_approvals (approver_user_id);
create index approvals_requester_idx on public.request_approvals (requester_user_id);
create index exceptions_authorized_by_idx on public.request_exceptions (authorized_by);
create index exceptions_type_idx on public.request_exceptions (exception_type_id);
create index exceptions_request_idx on public.request_exceptions (request_id);
create index rotation_confirmed_by_idx on public.rotation_history (confirmed_by);
create index settings_updated_by_idx on public.system_settings (updated_by);
create index memberships_assigned_by_idx on public.team_members (assigned_by);
create index teams_leader_idx on public.teams (leader_user_id);
create index user_roles_assigned_by_idx on public.user_roles (assigned_by);
create index user_roles_role_id_idx on public.user_roles (role_id);

drop policy roles_manage_admin on public.roles;
drop policy user_roles_manage_admin on public.user_roles;
drop policy teams_manage_admin on public.teams;
drop policy memberships_manage_admin on public.team_members;
drop policy periods_manage_admin on public.early_friday_periods;
drop policy blocked_dates_manage_admin on public.blocked_dates;
drop policy exception_types_manage_admin on public.exception_types;
drop policy settings_manage_admin on public.system_settings;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'roles', 'user_roles', 'teams', 'team_members',
    'early_friday_periods', 'blocked_dates', 'exception_types', 'system_settings'
  ]
  loop
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (private.has_role(''ADMIN''))',
      target_table || '_admin_insert', target_table
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (private.has_role(''ADMIN'')) with check (private.has_role(''ADMIN''))',
      target_table || '_admin_update', target_table
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (private.has_role(''ADMIN''))',
      target_table || '_admin_delete', target_table
    );
  end loop;
end
$$;
