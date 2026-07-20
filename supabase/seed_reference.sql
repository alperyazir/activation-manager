-- Production referans verisi — sınıf/dil listeleri.
-- Supabase Cloud'da SQL Editor'de bir kez çalıştırın (idempotent).
-- NOT: local seed.sql'deki demo admin BURADA YOK — prod admini elle bootstrap edilir
-- (bkz. docs/DEPLOY.md → "İlk yöneticiyi oluştur").

insert into public.grades (name, sort_order) values
  ('Hazırlık', 0),
  ('1. Sınıf', 1),
  ('2. Sınıf', 2),
  ('3. Sınıf', 3),
  ('4. Sınıf', 4),
  ('5. Sınıf', 5),
  ('6. Sınıf', 6),
  ('7. Sınıf', 7),
  ('8. Sınıf', 8),
  ('9. Sınıf', 9),
  ('10. Sınıf', 10),
  ('11. Sınıf', 11),
  ('12. Sınıf', 12)
on conflict (name) do nothing;

insert into public.languages (name, sort_order) values
  ('İngilizce', 1),
  ('Almanca', 2),
  ('Fransızca', 3),
  ('İspanyolca', 4)
on conflict (name) do nothing;

insert into public.sections (name, sort_order) values
  ('A', 1),
  ('B', 2),
  ('C', 3),
  ('D', 4),
  ('E', 5),
  ('F', 6)
on conflict (name) do nothing;
