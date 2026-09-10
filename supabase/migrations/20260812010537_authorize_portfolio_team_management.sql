create policy teams_portfolio_insert on public.teams
for insert to authenticated
with check (private.has_role('PORTFOLIO_MANAGER'));

create policy teams_portfolio_update on public.teams
for update to authenticated
using (private.has_role('PORTFOLIO_MANAGER'))
with check (private.has_role('PORTFOLIO_MANAGER'));

create or replace function public.assign_or_move_team_member(
  target_team uuid,
  target_user uuid,
  eligible boolean default true,
  joins_rotation boolean default true
)
returns public.team_members
language plpgsql
security definer
set search_path = ''
as $$
declare new_membership public.team_members;
begin
  if not (private.has_role('ADMIN') or private.has_role('PORTFOLIO_MANAGER')) then
    raise exception 'Requiere rol Administrador o Portfolio Manager.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.teams t where t.id = target_team and t.is_active and t.deleted_at is null) then
    raise exception 'El equipo indicado no está activo.' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.profiles p where p.id = target_user and p.is_active and p.deleted_at is null) then
    raise exception 'El usuario indicado no está activo.' using errcode = 'P0002';
  end if;
  update public.team_members
  set valid_until = current_date - 1, updated_at = now()
  where user_id = target_user and valid_until is null and team_id <> target_team;
  select tm.* into new_membership
  from public.team_members tm
  where tm.user_id = target_user and tm.team_id = target_team and tm.valid_until is null
  for update;
  if found then
    update public.team_members
    set is_eligible = eligible, participates_in_rotation = joins_rotation,
        assigned_by = auth.uid(), updated_at = now()
    where id = new_membership.id returning * into new_membership;
  else
    insert into public.team_members (
      team_id, user_id, is_eligible, participates_in_rotation, assigned_by
    ) values (
      target_team, target_user, eligible, joins_rotation, auth.uid()
    ) returning * into new_membership;
  end if;
  return new_membership;
end
$$;

create or replace function public.configure_team_member(
  target_membership uuid,
  eligible boolean,
  joins_rotation boolean
)
returns public.team_members
language plpgsql
security definer
set search_path = ''
as $$
declare updated_membership public.team_members;
begin
  if not (private.has_role('ADMIN') or private.has_role('PORTFOLIO_MANAGER')) then
    raise exception 'Requiere rol Administrador o Portfolio Manager.' using errcode = '42501';
  end if;
  update public.team_members
  set is_eligible = eligible, participates_in_rotation = joins_rotation,
      assigned_by = auth.uid(), updated_at = now()
  where id = target_membership and valid_until is null
  returning * into updated_membership;
  if updated_membership.id is null then
    raise exception 'No se encontró una membresía activa.' using errcode = 'P0002';
  end if;
  return updated_membership;
end
$$;

create or replace function public.assign_team_leader(target_team uuid, target_user uuid)
returns public.teams
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_team public.teams;
  leader_role uuid;
begin
  if not (private.has_role('ADMIN') or private.has_role('PORTFOLIO_MANAGER')) then
    raise exception 'Requiere rol Administrador o Portfolio Manager.' using errcode = '42501';
  end if;
  perform public.assign_or_move_team_member(target_team, target_user, true, true);
  update public.teams
  set leader_user_id = target_user, updated_at = now()
  where id = target_team and is_active and deleted_at is null
  returning * into updated_team;
  if updated_team.id is null then raise exception 'No se encontró un equipo activo.' using errcode = 'P0002'; end if;
  select r.id into leader_role from public.roles r where r.code = 'TEAM_LEADER';
  if not exists (
    select 1 from public.user_roles ur
    where ur.user_id = target_user and ur.role_id = leader_role
      and ur.valid_from <= now() and (ur.valid_until is null or ur.valid_until > now())
  ) then
    insert into public.user_roles (user_id, role_id, assigned_by)
    values (target_user, leader_role, auth.uid());
  end if;
  return updated_team;
end
$$;

revoke all on function public.assign_or_move_team_member(uuid, uuid, boolean, boolean) from public, anon;
revoke all on function public.configure_team_member(uuid, boolean, boolean) from public, anon;
revoke all on function public.assign_team_leader(uuid, uuid) from public, anon;
grant execute on function public.assign_or_move_team_member(uuid, uuid, boolean, boolean) to authenticated;
grant execute on function public.configure_team_member(uuid, boolean, boolean) to authenticated;
grant execute on function public.assign_team_leader(uuid, uuid) to authenticated;
