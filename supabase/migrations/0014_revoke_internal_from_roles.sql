-- 0014: Internal helper fonksiyonlarını anon/authenticated'tan da REVOKE et.
-- Supabase Cloud, public şemadaki fonksiyonlara anon/authenticated'e default
-- privileges ile EXECUTE veriyor; 0010'daki "revoke from public" bu explicit
-- grant'ı kaldırmıyordu. Bu fonksiyonlar yalnızca SECURITY DEFINER fonksiyonların
-- İÇİNDEN (owner=postgres) çağrılır; caller'ın çalıştırmasına gerek yok.

revoke execute on function public.log_admin_action(text, text, uuid, jsonb) from anon, authenticated;
revoke execute on function public.check_rate_limit(text, int, interval) from anon, authenticated;
revoke execute on function public.client_ip() from anon, authenticated;
revoke execute on function public.gen_code_string() from anon, authenticated;
revoke execute on function public.normalize_code(text) from anon, authenticated;
revoke execute on function public.effective_code_status(public.code_status, timestamptz) from anon, authenticated;

-- is_admin() RLS politikaları için anon+authenticated'te KALMALI (0010'da grant edildi).
