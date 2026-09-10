revoke all privileges on all tables in schema public from anon;
revoke all privileges on all sequences in schema public from anon;
revoke execute on all functions in schema public from anon;

revoke insert, update, delete on all tables in schema public from authenticated;

grant update (full_name, job_title, avatar_url, timezone, updated_at)
  on public.profiles to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant insert on public.ai_feedback to authenticated;
grant insert, update, delete on public.roles, public.user_roles, public.teams,
  public.team_members, public.early_friday_periods, public.availability_periods,
  public.blocked_dates, public.exception_types, public.system_settings to authenticated;

grant execute on function public.get_user_eligibility(uuid, date) to authenticated;
grant execute on function public.calculate_rotation_priority(uuid, date) to authenticated;
grant execute on function public.create_early_friday_request(date, time, time, text) to authenticated;
grant execute on function public.approve_request_as_team_leader(uuid) to authenticated;
grant execute on function public.approve_request_as_portfolio(uuid) to authenticated;
grant execute on function public.reject_request(uuid, text, text) to authenticated;
grant execute on function public.return_request_for_correction(uuid, text, text) to authenticated;
grant execute on function public.request_cancellation(uuid, text) to authenticated;
grant execute on function public.approve_cancellation(uuid) to authenticated;
grant execute on function public.confirm_early_friday_usage(uuid, public.usage_status, text) to authenticated;
grant execute on function public.create_request_exception(uuid, uuid, text, text, text) to authenticated;
