-- 0010: Güvenlik sıkılaştırma (review bulguları)

-- ---------------------------------------------------------------------------
-- 1) Internal helper fonksiyonları anon/PUBLIC'ten kaldır.
--    Bunlar yalnızca SECURITY DEFINER fonksiyonların İÇİNDEN (owner=postgres
--    olarak) çağrılır; caller'ın doğrudan çağırmasına gerek yok.
--    Aksi halde anon 'log_admin_action' ile sahte audit kaydı ekleyebiliyor,
--    'check_rate_limit' ile rate_limit_hits'i şişirebiliyordu.
-- ---------------------------------------------------------------------------
revoke execute on function public.log_admin_action(text, text, uuid, jsonb) from public;
revoke execute on function public.check_rate_limit(text, int, interval) from public;
revoke execute on function public.client_ip() from public;
revoke execute on function public.gen_code_string() from public;
revoke execute on function public.normalize_code(text) from public;
revoke execute on function public.effective_code_status(public.code_status, timestamptz) from public;

-- is_admin(): RLS politikaları anon+authenticated için bunu değerlendirir
-- (grades/languages public read, admin tabloları). Kendi durumunu döner,
-- veri sızmaz — açık şekilde bu iki role veriyoruz.
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) Kodları kriptografik olarak güvenli üret (random() yerine gen_random_bytes)
-- ---------------------------------------------------------------------------
create or replace function public.gen_code_string()
returns text
language plpgsql
volatile
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- I,L,O,0,1 hariç
  alen int := length(alphabet);
  bytes bytea := extensions.gen_random_bytes(8);
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, 1 + (get_byte(bytes, i - 1) % alen), 1);
    if i = 4 then
      result := result || '-';
    end if;
  end loop;
  return 'VT-' || result;
end;
$$;
revoke execute on function public.gen_code_string() from public;

-- ---------------------------------------------------------------------------
-- 3) client_ip(): X-Forwarded-For'un SON değerini al (güvenilir gateway'in
--    eklediği gerçek istemci IP'si). İlk değer istemci tarafından sahte
--    gönderilebiliyordu. (Tek güvenilir proxy — Supabase gateway — varsayımı.)
-- ---------------------------------------------------------------------------
create or replace function public.client_ip()
returns text
language plpgsql
stable
as $$
declare
  h text;
  j json;
  parts text[];
  ip text;
begin
  h := current_setting('request.headers', true);
  if h is null or h = '' then
    return 'unknown';
  end if;
  j := h::json;
  ip := coalesce(j ->> 'x-forwarded-for', '');
  if ip <> '' then
    parts := string_to_array(ip, ',');
    return trim(parts[array_length(parts, 1)]);
  end if;
  ip := coalesce(j ->> 'x-real-ip', '');
  if ip = '' then
    return 'unknown';
  end if;
  return trim(ip);
end;
$$;
revoke execute on function public.client_ip() from public;
