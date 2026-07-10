-- 0011: Aktivasyon kodu silme (admin). Kullanılmış kodlar silinemez
-- (öğrenci kaydına bağlı — KVKK verisi; FK zaten engeller).

create or replace function public.delete_activation_code(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.is_admin() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;

  if exists (select 1 from public.student_registrations where code_id = p_id) then
    return jsonb_build_object('success', false, 'reason', 'in_use');
  end if;

  select code into v_code from public.activation_codes where id = p_id;
  if not found then
    return jsonb_build_object('success', false, 'reason', 'not_found');
  end if;

  delete from public.activation_codes where id = p_id;

  perform public.log_admin_action(
    'delete_code', 'activation_code', p_id, jsonb_build_object('code', v_code)
  );

  return jsonb_build_object('success', true, 'reason', 'ok');
end;
$$;

revoke all on function public.delete_activation_code(uuid) from anon;
grant execute on function public.delete_activation_code(uuid) to authenticated;
