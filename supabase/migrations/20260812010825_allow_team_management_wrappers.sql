-- The private schema is not exposed by the Data API. Authenticated callers can
-- only reach these implementations through the role-checking public wrappers.
grant execute on function private.assign_or_move_team_member_impl(uuid, uuid, boolean, boolean) to authenticated;
grant execute on function private.configure_team_member_impl(uuid, boolean, boolean) to authenticated;
grant execute on function private.assign_team_leader_impl(uuid, uuid) to authenticated;
