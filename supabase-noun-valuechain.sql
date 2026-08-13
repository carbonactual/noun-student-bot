-- NOUN adapter layer. Does not redefine Core marketplace/commerce primitives.

create table if not exists noun_student_roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  phone text not null,
  role_type text not null check(role_type in ('student','staff','entrepreneur','employee','freelancer','service_provider','opportunity_seeker','business_owner')),
  active boolean not null default true,
  source text not null default 'student_declared',
  consent_id uuid references core_consents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id,phone,role_type)
);

create table if not exists noun_provider_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  phone text not null,
  core_entity_id uuid not null references core_entities(id) on delete restrict,
  discovery_consent boolean not null default false,
  verification_level text not null default 'unverified',
  business_name text,
  location_text text,
  remote_available boolean not null default false,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id,phone)
);

create table if not exists noun_domain_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  domain_type text not null,
  domain_id uuid not null,
  core_type text not null,
  core_id uuid not null,
  relation_type text not null,
  created_at timestamptz not null default now(),
  unique(tenant_id,domain_type,domain_id,core_type,core_id,relation_type)
);

create table if not exists noun_financial_access_refs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  product_name text not null,
  product_type text not null,
  provider_name text not null,
  source_url text not null,
  authority_class text not null,
  verification_status text not null default 'pending',
  eligibility jsonb not null default '{}',
  terms jsonb not null default '{}',
  last_verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_noun_student_roles_tenant_phone on noun_student_roles(tenant_id,phone,active);
create index if not exists idx_noun_provider_profiles_discovery on noun_provider_profiles(tenant_id,discovery_consent,active);
create index if not exists idx_noun_domain_links_core on noun_domain_links(tenant_id,core_type,core_id);
create index if not exists idx_noun_fin_access_status on noun_financial_access_refs(tenant_id,verification_status,last_verified_at desc);

alter table noun_student_roles enable row level security;
alter table noun_provider_profiles enable row level security;
alter table noun_domain_links enable row level security;
alter table noun_financial_access_refs enable row level security;

create policy noun_student_roles_select on noun_student_roles for select to authenticated using(public.current_tenant_id()=tenant_id);
create policy noun_provider_profiles_select on noun_provider_profiles for select to authenticated using(public.current_tenant_id()=tenant_id and discovery_consent=true and active=true);
create policy noun_domain_links_select on noun_domain_links for select to authenticated using(public.current_tenant_id()=tenant_id);
create policy noun_financial_access_refs_select on noun_financial_access_refs for select to authenticated using(public.current_tenant_id()=tenant_id and verification_status='verified');
