alter function public.assign_or_move_team_member(uuid, uuid, boolean, boolean) set schema private;
alter function private.assign_or_move_team_member(uuid, uuid, boolean, boolean) rename to assign_or_move_team_member_impl;

create function public.assign_or_move_team_member(
  target_team uuid,
  target_user uuid,
  eligible boolean default true,
  joins_rotation boolean default true
)
returns public.team_members
language sql
security invoker
set search_path = ''
as $$
  select private.assign_or_move_team_member_impl(target_team, target_user, eligible, joins_rotation)
$$;

alter function public.configure_team_member(uuid, boolean, boolean) set schema private;
alter function private.configure_team_member(uuid, boolean, boolean) rename to configure_team_member_impl;

create function public.configure_team_member(
  target_membership uuid,
  eligible boolean,
  joins_rotation boolean
)
returns public.team_members
language sql
security invoker
set search_path = ''
as $$
  select private.configure_team_member_impl(target_membership, eligible, joins_rotation)
$$;

alter function public.assign_team_leader(uuid, uuid) set schema private;
alter function private.assign_team_leader(uuid, uuid) rename to assign_team_leader_impl;

create function public.assign_team_leader(target_team uuid, target_user uuid)
returns public.teams
language sql
security invoker
set search_path = ''
as $$
  select private.assign_team_leader_impl(target_team, target_user)
$$;

revoke all on function private.assign_or_move_team_member_impl(uuid, uuid, boolean, boolean) from public, anon, authenticated;
revoke all on function private.configure_team_member_impl(uuid, boolean, boolean) from public, anon, authenticated;
revoke all on function private.assign_team_leader_impl(uuid, uuid) from public, anon, authenticated;
revoke all on function public.assign_or_move_team_member(uuid, uuid, boolean, boolean) from public, anon;
revoke all on function public.configure_team_member(uuid, boolean, boolean) from public, anon;
revoke all on function public.assign_team_leader(uuid, uuid) from public, anon;
grant execute on function public.assign_or_move_team_member(uuid, uuid, boolean, boolean) to authenticated;
grant execute on function public.configure_team_member(uuid, boolean, boolean) to authenticated;
grant execute on function public.assign_team_leader(uuid, uuid) to authenticated;
