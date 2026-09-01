create or replace function private.get_my_request_tracking_impl(target_request uuid default null)
returns table (
  request_id uuid,
  team_leader_name text,
  portfolio_manager_name text,
  approvals jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'Debe iniciar sesión' using errcode = 'P0001';
  end if;

  return query
  select
    r.id,
    leader.full_name,
    portfolio.full_name,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'level', approval.level,
            'decision', approval.decision,
            'comment', approval.comment,
            'decided_at', approval.decided_at,
            'approver_name', approver.full_name
          )
          order by approval.decided_at
        )
        from public.request_approvals approval
        join public.profiles approver on approver.id = approval.approver_user_id
        where approval.request_id = r.id
      ),
      '[]'::jsonb
    )
  from public.early_friday_requests r
  join public.teams team on team.id = r.team_id
  left join public.profiles leader on leader.id = team.leader_user_id
  left join lateral (
    select profile.full_name
    from public.user_roles user_role
    join public.roles role on role.id = user_role.role_id
    join public.profiles profile on profile.id = user_role.user_id
    where role.code = 'PORTFOLIO_MANAGER'
      and user_role.valid_from <= now()
      and (user_role.valid_until is null or user_role.valid_until > now())
      and profile.is_active
      and profile.deleted_at is null
    order by user_role.valid_from, profile.full_name
    limit 1
  ) portfolio on true
  where r.requester_user_id = actor
    and r.deleted_at is null
    and (target_request is null or r.id = target_request);
end
$$;

create or replace function public.get_my_request_tracking(target_request uuid default null)
returns table (
  request_id uuid,
  team_leader_name text,
  portfolio_manager_name text,
  approvals jsonb
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.get_my_request_tracking_impl(target_request)
$$;

create or replace function private.get_my_team_weekly_assignment_impl()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target_friday date;
  membership public.team_members%rowtype;
  assignment jsonb;
begin
  if actor is null then
    raise exception 'Debe iniciar sesión' using errcode = 'P0001';
  end if;

  target_friday := current_date + ((5 - extract(isodow from current_date)::integer + 7) % 7);

  select * into membership
  from public.team_members member
  where member.user_id = actor
    and member.valid_from <= target_friday
    and (member.valid_until is null or member.valid_until >= target_friday)
  order by member.valid_from desc
  limit 1;

  if membership.id is null then
    return jsonb_build_object('date', target_friday, 'assignment', null);
  end if;

  select jsonb_build_object(
    'request_id', request.id,
    'date', request.requested_date,
    'status', request.status,
    'person_name', requester.full_name,
    'person_job_title', requester.job_title,
    'person_avatar_url', requester.avatar_url,
    'approved_by_name', latest_approval.approver_name,
    'approved_at', latest_approval.decided_at
  ) into assignment
  from public.early_friday_requests request
  join public.profiles requester on requester.id = request.requester_user_id
  left join lateral (
    select approver.full_name as approver_name, approval.decided_at
    from public.request_approvals approval
    join public.profiles approver on approver.id = approval.approver_user_id
    where approval.request_id = request.id
      and approval.decision = 'APPROVED'
    order by approval.decided_at desc
    limit 1
  ) latest_approval on true
  where request.team_id = membership.team_id
    and request.requested_date = target_friday
    and request.status in ('FINAL_APPROVED', 'USED')
    and request.deleted_at is null
  order by request.updated_at desc
  limit 1;

  return jsonb_build_object('date', target_friday, 'assignment', assignment);
end
$$;

create or replace function public.get_my_team_weekly_assignment()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.get_my_team_weekly_assignment_impl()
$$;

revoke all on function private.get_my_request_tracking_impl(uuid) from public, anon;
grant execute on function private.get_my_request_tracking_impl(uuid) to authenticated;
revoke execute on function public.get_my_request_tracking(uuid) from public, anon;
grant execute on function public.get_my_request_tracking(uuid) to authenticated;

revoke all on function private.get_my_team_weekly_assignment_impl() from public, anon;
grant execute on function private.get_my_team_weekly_assignment_impl() to authenticated;
revoke execute on function public.get_my_team_weekly_assignment() from public, anon;
grant execute on function public.get_my_team_weekly_assignment() to authenticated;
