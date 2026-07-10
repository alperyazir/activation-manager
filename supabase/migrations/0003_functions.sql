-- 0003: İş mantığı fonksiyonları (RPC)

-- ---------------------------------------------------------------------------
-- normalize_code(): kod girişini standartlaştır (büyük harf, boşluk temizle)
-- ---------------------------------------------------------------------------
create or replace function public.normalize_code(p_code text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
$$;

-- ---------------------------------------------------------------------------
-- check_code(): öğrenci akışı için kodu doğrula (tüketmeden). anon çağırır.
-- Kod detayını sızdırmaz; sadece geçerlilik + sebep döner.
-- ---------------------------------------------------------------------------
create or replace function public.check_code(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code   text := public.normalize_code(p_code);
  v_row    public.activation_codes%rowtype;
  v_eff    public.code_status;
begin
  select * into v_row from public.activation_codes where code = v_code;
  if not found then
    return jsonb_build_object('valid', false, 'reason', 'not_found');
  end if;

  v_eff := public.effective_code_status(v_row.status, v_row.expires_at);

  if v_eff = 'active' then
    return jsonb_build_object('valid', true, 'reason', 'ok');
  elsif v_eff = 'used' then
    return jsonb_build_object('valid', false, 'reason', 'used');
  elsif v_eff = 'expired' then
    return jsonb_build_object('valid', false, 'reason', 'expired');
  else
    return jsonb_build_object('valid', false, 'reason', 'passive');
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- redeem_code(): ATOMİK kod kilitleme + kayıt oluşturma. anon çağırır.
-- Kodu kilitli okur, yeniden doğrular, kayıt ekler, kodu 'used' yapar.
-- ---------------------------------------------------------------------------
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
  -- Girdi doğrulama
  if length(v_fn) < 1 or length(v_ln) < 1 then
    return jsonb_build_object('success', false, 'reason', 'invalid_name');
  end if;
  if not exists (select 1 from public.grades where id = p_grade_id and active) then
    return jsonb_build_object('success', false, 'reason', 'invalid_grade');
  end if;
  if not exists (select 1 from public.languages where id = p_language_id and active) then
    return jsonb_build_object('success', false, 'reason', 'invalid_language');
  end if;

  -- Kodu kilitle (yarış durumunu engeller)
  select * into v_row from public.activation_codes where code = v_code for update;
  if not found then
    return jsonb_build_object('success', false, 'reason', 'not_found');
  end if;

  v_eff := public.effective_code_status(v_row.status, v_row.expires_at);
  if v_eff <> 'active' then
    return jsonb_build_object('success', false, 'reason', v_eff::text);
  end if;

  -- Kaydı oluştur (Onay Bekliyor)
  insert into public.student_registrations
    (code_id, first_name, last_name, grade_id, language_id, status)
  values
    (v_row.id, v_fn, v_ln, p_grade_id, p_language_id, 'pending')
  returning id into v_reg_id;

  -- Kodu anında 'used' yap
  update public.activation_codes
  set status = 'used', used_at = now()
  where id = v_row.id;

  return jsonb_build_object('success', true, 'reason', 'ok', 'registration_id', v_reg_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- gen_code_string(): karışabilir karakter içermeyen kod üretir (VT-XXXX-XXXX)
-- ---------------------------------------------------------------------------
create or replace function public.gen_code_string()
returns text
language plpgsql
volatile
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- I,L,O,0,1 hariç
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    if i = 4 then
      result := result || '-';
    end if;
  end loop;
  return 'VT-' || result;
end;
$$;

-- ---------------------------------------------------------------------------
-- generate_codes(): admin — N tekil kod üretir, parti oluşturur. batch döner.
-- ---------------------------------------------------------------------------
create or replace function public.generate_codes(
  p_count int,
  p_expires_at timestamptz default null,
  p_label text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_id uuid;
  v_made int := 0;
  v_code text;
  v_attempts int;
begin
  if not public.is_admin() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;
  if p_count is null or p_count < 1 or p_count > 10000 then
    raise exception 'gecersiz adet (1-10000)';
  end if;

  insert into public.code_batches (label, quantity, expires_at, source, created_by)
  values (p_label, p_count, p_expires_at, 'generated', auth.uid())
  returning id into v_batch_id;

  while v_made < p_count loop
    v_attempts := 0;
    loop
      v_code := public.gen_code_string();
      begin
        insert into public.activation_codes (code, expires_at, batch_id, created_by)
        values (v_code, p_expires_at, v_batch_id, auth.uid());
        v_made := v_made + 1;
        exit;
      exception when unique_violation then
        v_attempts := v_attempts + 1;
        if v_attempts > 20 then
          raise exception 'benzersiz kod uretilemedi';
        end if;
      end;
    end loop;
  end loop;

  perform public.log_admin_action(
    'generate_codes', 'code_batch', v_batch_id,
    jsonb_build_object('count', p_count, 'expires_at', p_expires_at, 'label', p_label)
  );

  return v_batch_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- bulk_import_codes(): admin — dışarıdan gelen kod listesini içe aktarır.
-- Mevcut/çakışan kodları atlar. {imported, skipped} döner.
-- ---------------------------------------------------------------------------
create or replace function public.bulk_import_codes(
  p_codes text[],
  p_expires_at timestamptz default null,
  p_label text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_id uuid;
  v_code text;
  v_norm text;
  v_imported int := 0;
  v_skipped int := 0;
  v_seen text[] := array[]::text[];
begin
  if not public.is_admin() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;
  if p_codes is null or array_length(p_codes, 1) is null then
    raise exception 'kod listesi bos';
  end if;

  insert into public.code_batches (label, quantity, expires_at, source, created_by)
  values (coalesce(p_label, 'Import'), array_length(p_codes, 1), p_expires_at, 'imported', auth.uid())
  returning id into v_batch_id;

  foreach v_code in array p_codes loop
    v_norm := public.normalize_code(v_code);
    if v_norm = '' or v_norm = any(v_seen) then
      v_skipped := v_skipped + 1;
      continue;
    end if;
    v_seen := array_append(v_seen, v_norm);
    begin
      insert into public.activation_codes (code, expires_at, batch_id, created_by)
      values (v_norm, p_expires_at, v_batch_id, auth.uid());
      v_imported := v_imported + 1;
    exception when unique_violation then
      v_skipped := v_skipped + 1;
    end;
  end loop;

  perform public.log_admin_action(
    'bulk_import_codes', 'code_batch', v_batch_id,
    jsonb_build_object('imported', v_imported, 'skipped', v_skipped)
  );

  return jsonb_build_object('batch_id', v_batch_id, 'imported', v_imported, 'skipped', v_skipped);
end;
$$;

-- ---------------------------------------------------------------------------
-- set_code_status(): admin — kodu Aktif/Pasif yapar. Log tutar.
-- ---------------------------------------------------------------------------
create or replace function public.set_code_status(
  p_code_id uuid,
  p_status public.code_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;
  if p_status not in ('active', 'passive') then
    raise exception 'sadece active/passive ayarlanabilir';
  end if;

  update public.activation_codes
  set status = p_status
  where id = p_code_id and status in ('active', 'passive', 'expired');

  perform public.log_admin_action(
    'set_code_status', 'activation_code', p_code_id,
    jsonb_build_object('status', p_status)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- create_student_credentials(): admin — kullanıcı adı + geçici şifre tanımlar.
-- Şifre bcrypt ile hash'lenir; kayıt 'completed' olur. Log tutar.
-- ---------------------------------------------------------------------------
create or replace function public.create_student_credentials(
  p_registration_id uuid,
  p_username text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_username text := lower(trim(coalesce(p_username, '')));
  v_status public.registration_status;
begin
  if not public.is_admin() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;
  if length(v_username) < 3 then
    return jsonb_build_object('success', false, 'reason', 'invalid_username');
  end if;
  if length(coalesce(p_password, '')) < 6 then
    return jsonb_build_object('success', false, 'reason', 'weak_password');
  end if;

  select status into v_status from public.student_registrations where id = p_registration_id;
  if not found then
    return jsonb_build_object('success', false, 'reason', 'not_found');
  end if;
  if exists (select 1 from public.student_registrations where username = v_username and id <> p_registration_id) then
    return jsonb_build_object('success', false, 'reason', 'username_taken');
  end if;

  update public.student_registrations
  set username = v_username,
      temp_password_hash = extensions.crypt(p_password, extensions.gen_salt('bf')),
      status = 'completed',
      completed_at = now(),
      completed_by = auth.uid()
  where id = p_registration_id;

  perform public.log_admin_action(
    'create_student_credentials', 'student_registration', p_registration_id,
    jsonb_build_object('username', v_username)
  );

  return jsonb_build_object('success', true, 'reason', 'ok');
end;
$$;

-- ---------------------------------------------------------------------------
-- Grant'lar: anon sadece check_code + redeem_code çağırabilir.
-- Admin fonksiyonları yalnızca authenticated + içeride is_admin() kontrolü.
-- ---------------------------------------------------------------------------
revoke all on function public.generate_codes(int, timestamptz, text) from anon;
revoke all on function public.bulk_import_codes(text[], timestamptz, text) from anon;
revoke all on function public.set_code_status(uuid, public.code_status) from anon;
revoke all on function public.create_student_credentials(uuid, text, text) from anon;

grant execute on function public.check_code(text) to anon, authenticated;
grant execute on function public.redeem_code(text, text, text, uuid, uuid) to anon, authenticated;
