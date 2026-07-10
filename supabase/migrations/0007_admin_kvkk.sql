-- 0007: Çoklu admin yönetimi RPC'leri + KVKK (kayıt silme / retention)

-- ---------------------------------------------------------------------------
-- list_admins(): admin listesi + auth.users'dan e-posta (admin-only)
-- ---------------------------------------------------------------------------
create or replace function public.list_admins()
returns table (
  user_id uuid,
  full_name text,
  email text,
  active boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;
  return query
    select a.user_id, a.full_name, u.email::text, a.active, a.created_at
    from public.admins a
    join auth.users u on u.id = a.user_id
    order by a.created_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- set_admin_active(): admini pasif/aktif yap (kendini pasifleştiremez)
-- ---------------------------------------------------------------------------
create or replace function public.set_admin_active(
  p_user_id uuid,
  p_active boolean
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
  if p_user_id = auth.uid() then
    raise exception 'kendi hesabinizi pasiflestiremezsiniz';
  end if;

  update public.admins set active = p_active where user_id = p_user_id;

  perform public.log_admin_action(
    'set_admin_active', 'admin', p_user_id,
    jsonb_build_object('active', p_active)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- KVKK: delete_registration(): tek bir öğrenci kaydını siler (admin-only)
-- Denetim logunda kişisel veri tutulmaz; sadece kod referansı loglanır.
-- ---------------------------------------------------------------------------
create or replace function public.delete_registration(p_id uuid)
returns void
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

  select ac.code into v_code
  from public.student_registrations sr
  join public.activation_codes ac on ac.id = sr.code_id
  where sr.id = p_id;

  delete from public.student_registrations where id = p_id;

  perform public.log_admin_action(
    'delete_registration', 'student_registration', p_id,
    jsonb_build_object('code', v_code)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- KVKK: purge_registrations_older_than(): retention — N günden eski kayıtları siler
-- ---------------------------------------------------------------------------
create or replace function public.purge_registrations_older_than(p_days int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;
  if p_days is null or p_days < 1 then
    raise exception 'gecersiz gun sayisi';
  end if;

  with deleted as (
    delete from public.student_registrations
    where registered_at < now() - make_interval(days => p_days)
    returning 1
  )
  select count(*) into v_count from deleted;

  perform public.log_admin_action(
    'purge_registrations', 'student_registration', null,
    jsonb_build_object('older_than_days', p_days, 'deleted', v_count)
  );

  return v_count;
end;
$$;

-- Grant'lar (authenticated; içeride is_admin() kontrolü var)
revoke all on function public.list_admins() from anon;
revoke all on function public.set_admin_active(uuid, boolean) from anon;
revoke all on function public.delete_registration(uuid) from anon;
revoke all on function public.purge_registrations_older_than(int) from anon;

grant execute on function public.list_admins() to authenticated;
grant execute on function public.set_admin_active(uuid, boolean) to authenticated;
grant execute on function public.delete_registration(uuid) to authenticated;
grant execute on function public.purge_registrations_older_than(int) to authenticated;

-- student_registrations: admin silebilsin (RLS)
create policy student_registrations_admin_delete on public.student_registrations
  for delete to authenticated using (public.is_admin());
