-- QA regression: keep the 500-character limit consistent between the client,
-- request creation and resubmission. No historical records are rewritten.
-- Applying this migration to production requires a separately approved release.
do $patch$
declare
  definition text := pg_get_functiondef('private.create_request_impl(date,time without time zone,time without time zone,text)'::regprocedure);
  anchor text := 'if extract(isodow from target_date) <> 5 or target_date <= current_date then';
begin
  if position('El comentario no puede superar 500 caracteres' in definition) > 0 then
    return;
  end if;
  if position(anchor in definition) = 0 then
    raise exception 'Unexpected request creation function; review before applying the validation patch';
  end if;
  execute replace(definition, anchor, E'if request_reason is not null and length(request_reason) > 500 then\n    raise exception ''El comentario no puede superar 500 caracteres'' using errcode = ''P0001'';\n  end if;\n\n  ' || anchor);
end
$patch$;
