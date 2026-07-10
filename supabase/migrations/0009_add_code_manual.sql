-- 0009: Elle tekil aktivasyon kodu ekleme (admin)

create or replace function public.add_activation_code(
  p_code text,
  p_expires_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := public.normalize_code(p_code);
begin
  if not public.is_admin() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;
  if v_code = '' or length(v_code) < 3 then
    return jsonb_build_object('success', false, 'reason', 'invalid_code');
  end if;

  begin
    insert into public.activation_codes (code, expires_at, created_by)
    values (v_code, p_expires_at, auth.uid());
  exception when unique_violation then
    return jsonb_build_object('success', false, 'reason', 'exists');
  end;

  perform public.log_admin_action(
    'add_code', 'activation_code', null,
    jsonb_build_object('code', v_code, 'expires_at', p_expires_at)
  );

  return jsonb_build_object('success', true, 'reason', 'ok', 'code', v_code);
end;
$$;

revoke all on function public.add_activation_code(text, timestamptz) from anon;
grant execute on function public.add_activation_code(text, timestamptz) to authenticated;
