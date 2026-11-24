-- Functional decision 2026-10-17: Portfolio manages people, roles and settings.
-- Keep the legacy technical ADMIN enum for compatibility, without creating
-- another functional profile, assigning roles or rewriting existing users.
do $patch$
declare
  signature text;
  definition text;
  old_guard text := 'if auth.uid() is null or not private.has_role(''ADMIN''::public.app_role, auth.uid()) then';
  new_guard text := 'if auth.uid() is null or not (private.has_role(''PORTFOLIO_MANAGER''::public.app_role, auth.uid()) or private.has_role(''ADMIN''::public.app_role, auth.uid())) then';
begin
  foreach signature in array array[
    'private.admin_update_profile_impl(uuid,text,text,boolean)',
    'private.admin_assign_role_impl(uuid,public.app_role)',
    'private.admin_update_setting_impl(text,jsonb)'
  ] loop
    definition := pg_get_functiondef(signature::regprocedure);
    if position(new_guard in definition) > 0 then continue; end if;
    if position(old_guard in definition) = 0 then
      raise exception 'Unexpected administrative function %. Review before applying.', signature;
    end if;
    definition := replace(definition, old_guard, new_guard);
    definition := replace(definition, 'Requiere rol Administrador', 'Requiere permisos de Portfolio Manager');
    if signature = 'private.admin_assign_role_impl(uuid,public.app_role)' then
      definition := replace(definition,
        'if target_user = auth.uid() and target_role <> ''ADMIN'' then',
        'if private.has_role(''PORTFOLIO_MANAGER''::public.app_role, auth.uid()) and target_role = ''ADMIN'' then
    raise exception ''ADMIN no es un perfil funcional asignable por Portfolio'' using errcode = ''42501'';
  end if;
  if target_user = auth.uid() and not private.has_role(target_role, auth.uid()) then');
      definition := replace(definition, 'No puede retirar su propio rol Administrador', 'No puede retirar su propio permiso administrativo');
    end if;
    execute definition;
  end loop;
end
$patch$;
