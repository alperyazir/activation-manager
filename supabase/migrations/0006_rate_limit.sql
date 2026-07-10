-- 0006: Kod doğrulama/kullanma için IP tabanlı rate limit (brute-force koruması)

create table if not exists public.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limit_hits_bucket_time_idx
  on public.rate_limit_hits (bucket, created_at);

-- Doğrudan erişim yok (yalnızca SECURITY DEFINER fonksiyonlar)
alter table public.rate_limit_hits enable row level security;

-- İstemci IP'sini PostgREST request header'larından çıkarır
create or replace function public.client_ip()
returns text
language plpgsql
stable
as $$
declare
  h text;
  j json;
  ip text;
begin
  h := current_setting('request.headers', true);
  if h is null or h = '' then
    return 'unknown';
  end if;
  j := h::json;
  ip := trim(split_part(coalesce(j ->> 'x-forwarded-for', ''), ',', 1));
  if ip = '' then
    ip := coalesce(j ->> 'x-real-ip', '');
  end if;
  if ip = '' then
    return 'unknown';
  end if;
  return ip;
end;
$$;

-- Bucket için pencere içindeki denemeyi sayar; sınır aşılmadıysa true döner.
create or replace function public.check_rate_limit(
  p_bucket text,
  p_max int,
  p_window interval
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cnt int;
begin
  -- eski kayıtları temizle (bucket bazında, tabloyu küçük tut)
  delete from public.rate_limit_hits
  where bucket = p_bucket and created_at < now() - interval '10 minutes';

  insert into public.rate_limit_hits (bucket) values (p_bucket);

  select count(*) into cnt
  from public.rate_limit_hits
  where bucket = p_bucket and created_at > now() - p_window;

  return cnt <= p_max;
end;
$$;

-- check_code: dakikada 20 deneme / IP
-- NOT: VOLATILE olmalı — rate limit INSERT/DELETE yapar; STABLE olsaydı
-- PostgREST salt-okunur transaction'da çalıştırıp yazmayı engellerdi.
create or replace function public.check_code(p_code text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_code text := public.normalize_code(p_code);
  v_row  public.activation_codes%rowtype;
  v_eff  public.code_status;
begin
  if not public.check_rate_limit('check:' || public.client_ip(), 20, interval '1 minute') then
    return jsonb_build_object('valid', false, 'reason', 'rate_limited');
  end if;

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

-- redeem_code: dakikada 10 deneme / IP (rate limit eklendi, gerisi aynı)
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
  if not public.check_rate_limit('redeem:' || public.client_ip(), 10, interval '1 minute') then
    return jsonb_build_object('success', false, 'reason', 'rate_limited');
  end if;

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
