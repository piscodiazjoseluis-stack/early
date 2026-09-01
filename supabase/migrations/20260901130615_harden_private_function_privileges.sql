-- Production hardening: functions are denied by default and only the
-- application RPC surface plus the RLS helpers receive explicit execution.
revoke execute on all functions in schema private from public, anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

grant usage on schema private to authenticated;

-- Helpers evaluated by RLS policies.
grant execute on function private.current_user_id() to authenticated;
grant execute on function private.has_role(public.app_role, uuid) to authenticated;
grant execute on function private.leads_team(uuid, uuid) to authenticated;
grant execute on function private.is_team_member(uuid, uuid) to authenticated;
grant execute on function private.can_read_team_profile(uuid) to authenticated;

-- Private implementations reached only through the public, role-aware RPCs.
grant execute on function private.get_user_eligibility_impl(uuid, date) to authenticated;
grant execute on function private.calculate_rotation_priority_impl(uuid, date) to authenticated;
grant execute on function private.get_request_form_context_impl(date, time) to authenticated;
grant execute on function private.create_request_impl(date, time, time, text) to authenticated;
grant execute on function private.resubmit_returned_request_impl(uuid, date, time, time, text) to authenticated;
grant execute on function private.approve_team_leader_impl(uuid) to authenticated;
grant execute on function private.approve_portfolio_impl(uuid) to authenticated;
grant execute on function private.reject_request_impl(uuid, text, text) to authenticated;
grant execute on function private.return_for_correction_impl(uuid, text, text) to authenticated;
grant execute on function private.request_cancellation_impl(uuid, text) to authenticated;
grant execute on function private.approve_cancellation_impl(uuid) to authenticated;
grant execute on function private.confirm_usage_impl(uuid, public.usage_status, text) to authenticated;
grant execute on function private.create_exception_impl(uuid, uuid, text, text, text) to authenticated;
grant execute on function private.get_my_request_tracking_impl(uuid) to authenticated;
grant execute on function private.get_my_team_weekly_assignment_impl() to authenticated;
grant execute on function private.assign_or_move_team_member_impl(uuid, uuid, boolean, boolean) to authenticated;
grant execute on function private.configure_team_member_impl(uuid, boolean, boolean) to authenticated;
grant execute on function private.assign_team_leader_impl(uuid, uuid) to authenticated;

-- Auth trigger: never callable by application sessions.
grant execute on function private.handle_new_auth_user() to supabase_auth_admin;

-- Stable public RPC contract used by the web client.
grant execute on function public.get_user_eligibility(uuid, date) to authenticated;
grant execute on function public.calculate_rotation_priority(uuid, date) to authenticated;
grant execute on function public.get_request_form_context(date, time) to authenticated;
grant execute on function public.create_early_friday_request(date, time, time, text) to authenticated;
grant execute on function public.create_early_friday_departure_request(date, time, text) to authenticated;
grant execute on function public.resubmit_returned_request(uuid, date, time, time, text) to authenticated;
grant execute on function public.resubmit_returned_departure_request(uuid, date, time, text) to authenticated;
grant execute on function public.approve_request_as_team_leader(uuid) to authenticated;
grant execute on function public.approve_request_as_portfolio(uuid) to authenticated;
grant execute on function public.reject_request(uuid, text, text) to authenticated;
grant execute on function public.return_request_for_correction(uuid, text, text) to authenticated;
grant execute on function public.request_cancellation(uuid, text) to authenticated;
grant execute on function public.approve_cancellation(uuid) to authenticated;
grant execute on function public.confirm_early_friday_usage(uuid, public.usage_status, text) to authenticated;
grant execute on function public.create_request_exception(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.get_my_request_tracking(uuid) to authenticated;
grant execute on function public.get_my_team_weekly_assignment() to authenticated;
grant execute on function public.assign_or_move_team_member(uuid, uuid, boolean, boolean) to authenticated;
grant execute on function public.configure_team_member(uuid, boolean, boolean) to authenticated;
grant execute on function public.assign_team_leader(uuid, uuid) to authenticated;
