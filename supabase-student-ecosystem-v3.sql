-- NOUN Student Ecosystem v3
-- Tenant-scoped student life, governance, skills, work, commerce and economic-access contracts.
-- No wallet, payment, wagering, loan-origination or settlement execution lives here.

create table if not exists student_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  title text not null,
  event_type text not null,
  description text,
  start_at timestamptz,
  end_at timestamptz,
  location text,
  remote_available boolean not null default false,
  capacity int,
  eligibility jsonb not null default '{}',
  source_url text,
  authority_tier int not null default 4 check(authority_tier between 1 and 5),
  verification_status text not null default 'pending' check(verification_status in ('verified','pending','stale','conflicting','cancelled')),
  status text not null default 'active' check(status in ('draft','active','full','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists student_event_participants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  event_id uuid not null references student_events(id) on delete cascade,
  subject_id uuid not null,
  participation_status text not null default 'interested' check(participation_status in ('interested','registered','attended','cancelled')),
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(event_id,subject_id)
);

create table if not exists student_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  name text not null,
  group_type text not null check(group_type in ('club','association','society','sports_team','student_union','interest_group','other')),
  description text,
  public_profile boolean not null default false,
  verification_status text not null default 'pending' check(verification_status in ('verified','pending','suspended')),
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id,name,group_type)
);

create table if not exists student_group_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  group_id uuid not null references student_groups(id) on delete cascade,
  subject_id uuid not null,
  membership_role text not null default 'member',
  status text not null default 'active' check(status in ('pending','active','suspended','left')),
  created_at timestamptz not null default now(),
  unique(group_id,subject_id)
);

create table if not exists student_governance_cycles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  title text not null,
  cycle_type text not null default 'election' check(cycle_type in ('election','referendum','consultation','other')),
  starts_at timestamptz,
  ends_at timestamptz,
  eligibility jsonb not null default '{}',
  official_source_url text,
  authority_tier int not null default 1 check(authority_tier between 1 and 5),
  verification_status text not null default 'pending' check(verification_status in ('verified','pending','stale','conflicting','closed')),
  status text not null default 'draft' check(status in ('draft','open','closed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists student_governance_candidates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  cycle_id uuid not null references student_governance_cycles(id) on delete cascade,
  subject_id uuid,
  display_name text not null,
  position text not null,
  manifesto_url text,
  verification_status text not null default 'pending' check(verification_status in ('verified','pending','rejected')),
  public_profile boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists student_ballot_publication (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  cycle_id uuid not null references student_governance_cycles(id) on delete cascade,
  ballot_instructions text,
  official_ballot_url text,
  authority_tier int not null default 1 check(authority_tier between 1 and 5),
  verification_status text not null default 'pending' check(verification_status in ('verified','pending','stale','conflicting')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique(cycle_id)
);

create table if not exists student_skills (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  subject_id uuid not null,
  skill_name text not null,
  proficiency text,
  evidence_url text,
  public_profile boolean not null default false,
  verification_status text not null default 'unverified' check(verification_status in ('unverified','self_declared','verified','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id,subject_id,skill_name)
);

create table if not exists skill_opportunities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  title text not null,
  category text not null,
  description text,
  provider_name text,
  skills text[] not null default '{}',
  location text,
  remote_available boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  application_url text,
  source_url text,
  authority_tier int not null default 4 check(authority_tier between 1 and 5),
  verification_status text not null default 'pending' check(verification_status in ('verified','pending','stale','conflicting','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists work_opportunities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  title text not null,
  opportunity_type text not null check(opportunity_type in ('employment','internship','siwes','apprenticeship','nysc','volunteer','fellowship','scholarship','grant','competition','other')),
  organization_name text,
  description text,
  skills text[] not null default '{}',
  eligibility jsonb not null default '{}',
  location text,
  remote_available boolean not null default false,
  deadline_at timestamptz,
  application_url text,
  source_url text,
  authority_tier int not null default 4 check(authority_tier between 1 and 5),
  verification_status text not null default 'pending' check(verification_status in ('verified','pending','stale','conflicting','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists student_opportunity_interests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  subject_id uuid not null,
  opportunity_type text,
  categories text[] not null default '{}',
  skills text[] not null default '{}',
  location_preference text,
  remote_ok boolean not null default true,
  consent_status text not null default 'granted' check(consent_status in ('granted','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id,subject_id)
);

create table if not exists student_opportunity_matches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  subject_id uuid not null,
  opportunity_id uuid not null,
  opportunity_kind text not null check(opportunity_kind in ('skill','work','event','finance')),
  score numeric(6,3) not null,
  reasons jsonb not null default '[]',
  eligibility_flags jsonb not null default '[]',
  surfaced_at timestamptz not null default now(),
  selected_at timestamptz,
  outcome text,
  unique(subject_id,opportunity_id,opportunity_kind)
);

-- Student business visibility extends the existing peer-economy provider contract.
alter table if exists service_providers add column if not exists public_profile boolean not null default false;
alter table if exists service_providers add column if not exists business_category text;
alter table if exists service_providers add column if not exists verified_business boolean not null default false;
alter table if exists service_providers add column if not exists service_area text;

-- Helpful indexes.
create index if not exists idx_student_events_tenant_time on student_events(tenant_id,start_at,status);
create index if not exists idx_student_groups_tenant on student_groups(tenant_id,group_type,status) where status is not null;
create index if not exists idx_governance_cycle_tenant on student_governance_cycles(tenant_id,status,starts_at);
create index if not exists idx_student_skills_subject on student_skills(tenant_id,subject_id,public_profile);
create index if not exists idx_skill_opps_tenant on skill_opportunities(tenant_id,verification_status,starts_at);
create index if not exists idx_work_opps_tenant on work_opportunities(tenant_id,opportunity_type,deadline_at);
create index if not exists idx_opportunity_interest_subject on student_opportunity_interests(tenant_id,subject_id);
create index if not exists idx_opportunity_matches_subject on student_opportunity_matches(tenant_id,subject_id,surfaced_at desc);

-- RLS. Existing deployment helpers own exact member policies; these tables remain non-public until explicitly exposed.
alter table student_events enable row level security;
alter table student_event_participants enable row level security;
alter table student_groups enable row level security;
alter table student_group_memberships enable row level security;
alter table student_governance_cycles enable row level security;
alter table student_governance_candidates enable row level security;
alter table student_ballot_publication enable row level security;
alter table student_skills enable row level security;
alter table skill_opportunities enable row level security;
alter table work_opportunities enable row level security;
alter table student_opportunity_interests enable row level security;
alter table student_opportunity_matches enable row level security;

-- No ballot table stores vote choices or wagering. Ballot execution remains an explicit institution-authorized boundary.
