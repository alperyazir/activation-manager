-- 0005: Kredential adımını kaldır; kayıt form gönderiminde doğrudan 'Tamamlandı' olur.

-- redeem_code: kaydı artık doğrudan 'completed' oluşturur (Onay Bekliyor yok)
create or replace function public.redeem_code(
  p_code text,
  p_first_name text,
  p_last_name text,
  p_grade_id uuid,
  p_language_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := public.normalize_code(p_code);
  v_row  public.activation_codes%rowtype;
  v_eff  public.code_status;
  v_reg_id uuid;
  v_fn text := trim(coalesce(p_first_name, ''));
  v_ln text := trim(coalesce(p_last_name, ''));
begin
  if length(v_fn) < 1 or length(v_ln) < 1 then
    return jsonb_build_object('success', false, 'reason', 'invalid_name');
  end if;
  if not exists (select 1 from public.grades where id = p_grade_id and active) then
    return jsonb_build_object('success', false, 'reason', 'invalid_grade');
  end if;
  if not exists (select 1 from public.languages where id = p_language_id and active) then
    return jsonb_build_object('success', false, 'reason', 'invalid_language');
  end if;

  select * into v_row from public.activation_codes where code = v_code for update;
  if not found then
    return jsonb_build_object('success', false, 'reason', 'not_found');
  end if;

  v_eff := public.effective_code_status(v_row.status, v_row.expires_at);
  if v_eff <> 'active' then
    return jsonb_build_object('success', false, 'reason', v_eff::text);
  end if;

  insert into public.student_registrations
    (code_id, first_name, last_name, grade_id, language_id, status, completed_at)
  values
    (v_row.id, v_fn, v_ln, p_grade_id, p_language_id, 'completed', now())
  returning id into v_reg_id;

  update public.activation_codes
  set status = 'used', used_at = now()
  where id = v_row.id;

  return jsonb_build_object('success', true, 'reason', 'ok', 'registration_id', v_reg_id);
end;
$$;

-- Kredential fonksiyonunu kaldır
drop function if exists public.create_student_credentials(uuid, text, text);

-- Mevcut 'Onay Bekliyor' kayıtları da 'Tamamlandı' yap
update public.student_registrations
set status = 'completed', completed_at = coalesce(completed_at, registered_at)
where status = 'pending';

-- Kullanıcı adı / geçici şifre kolonlarını kaldır
alter table public.student_registrations
  drop column if exists username,
  drop column if exists temp_password_hash,
  drop column if exists completed_by;
