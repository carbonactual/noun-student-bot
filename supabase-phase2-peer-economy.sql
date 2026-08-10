-- Phase 2 peer service economy
-- All tables are tenant-scoped and require explicit provider consent.

create table if not exists service_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(tenant_id,slug)
);

create table if not exists service_providers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  subject_id uuid not null,
  display_name text not null,
  business_name text,
  bio text,
  location_text text,
  remote_available boolean not null default false,
  verification_status text not null default 'unverified' check(verification_status in ('unverified','identity_verified','qualification_verified','institution_verified','suspended')),
  active boolean not null default true,
  contact_mode text not null default 'platform' check(contact_mode in ('platform','whatsapp','email','phone')),
  consented_to_discovery_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists service_provider_offerings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  provider_id uuid not null references service_providers(id) on delete cascade,
  category_id uuid not null references service_categories(id) on delete restrict,
  title text not null,
  description text not null,
  skills text[] not null default '{}',
  qualification_text text,
  service_area text,
  rate_text text,
  availability_text text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  requester_subject_id uuid,
  request_text text not null,
  category_id uuid references service_categories(id),
  location_text text,
  remote_ok boolean,
  status text not null default 'open' check(status in ('open','matched','contacted','fulfilled','cancelled','disputed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists service_matches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  request_id uuid not null references service_requests(id) on delete cascade,
  provider_id uuid not null references service_providers(id) on delete cascade,
  score numeric(6,3) not null,
  reasons jsonb not null default '[]',
  safety_flags jsonb not null default '[]',
  surfaced_at timestamptz not null default now(),
  requester_selected_at timestamptz,
  outcome text,
  unique(request_id,provider_id)
);

create index if not exists idx_service_providers_tenant on service_providers(tenant_id,active);
create index if not exists idx_service_offerings_tenant on service_provider_offerings(tenant_id,active);
create index if not exists idx_service_requests_tenant on service_requests(tenant_id,status,created_at desc);
create index if not exists idx_service_matches_request on service_matches(tenant_id,request_id,score desc);

alter table service_categories enable row level security;
alter table service_providers enable row level security;
alter table service_provider_offerings enable row level security;
alter table service_requests enable row level security;
alter table service_matches enable row level security;

-- Read access is intentionally limited. Provider profiles require tenant membership and active consent.
create policy service_categories_member_select on service_categories for select to authenticated
using (public.current_tenant_id() = tenant_id);

create policy service_providers_member_select on service_providers for select to authenticated
using (public.current_tenant_id() = tenant_id and active = true and withdrawn_at is null);

create policy service_providers_own_manage on service_providers for all to authenticated
using (public.current_tenant_id() = tenant_id and subject_id = auth.uid())
with check (public.current_tenant_id() = tenant_id and subject_id = auth.uid());

create policy service_offerings_member_select on service_provider_offerings for select to authenticated
using (public.current_tenant_id() = tenant_id and active = true);

create policy service_offerings_owner_manage on service_provider_offerings for all to authenticated
using (public.current_tenant_id() = tenant_id and provider_id in (select id from service_providers where subject_id=auth.uid() and tenant_id=service_provider_offerings.tenant_id))
with check (public.current_tenant_id() = tenant_id and provider_id in (select id from service_providers where subject_id=auth.uid() and tenant_id=service_provider_offerings.tenant_id));

create policy service_requests_member_insert on service_requests for insert to authenticated
with check (public.current_tenant_id() = tenant_id and requester_subject_id = auth.uid());
create policy service_requests_own_select on service_requests for select to authenticated
using (public.current_tenant_id() = tenant_id and requester_subject_id = auth.uid());

create policy service_matches_requester_select on service_matches for select to authenticated
using (public.current_tenant_id() = tenant_id and request_id in (select id from service_requests where requester_subject_id=auth.uid() and tenant_id=service_matches.tenant_id));
