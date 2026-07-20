-- 0016: Şube (section) desteği
-- Sınıfın alt bölümü (A, B, C...). grades/languages ile aynı desende bir
-- seçilebilir liste. Öğrenci kaydına section_id eklenir; redeem_code güncellenir.

-- ---------------------------------------------------------------------------
-- Şubeler (seçilebilir liste) — admin panelinden yönetilir
-- ---------------------------------------------------------------------------
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Öğrenci kaydına şube (mevcut kayıtlar için nullable — yeni kayıtlarda
-- redeem_code zorunlu kılar)
alter table public.student_registrations
  add column section_id uuid references public.sections (id);

-- ---------------------------------------------------------------------------
-- RLS — grades/languages ile aynı: herkes AKTİF olanları okur, admin yazar
-- ---------------------------------------------------------------------------
alter table public.sections enable row level security;

create policy sections_public_read on public.sections
  for select to anon, authenticated using (active = true or public.is_admin());
create policy sections_admin_write on public.sections
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Data API GRANT'ları (RLS satır bazında gating yapıyor)
-- ---------------------------------------------------------------------------
grant select on public.sections to anon;
grant select, insert, update, delete on public.sections to authenticated;

-- ---------------------------------------------------------------------------
-- redeem_code(): p_section_id eklendi. İmza değiştiği için eski sürüm
-- (grant'larıyla birlikte) düşürülüp yeniden oluşturulur.
-- NOT: güncel davranış korunur — IP rate limit + kayıt doğrudan 'completed'.
-- ---------------------------------------------------------------------------
drop function if exists public.redeem_code(text, text, text, uuid, uuid) cascade;

create or replace function public.redeem_code(
  p_code text,
  p_first_name text,
  p_last_name text,
  p_grade_id uuid,
  p_language_id uuid,
  p_section_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := public.normalize_code(p_code);
  v_row  public.activation_codes%rowtype;
  v_eff  public.code_status;
  v_reg_id uuid;
  v_fn text := trim(coalesce(p_first_name, ''));
  v_ln text := trim(coalesce(p_last_name, ''));
begin
  if not public.check_rate_limit('redeem:' || public.client_ip(), 10, interval '1 minute') then
    return jsonb_build_object('success', false, 'reason', 'rate_limited');
  end if;

  -- Girdi doğrulama
  if length(v_fn) < 1 or length(v_ln) < 1 then
    return jsonb_build_object('success', false, 'reason', 'invalid_name');
  end if;
  if not exists (select 1 from public.grades where id = p_grade_id and active) then
    return jsonb_build_object('success', false, 'reason', 'invalid_grade');
  end if;
  if not exists (select 1 from public.languages where id = p_language_id and active) then
    return jsonb_build_object('success', false, 'reason', 'invalid_language');
  end if;
  if not exists (select 1 from public.sections where id = p_section_id and active) then
    return jsonb_build_object('success', false, 'reason', 'invalid_section');
  end if;

  -- Kodu kilitle (yarış durumunu engeller)
  select * into v_row from public.activation_codes where code = v_code for update;
  if not found then
    return jsonb_build_object('success', false, 'reason', 'not_found');
  end if;

  v_eff := public.effective_code_status(v_row.status, v_row.expires_at);
  if v_eff <> 'active' then
    return jsonb_build_object('success', false, 'reason', v_eff::text);
  end if;

  -- Kaydı doğrudan 'Tamamlandı' oluştur
  insert into public.student_registrations
    (code_id, first_name, last_name, grade_id, language_id, section_id, status, completed_at)
  values
    (v_row.id, v_fn, v_ln, p_grade_id, p_language_id, p_section_id, 'completed', now())
  returning id into v_reg_id;

  -- Kodu anında 'used' yap
  update public.activation_codes
  set status = 'used', used_at = now()
  where id = v_row.id;

  return jsonb_build_object('success', true, 'reason', 'ok', 'registration_id', v_reg_id);
end;
$$;

grant execute on function public.redeem_code(text, text, text, uuid, uuid, uuid) to anon, authenticated;
