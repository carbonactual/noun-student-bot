-- PHASE 2: NOUN DOMAIN + FINANCIAL ACCESS INTELLIGENCE
-- Discovery/intelligence only. No lending, wallet, settlement or money movement.

create table if not exists academic_levels (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete restrict,
  code text not null, name text not null, ordinal int, created_at timestamptz not null default now(), unique(tenant_id,code)
);
create table if not exists qualifications (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete restrict,
  code text, name text not null, level_type text not null, description text, created_at timestamptz not null default now(), unique(tenant_id,name)
);
create table if not exists programmes (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete restrict,
  department_id uuid, qualification_id uuid references qualifications(id) on delete set null, code text, name text not null,
  mode text, status text not null default 'active', source_id uuid, created_at timestamptz not null default now()
);
create table if not exists academic_requirements (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete restrict,
  programme_id uuid references programmes(id) on delete cascade, requirement_type text not null, title text not null,
  description text, source_id uuid, effective_from date, effective_to date, created_at timestamptz not null default now()
);
create table if not exists academic_events (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete restrict,
  event_type text not null, title text not null, start_at timestamptz, end_at timestamptz, level text, course_code text,
  location text, source_id uuid, status text not null default 'verified', created_at timestamptz not null default now()
);
create table if not exists assessments (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete restrict,
  course_code text not null, assessment_type text not null, title text, due_at timestamptz, term text, source_id uuid,
  status text not null default 'verified', created_at timestamptz not null default now()
);
create table if not exists human_contacts (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete restrict,
  name text not null, role text, faculty text, department text, phone text, email text, channel text,
  source_id uuid, verified_at timestamptz, status text not null default 'verified', created_at timestamptz not null default now()
);
create table if not exists student_roles (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete restrict,
  subject_id uuid not null, role text not null check(role in ('student','staff','entrepreneur','freelancer','provider','opportunity_seeker')),
  status text not null default 'active', source text not null, created_at timestamptz not null default now(), unique(tenant_id,subject_id,role)
);
create table if not exists financial_opportunities (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete restrict,
  category text not null check(category in ('student_finance','staff_finance','business_finance','grant','scholarship','savings','insurance','payment_service','p2p_future','other')),
  provider_name text not null, product_name text not null, description text, eligibility jsonb not null default '{}',
  terms_summary text, application_url text, source_id uuid, verified_at timestamptz, status text not null default 'verified',
  created_at timestamptz not null default now()
);
create table if not exists financial_interests (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete restrict,
  subject_id uuid not null, category text not null, consent_status text not null default 'granted',
  preferences jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(tenant_id,subject_id,category)
);
create table if not exists financial_access_events (
  id bigint generated always as identity primary key, tenant_id uuid not null references tenants(id) on delete restrict,
  subject_id uuid, opportunity_id uuid references financial_opportunities(id) on delete set null,
  event_type text not null check(event_type in ('viewed','explained','referred','applied','outcome_reported')),
  metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists peer_finance_interest (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete restrict,
  subject_id uuid not null, direction text not null check(direction in ('borrow','save','lend','fund','seek_funding')),
  amount_band text, purpose text, consent_status text not null default 'withdrawn', status text not null default 'discovery_only',
  created_at timestamptz not null default now()
);

create index if not exists idx_academic_events_tenant_time on academic_events(tenant_id,start_at);
create index if not exists idx_assessments_tenant_due on assessments(tenant_id,due_at);
create index if not exists idx_contacts_tenant_role on human_contacts(tenant_id,role);
create index if not exists idx_financial_opps_tenant_cat on financial_opportunities(tenant_id,category,status);
create index if not exists idx_financial_interests_subject on financial_interests(tenant_id,subject_id);
create index if not exists idx_financial_access_tenant_time on financial_access_events(tenant_id,created_at desc);

alter table academic_levels enable row level security;
alter table qualifications enable row level security;
alter table programmes enable row level security;
alter table academic_requirements enable row level security;
alter table human_contacts enable row level security;
alter table student_roles enable row level security;
alter table financial_opportunities enable row level security;
alter table financial_interests enable row level security;
alter table financial_access_events enable row level security;
alter table peer_finance_interest enable row level security;

-- Phase 2 financial boundary: this schema stores discovery/interest only.
-- It deliberately contains no balances, wallets, payment instructions, loan contracts or settlement records.
