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
      and p.prosrc like '%Ã%'
  loop
    definition := pg_get_functiondef(affected_function.oid);
    definition := replace(definition, 'Ã¡', 'á');
    definition := replace(definition, 'Ã©', 'é');
    definition := replace(definition, 'Ã­', 'í');
    definition := replace(definition, 'Ã³', 'ó');
    execute definition;
  end loop;
end
$$;
