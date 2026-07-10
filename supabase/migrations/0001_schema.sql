-- Voca Tooki — Aktivasyon & Öğrenci Kayıt Sistemi
-- 0001: Şema (tablolar, enum'lar, indeksler)

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enum'lar
-- ---------------------------------------------------------------------------
create type public.code_status as enum ('active', 'used', 'passive', 'expired');
create type public.registration_status as enum ('pending', 'completed');

-- ---------------------------------------------------------------------------
-- Admin kullanıcıları (auth.users ile eşleşir) — çoklu admin
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Seçilebilir listeler (serbest metin yok) — admin panelinden yönetilir
-- ---------------------------------------------------------------------------
create table public.grades (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.languages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Kod üretim partileri
-- ---------------------------------------------------------------------------
create table public.code_batches (
  id uuid primary key default gen_random_uuid(),
  label text,
  quantity int not null check (quantity > 0),
  expires_at timestamptz,
  source text not null default 'generated' check (source in ('generated', 'imported')),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Aktivasyon kodları (tek kullanımlık)
-- ---------------------------------------------------------------------------
create table public.activation_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status public.code_status not null default 'active',
  expires_at timestamptz,
  batch_id uuid references public.code_batches (id) on delete set null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index activation_codes_status_idx on public.activation_codes (status);
create index activation_codes_batch_idx on public.activation_codes (batch_id);

-- ---------------------------------------------------------------------------
-- Öğrenci kayıtları
-- ---------------------------------------------------------------------------
create table public.student_registrations (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null unique references public.activation_codes (id),
  first_name text not null,
  last_name text not null,
  grade_id uuid not null references public.grades (id),
  language_id uuid not null references public.languages (id),
  status public.registration_status not null default 'pending',
  username text unique,
  temp_password_hash text,
  registered_at timestamptz not null default now(),
  completed_at timestamptz,
  completed_by uuid references auth.users (id)
);

create index student_registrations_status_idx on public.student_registrations (status);
create index student_registrations_registered_at_idx on public.student_registrations (registered_at);

-- ---------------------------------------------------------------------------
-- Admin işlem logu (append-only)
-- ---------------------------------------------------------------------------
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users (id),
  action text not null,
  target_type text,
  target_id uuid,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);
