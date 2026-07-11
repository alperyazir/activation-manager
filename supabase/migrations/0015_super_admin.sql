-- 0015: Baş yönetici (super admin) kavramı
-- Sadece baş yönetici Yöneticiler sayfasını görebilir, yeni yönetici oluşturabilir
-- ve diğer yöneticileri aktif/pasif yapabilir. Sıradan yöneticiler bu sayfayı
-- hiç göremez ve yönetici RPC'lerini çağıramaz.

-- ---------------------------------------------------------------------------
-- Kolon: super_admin
-- ---------------------------------------------------------------------------
alter table public.admins
  add column if not exists super_admin boolean not null default false;

-- Bootstrap: baş yönetici = alper.yazir@dreameducation hesabı.
-- E-postayı auth.users üzerinden eşle (TLD'den bağımsız olması için LIKE).
update public.admins a
set super_admin = true
from auth.users u
where u.id = a.user_id
  and lower(u.email) like 'alper.yazir@dreameducation%';

-- Yalnızca o hesap baş yönetici olsun — yanlışlıkla işaretlenmiş başka hesap varsa geri al.
update public.admins
set super_admin = false
where super_admin = true
  and user_id not in (
    select a.user_id
    from public.admins a
    join auth.users u on u.id = a.user_id
    where lower(u.email) like 'alper.yazir@dreameducation%'
  );

-- Güvenlik ağı: hedef hesap bulunamadıysa (hiç baş yönetici kalmadıysa) en eski
-- yöneticiyi ata — böylece Yöneticiler yönetimi asla tamamen kilitlenmez.
update public.admins
set super_admin = true
where user_id = (select user_id from public.admins order by created_at asc limit 1)
  and not exists (select 1 from public.admins where super_admin = true);

-- ---------------------------------------------------------------------------
-- is_super_admin(): çağıran aktif bir baş yönetici mi?
-- ---------------------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where user_id = auth.uid() and active = true and super_admin = true
  );
$$;
revoke execute on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- list_admins(): sadece baş yönetici — super_admin alanı da döner
-- (dönüş imzası değiştiği için önce drop gerekli)
-- ---------------------------------------------------------------------------
drop function if exists public.list_admins();
create function public.list_admins()
returns table (
  user_id uuid,
  full_name text,
  email text,
  active boolean,
  super_admin boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;
  return query
    select a.user_id, a.full_name, u.email::text, a.active, a.super_admin, a.created_at
    from public.admins a
    join auth.users u on u.id = a.user_id
    order by a.created_at;
end;
$$;
revoke all on function public.list_admins() from anon;
grant execute on function public.list_admins() to authenticated;

-- ---------------------------------------------------------------------------
-- set_admin_active(): sadece baş yönetici; baş yönetici pasifleştirilemez
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
declare
  v_email text;
  v_is_super boolean;
begin
  if not public.is_super_admin() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'kendi hesabinizi pasiflestiremezsiniz';
  end if;

  select super_admin into v_is_super from public.admins where user_id = p_user_id;
  if v_is_super then
    raise exception 'bas yonetici pasiflestirilemez';
  end if;

  update public.admins set active = p_active where user_id = p_user_id;
  select email into v_email from auth.users where id = p_user_id;

  perform public.log_admin_action(
    'set_admin_active', 'admin', p_user_id,
    jsonb_build_object('email', v_email, 'active', p_active)
  );
end;
$$;
revoke all on function public.set_admin_active(uuid, boolean) from anon;
grant execute on function public.set_admin_active(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: sıradan yönetici yalnızca KENDİ satırını okuyabilir (AuthContext için
-- gerekli). Tüm yönetici listesini yalnızca baş yönetici okuyabilir. Böylece
-- UI gizli olsa bile sıradan yönetici doğrudan tabloyu sorgulayıp diğerlerini
-- göremez.
-- ---------------------------------------------------------------------------
drop policy if exists admins_select on public.admins;
create policy admins_select on public.admins
  for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());
