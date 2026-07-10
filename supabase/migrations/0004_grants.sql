-- 0004: Data API rol GRANT'ları
-- Yeni Supabase varsayılanı public tabloları anon/authenticated'a otomatik
-- GRANT'lamaz. RLS zaten satır bazında gating yapıyor; burada tablo
-- ayrıcalıklarını veriyoruz (aksi halde PostgREST 403 döner).

grant usage on schema public to anon, authenticated;

-- Public seçilebilir listeler: anon sadece okur
grant select on public.grades to anon;
grant select on public.languages to anon;

-- Admin işlemleri (satır erişimi RLS + is_admin() ile sınırlı)
grant select, insert, update, delete on public.grades to authenticated;
grant select, insert, update, delete on public.languages to authenticated;
grant select, insert, update, delete on public.activation_codes to authenticated;
grant select, insert, update, delete on public.code_batches to authenticated;
grant select, update on public.student_registrations to authenticated;
grant select on public.admins to authenticated;
grant select on public.admin_audit_log to authenticated;
