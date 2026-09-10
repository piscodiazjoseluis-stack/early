create or replace function private.can_read_team_profile(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null then false
    when target_profile = (select auth.uid()) then true
    when private.has_role('ADMIN') or private.has_role('PORTFOLIO_MANAGER') then true
    else
      exists (
        select 1
        from public.team_members viewer
        join public.teams team on team.id = viewer.team_id
        where viewer.user_id = (select auth.uid())
          and viewer.valid_until is null
          and team.deleted_at is null
          and (
            team.leader_user_id = target_profile
            or exists (
              select 1
              from public.team_members subject
              where subject.team_id = viewer.team_id
                and subject.user_id = target_profile
                and subject.valid_until is null
            )
          )
      )
      or exists (
        select 1
        from public.teams led_team
        join public.team_members subject on subject.team_id = led_team.id
        where led_team.leader_user_id = (select auth.uid())
          and led_team.deleted_at is null
          and subject.user_id = target_profile
          and subject.valid_until is null
      )
  end
$$;

revoke all on function private.can_read_team_profile(uuid) from public, anon;
grant execute on function private.can_read_team_profile(uuid) to authenticated;

drop policy if exists profiles_read_authorized on public.profiles;
create policy profiles_read_authorized
on public.profiles for select
to authenticated
using ((select private.can_read_team_profile(id)));
