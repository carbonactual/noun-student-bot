-- Phase 2 economic access registry
-- Discovery/routing only. No lending, credit decisioning or money movement.

create table if not exists financial_access_products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  provider_name text not null,
  product_name text not null,
  product_type text not null check(product_type in ('student_loan','staff_loan','business_finance','grant','scholarship','device_fund','device_finance','bnpl','insurance','savings','payment_service','financial_literacy','p2p_interest','nano_banking_interest')),
  status text not null default 'unverified_discovery' check(status in ('verified_active','verified_upcoming','verified_closed','unverified_discovery','expired','contradicted')),
  target_segments text[] not null default '{}',
  eligibility_summary text,
  amount_min numeric,
  amount_max numeric,
  currency text default 'NGN',
  fee_summary text,
  repayment_summary text,
  application_url text,
  official_source_url text,
  regulator_name text,
  regulator_reference text,
  geography text,
  starts_at timestamptz,
  ends_at timestamptz,
  last_verified_at timestamptz,
  evidence text,
  disclosure_notes text,
  complaint_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists student_role_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  subject_id uuid,
  phone text,
  roles text[] not null default '{}',
  source text not null,
  consent_basis text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, phone)
);

create table if not exists economic_access_events (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references tenants(id) on delete restrict,
  subject_id uuid,
  phone text,
  product_id uuid references financial_access_products(id) on delete set null,
  event_type text not null check(event_type in ('viewed','asked','matched','routed','saved','withdrawn')),
  purpose text not null default 'service',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_fin_access_tenant_status on financial_access_products(tenant_id,status,product_type,last_verified_at desc);
create index if not exists idx_role_profiles_tenant_phone on student_role_profiles(tenant_id,phone);
create index if not exists idx_economic_events_tenant_time on economic_access_events(tenant_id,created_at desc);

alter table financial_access_products enable row level security;
alter table student_role_profiles enable row level security;
alter table economic_access_events enable row level security;

create policy financial_access_member_read on financial_access_products
for select to authenticated
using (public.current_tenant_id() = tenant_id);

create policy financial_access_admin_write on financial_access_products
for all to authenticated
using (public.has_tenant_role(tenant_id,array['support','institution_admin','platform_operator']))
with check (public.has_tenant_role(tenant_id,array['support','institution_admin','platform_operator']));

create policy role_profile_own_read on student_role_profiles
for select to authenticated
using (tenant_id = public.current_tenant_id() and subject_id = auth.uid());

create policy role_profile_own_write on student_role_profiles
for all to authenticated
using (tenant_id = public.current_tenant_id() and subject_id = auth.uid())
with check (tenant_id = public.current_tenant_id() and subject_id = auth.uid());

create policy economic_event_own_read on economic_access_events
for select to authenticated
using (tenant_id = public.current_tenant_id() and subject_id = auth.uid());

create policy economic_event_admin_read on economic_access_events
for select to authenticated
using (public.has_tenant_role(tenant_id,array['institution_admin','platform_operator']));

-- Server-side service-role ingestion is intentionally outside client RLS.
