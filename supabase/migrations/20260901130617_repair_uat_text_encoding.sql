-- Idempotent repair for text decoded as Latin-1 before being stored as UTF-8.
-- Exact malformed sequences are replaced; correctly encoded text is unchanged.
create function private.repair_spanish_mojibake(value text)
returns text
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select replace(replace(replace(replace(replace(replace(
    replace(replace(replace(replace(replace(replace(
      replace(replace(replace(value,
        'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'), 'Ã±', 'ñ'),
        'Ã', 'Á'), 'Ã‰', 'É'), 'Ã', 'Í'), 'Ã“', 'Ó'), 'Ãš', 'Ú'), 'Ã‘', 'Ñ'),
        'Â¿', '¿'), 'Â¡', '¡'), 'â€“', '–')
$$;

update public.early_friday_requests
set
  reason = private.repair_spanish_mojibake(reason),
  cancellation_reason = private.repair_spanish_mojibake(cancellation_reason),
  priority_explanation = private.repair_spanish_mojibake(priority_explanation::text)::jsonb
where coalesce(reason, '') ~ 'Ã|Â|â€“'
   or coalesce(cancellation_reason, '') ~ 'Ã|Â|â€“'
   or priority_explanation::text ~ 'Ã|Â|â€“';

-- Approval decisions remain immutable for application traffic. The trigger is
-- disabled only inside this migration transaction so legacy text can be
-- repaired without changing the decision, approver, level or timestamp.
alter table public.request_approvals disable trigger approvals_immutable;

update public.request_approvals
set
  reason_code = private.repair_spanish_mojibake(reason_code),
  comment = private.repair_spanish_mojibake(comment),
  metadata = private.repair_spanish_mojibake(metadata::text)::jsonb
where coalesce(reason_code, '') ~ 'Ã|Â|â€“'
   or coalesce(comment, '') ~ 'Ã|Â|â€“'
   or metadata::text ~ 'Ã|Â|â€“';

alter table public.request_approvals enable trigger approvals_immutable;

update public.notifications
set title = private.repair_spanish_mojibake(title), body = private.repair_spanish_mojibake(body)
where title ~ 'Ã|Â|â€“' or body ~ 'Ã|Â|â€“';

update public.rotation_history
set notes = private.repair_spanish_mojibake(notes)
where coalesce(notes, '') ~ 'Ã|Â|â€“';

update public.availability_periods
set reason_summary = private.repair_spanish_mojibake(reason_summary)
where coalesce(reason_summary, '') ~ 'Ã|Â|â€“';

update public.blocked_dates
set
  title = private.repair_spanish_mojibake(title),
  description = private.repair_spanish_mojibake(description)
where title ~ 'Ã|Â|â€“' or coalesce(description, '') ~ 'Ã|Â|â€“';

update public.request_exceptions
set
  violated_rule = private.repair_spanish_mojibake(violated_rule),
  justification = private.repair_spanish_mojibake(justification)
where violated_rule ~ 'Ã|Â|â€“' or justification ~ 'Ã|Â|â€“';

update public.audit_logs
set
  old_data = case when old_data is null then null else private.repair_spanish_mojibake(old_data::text)::jsonb end,
  new_data = case when new_data is null then null else private.repair_spanish_mojibake(new_data::text)::jsonb end
where coalesce(old_data::text, '') ~ 'Ã|Â|â€“'
   or coalesce(new_data::text, '') ~ 'Ã|Â|â€“';

drop function private.repair_spanish_mojibake(text);
