-- 0008: service_role (güvenilen backend / Edge Function) tam erişim
-- Yeni Supabase varsayılanı service_role'e de otomatik GRANT vermiyor.

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
