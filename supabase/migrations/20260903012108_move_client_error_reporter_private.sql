alter function public.report_client_error(text, text, text, text, jsonb)
  set schema private;
alter function private.report_client_error(text, text, text, text, jsonb)
  rename to report_client_error_impl;

revoke all on function private.report_client_error_impl(text, text, text, text, jsonb)
  from public, anon;
grant execute on function private.report_client_error_impl(text, text, text, text, jsonb)
  to authenticated;

create function public.report_client_error(
  error_source text,
  error_message text,
  error_route text,
  app_release text default null,
  error_metadata jsonb default '{}'::jsonb
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.report_client_error_impl(
    error_source,
    error_message,
    error_route,
    app_release,
    error_metadata
  )
$$;

revoke all on function public.report_client_error(text, text, text, text, jsonb)
  from public, anon;
grant execute on function public.report_client_error(text, text, text, text, jsonb)
  to authenticated;
