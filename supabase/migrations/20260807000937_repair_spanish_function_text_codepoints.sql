do $$
declare
  affected_function record;
  definition text;
begin
  for affected_function in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('private', 'public')
      and p.prosrc like '%' || chr(195) || '%'
  loop
    definition := pg_get_functiondef(affected_function.oid);
    definition := replace(definition, chr(195) || chr(161), chr(225));
    definition := replace(definition, chr(195) || chr(169), chr(233));
    definition := replace(definition, chr(195) || chr(173), chr(237));
    definition := replace(definition, chr(195) || chr(179), chr(243));
    execute definition;
  end loop;
end
$$;
