-- Phase 1: Carbon Actual multi-tenant foundation
-- Run only after reviewing against the live Supabase schema and taking a backup.
-- This migration intentionally does NOT make existing student data publicly readable.

create extension if not exists pgcrypto;

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tenant_type text not null default 'institution',
  status text not null default 'active' check(status in ('active','suspended','archived')),
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  subject_id uuid not null,
  role text not null check(role in ('student','support','department_admin','faculty_admin','institution_admin','platform_operator')),
  status text not null default 'active' check(status in ('active','suspended','revoked')),
  created_at timestamptz not null default now(),
  unique(tenant_id,subject_id)
);

create table if not exists audit_events (
  id bigint generated always as identity primary key,
  tenant_id uuid references tenants(id) on delete set null,
  actor_subject_id uuid,
  actor_type text not null default 'system',
  action text not null,
  resource_type text,
  resource_id text,
  outcome text not null default 'success' check(outcome in ('success','denied','failed')),
  ip_hash text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists consent_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  subject_id uuid not null,
  purpose text not null check(purpose in ('service','reminders','campaigns','insights','analytics')),
  status text not null check(status in ('granted','withdrawn')),
  source text not null,
  version text,
  granted_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);

-- Future tenant-safe rows. These are additive so existing production behavior is not broken.
alter table students add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table deadlines add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table exam_checklists add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table help_requests add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table course_content add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table faculties add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table campaigns add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table campaign_messages add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table student_activity add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table student_preferences add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table insights add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table academic_faculties add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table academic_departments add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table programmes add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table courses add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table programme_courses add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table course_offerings add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table knowledge_sources add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table knowledge_claims add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table noun_policies add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table academic_events add column if not exists tenant_id uuid references tenants(id) on delete restrict;
alter table assessments add column if not exists tenant_id uuid references tenants(id) on delete restrict;

create index if not exists idx_students_tenant on students(tenant_id);
create index if not exists idx_deadlines_tenant on deadlines(tenant_id);
create index if not exists idx_help_tenant on help_requests(tenant_id,created_at desc);
create index if not exists idx_campaigns_tenant on campaigns(tenant_id,created_at desc);
create index if not exists idx_activity_tenant on student_activity(tenant_id,created_at desc);
create index if not exists idx_audit_tenant_time on audit_events(tenant_id,created_at desc);
create index if not exists idx_memberships_subject on tenant_memberships(subject_id,tenant_id);
create index if not exists idx_consent_subject on consent_records(tenant_id,subject_id,purpose,created_at desc);

alter table tenants enable row level security;
alter table tenant_memberships enable row level security;
alter table audit_events enable row level security;
alter table consent_records enable row level security;

-- SECURITY PRINCIPLE:
-- No public policies are created for tenant metadata, memberships, audits or consent.
-- Application/server code must use the service role or authenticated RLS policies.
-- Do not make tenant_id NOT NULL until every existing row is backfilled.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY to browsers or WhatsApp clients.

insert into tenants(slug,name,tenant_type)
values('noun','National Open University of Nigeria','institution')
on conflict(slug) do nothing;

-- Backfill existing rows explicitly to the NOUN tenant before enforcing NOT NULL.
do $$
declare noun_id uuid;
begin
  select id into noun_id from tenants where slug='noun';
  update students set tenant_id=noun_id where tenant_id is null;
  update deadlines set tenant_id=noun_id where tenant_id is null;
  update exam_checklists set tenant_id=noun_id where tenant_id is null;
  update help_requests set tenant_id=noun_id where tenant_id is null;
  update course_content set tenant_id=noun_id where tenant_id is null;
  update faculties set tenant_id=noun_id where tenant_id is null;
  update campaigns set tenant_id=noun_id where tenant_id is null;
  update campaign_messages set tenant_id=noun_id where tenant_id is null;
  update student_activity set tenant_id=noun_id where tenant_id is null;
  update student_preferences set tenant_id=noun_id where tenant_id is null;
  update insights set tenant_id=noun_id where tenant_id is null;
  update academic_faculties set tenant_id=noun_id where tenant_id is null;
  update academic_departments set tenant_id=noun_id where tenant_id is null;
  update programmes set tenant_id=noun_id where tenant_id is null;
  update courses set tenant_id=noun_id where tenant_id is null;
  update programme_courses set tenant_id=noun_id where tenant_id is null;
  update course_offerings set tenant_id=noun_id where tenant_id is null;
  update knowledge_sources set tenant_id=noun_id where tenant_id is null;
  update knowledge_claims set tenant_id=noun_id where tenant_id is null;
  update noun_policies set tenant_id=noun_id where tenant_id is null;
  update academic_events set tenant_id=noun_id where tenant_id is null;
  update assessments set tenant_id=noun_id where tenant_id is null;
end $$;
