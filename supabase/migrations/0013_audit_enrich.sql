-- 0013: İşlem loglarını zenginleştir — kim/ne/hangi kod ayırt edilebilsin

-- Logları yapan yöneticinin e-postasıyla birlikte döndür (admin-only)
create or replace function public.list_audit_logs(p_limit int default 500)
returns table (
  id uuid,
  created_at timestamptz,
  action text,
  target_type text,
  target_id uuid,
  detail jsonb,
  admin_email text
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
    select l.id, l.created_at, l.action, l.target_type, l.target_id, l.detail,
           u.email::text
    from public.admin_audit_log l
    left join auth.users u on u.id = l.admin_id
    order by l.created_at desc
    limit p_limit;
end;
$$;
revoke all on function public.list_audit_logs(int) from anon;
grant execute on function public.list_audit_logs(int) to authenticated;

-- set_code_status: hangi kod olduğu logda görünsün (detail'e code eklendi)
create or replace function public.set_code_status(
  p_code_id uuid,
  p_status public.code_status
)
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
  if p_status not in ('active', 'passive') then
    raise exception 'sadece active/passive ayarlanabilir';
  end if;

  select code into v_code from public.activation_codes where id = p_code_id;

  update public.activation_codes
  set status = p_status
  where id = p_code_id and status in ('active', 'passive', 'expired');

  perform public.log_admin_action(
    'set_code_status', 'activation_code', p_code_id,
    jsonb_build_object('code', v_code, 'status', p_status)
  );
end;
$$;
revoke all on function public.set_code_status(uuid, public.code_status) from anon;

-- set_admin_active: hangi yönetici olduğu logda görünsün (detail'e email eklendi)
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
begin
  if not public.is_admin() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'kendi hesabinizi pasiflestiremezsiniz';
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
