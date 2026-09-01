create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  collaborator_role_id uuid;
begin
  insert into public.profiles (id, full_name, job_title, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Usuario Early Fridays'
    ),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'job_title'), ''),
      'Pendiente de asignación'
    ),
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '')
  )
  on conflict (id) do nothing;

  select id into collaborator_role_id
  from public.roles
  where code = 'COLLABORATOR';

  if collaborator_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, collaborator_role_id)
    on conflict do nothing;
  end if;

  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
grant execute on function private.handle_new_auth_user() to supabase_auth_admin;
