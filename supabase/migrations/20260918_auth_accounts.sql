-- Account identity layer for NOUN BOT + CIBN BOT.
-- Passwords are owned by Supabase Auth and are never stored in application tables.

alter table if exists public.students add column if not exists auth_user_id uuid;
alter table if exists public.students add column if not exists school_email text;
create unique index if not exists students_auth_user_id_uidx on public.students(auth_user_id) where auth_user_id is not null;
create unique index if not exists students_matric_number_uidx on public.students(lower(matric_number)) where matric_number is not null;

create table if not exists public.app_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  product text not null check(product in ('noun','cibn')),
  full_name text not null,
  email text not null,
  phone text not null,
  matric_number text,
  school_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(auth_user_id, product)
);

create index if not exists app_accounts_product_idx on public.app_accounts(product);
create index if not exists app_accounts_email_idx on public.app_accounts(lower(email));
create index if not exists app_accounts_phone_idx on public.app_accounts(phone);

alter table public.app_accounts enable row level security;
drop policy if exists app_accounts_self_read on public.app_accounts;
create policy app_accounts_self_read on public.app_accounts
  for select to authenticated
  using (auth_user_id = auth.uid());
