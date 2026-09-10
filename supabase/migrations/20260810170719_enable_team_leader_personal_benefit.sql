-- Team leaders are benefit participants too. Their personal requests are already
-- routed directly to Portfolio by private.create_request_impl because they lead
-- the selected team; this backfill gives legacy leaders the active membership
-- required by eligibility, rotation and request-form validation.
insert into public.team_members (
  team_id,
  user_id,
  is_eligible,
  participates_in_rotation,
  valid_from
)
select
  t.id,
  t.leader_user_id,
  true,
  true,
  current_date
from public.teams t
where t.is_active
  and t.deleted_at is null
  and t.leader_user_id is not null
  and not exists (
    select 1
    from public.team_members tm
    where tm.user_id = t.leader_user_id
      and tm.valid_until is null
  );
