-- 0012: Aktivasyon kodları için toplu işlemler (admin)

-- Toplu aktif/pasif — güncellenen adet döner
create or replace function public.bulk_set_code_status(
  p_ids uuid[],
  p_status public.code_status
)
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
  if p_status not in ('active', 'passive') then
    raise exception 'sadece active/passive';
  end if;

  update public.activation_codes
  set status = p_status
  where id = any(p_ids) and status in ('active', 'passive');
  get diagnostics v_count = row_count;

  perform public.log_admin_action(
    'bulk_set_code_status', 'activation_code', null,
    jsonb_build_object('status', p_status, 'count', v_count)
  );
  return v_count;
end;
$$;

-- Toplu silme — kullanılmış (kayda bağlı) kodlar atlanır. {deleted, skipped} döner
create or replace function public.bulk_delete_codes(p_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int;
  v_requested int := coalesce(array_length(p_ids, 1), 0);
begin
  if not public.is_admin() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;

  with del as (
    delete from public.activation_codes ac
    where ac.id = any(p_ids)
      and not exists (
        select 1 from public.student_registrations sr where sr.code_id = ac.id
      )
    returning 1
  )
  select count(*) into v_deleted from del;

  perform public.log_admin_action(
    'bulk_delete_codes', 'activation_code', null,
    jsonb_build_object('deleted', v_deleted, 'skipped', v_requested - v_deleted)
  );
  return jsonb_build_object('deleted', v_deleted, 'skipped', v_requested - v_deleted);
end;
$$;

revoke all on function public.bulk_set_code_status(uuid[], public.code_status) from anon;
revoke all on function public.bulk_delete_codes(uuid[]) from anon;
grant execute on function public.bulk_set_code_status(uuid[], public.code_status) to authenticated;
grant execute on function public.bulk_delete_codes(uuid[]) to authenticated;
