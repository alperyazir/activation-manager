-- Seed: sınıf/dil listeleri + yerel demo admin
-- NOT: demo admin sadece yerel geliştirme içindir. Prod'da kullanmayın.

-- Sınıflar
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

-- Diller
insert into public.languages (name, sort_order) values
  ('İngilizce', 1),
  ('Almanca', 2),
  ('Fransızca', 3),
  ('İspanyolca', 4)
on conflict (name) do nothing;

-- Şubeler
insert into public.sections (name, sort_order) values
  ('A', 1),
  ('B', 2),
  ('C', 3),
  ('D', 4),
  ('E', 5),
  ('F', 6)
on conflict (name) do nothing;

-- Yerel demo admin: admin@vocatooki.test / Admin123!
do $$
declare
  v_id uuid := gen_random_uuid();
begin
  if not exists (select 1 from auth.users where email = 'admin@vocatooki.test') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
      -- gotrue bu token kolonlarını NULL değil boş string bekler
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'admin@vocatooki.test', extensions.crypt('Admin123!', extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Voca Admin"}'::jsonb, false, false,
      '', '', '', '', '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', 'admin@vocatooki.test'),
      'email', now(), now(), now()
    );

    insert into public.admins (user_id, full_name) values (v_id, 'Voca Admin');
  end if;
end $$;
