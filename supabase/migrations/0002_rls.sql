-- 0002: Yardımcı fonksiyonlar + Row Level Security

-- ---------------------------------------------------------------------------
-- is_admin(): çağıran kullanıcı aktif bir admin mi?
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where user_id = auth.uid() and active = true
  );
$$;

-- ---------------------------------------------------------------------------
-- log_admin_action(): audit loguna append (fonksiyonlar içinden çağrılır)
-- ---------------------------------------------------------------------------
create or replace function public.log_admin_action(
  p_action text,
  p_target_type text default null,
  p_target_id uuid default null,
  p_detail jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, detail)
  values (auth.uid(), p_action, p_target_type, p_target_id, p_detail);
$$;

-- ---------------------------------------------------------------------------
-- effective_code_status(): süresi geçmiş 'active' kodları anlık 'expired' göster
-- ---------------------------------------------------------------------------
create or replace function public.effective_code_status(
  p_status public.code_status,
  p_expires_at timestamptz
)
returns public.code_status
language sql
immutable
as $$
  select case
    when p_status = 'active' and p_expires_at is not null and p_expires_at < now()
      then 'expired'::public.code_status
    else p_status
  end;
$$;

-- ===========================================================================
-- RLS
-- ===========================================================================
alter table public.admins enable row level security;
alter table public.grades enable row level security;
alter table public.languages enable row level security;
alter table public.code_batches enable row level security;
alter table public.activation_codes enable row level security;
alter table public.student_registrations enable row level security;
alter table public.admin_audit_log enable row level security;

-- admins: sadece adminler okur
create policy admins_select on public.admins
  for select to authenticated using (public.is_admin());

-- grades / languages: herkes AKTİF olanları okuyabilir (public form dropdown'ları)
create policy grades_public_read on public.grades
  for select to anon, authenticated using (active = true or public.is_admin());
create policy grades_admin_write on public.grades
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy languages_public_read on public.languages
  for select to anon, authenticated using (active = true or public.is_admin());
create policy languages_admin_write on public.languages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- code_batches: sadece admin
create policy code_batches_admin on public.code_batches
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- activation_codes: sadece admin (öğrenci erişimi SECURITY DEFINER RPC üzerinden)
create policy activation_codes_admin on public.activation_codes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- student_registrations: admin okur/günceller (insert redeem_code RPC ile)
create policy student_registrations_admin_read on public.student_registrations
  for select to authenticated using (public.is_admin());
create policy student_registrations_admin_update on public.student_registrations
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- admin_audit_log: sadece admin okur; UPDATE/DELETE politikası YOK (append-only)
create policy admin_audit_log_admin_read on public.admin_audit_log
  for select to authenticated using (public.is_admin());
