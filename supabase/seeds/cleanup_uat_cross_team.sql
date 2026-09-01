-- Review the candidate rows first. This script defaults to ROLLBACK so it cannot
-- remove remote data accidentally. Replace the final ROLLBACK with COMMIT only
-- after a backup and approval from the data owner.
begin;

create temporary table uat_request_ids on commit drop as
select id
from public.early_friday_requests
where priority_explanation ->> 'source' = 'uat_cross_team';

select r.id, r.requested_date, r.status, p.full_name, t.name as team_name
from public.early_friday_requests r
join uat_request_ids u on u.id = r.id
join public.profiles p on p.id = r.requester_user_id
join public.teams t on t.id = r.team_id
order by r.requested_date, p.full_name;

delete from public.audit_logs where request_id in (select id from uat_request_ids);
delete from public.request_exceptions where request_id in (select id from uat_request_ids);
delete from public.notifications where request_id in (select id from uat_request_ids);
delete from public.rotation_history where request_id in (select id from uat_request_ids);
delete from public.request_approvals where request_id in (select id from uat_request_ids);
delete from public.early_friday_requests where id in (select id from uat_request_ids);

rollback;
