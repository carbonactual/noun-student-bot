-- NOUN Student Bot — canonical production schema
-- Server-side bot uses SUPABASE_SERVICE_ROLE_KEY.
-- Public dashboard must only receive aggregate/non-sensitive data.

create extension if not exists pgcrypto;

create table if not exists students (
  phone text primary key,
  level text,
  courses text[] not null default '{}',
  stage text not null default 'ask_level',
  email text,
  matric_number text,
  faculty text,
  department text,
  waec_result text,
  neco_result text,
  primary_cert text,
  direct_entry_qualification text,
  state_of_origin text,
  whatsapp_opt_in boolean not null default true,
  onboarding_source text not null default 'whatsapp',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deadlines (
  id bigint generated always as identity primary key,
  level text not null,
  course text not null,
  title text not null,
  due_date date not null,
  reminded_at int[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists exam_checklists (
  phone text not null,
  course text not null,
  stamp1 boolean not null default false,
  stamp2 boolean not null default false,
  stamp3 boolean not null default false,
  laminated boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (phone, course)
);

create table if not exists help_requests (
  id bigint generated always as identity primary key,
  phone text not null,
  level text,
  courses text[] not null default '{}',
  note text,
  status text not null default 'open' check (status in ('open','assigned','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists course_content (
  id bigint generated always as identity primary key,
  course_code text not null,
  module_title text not null,
  content text not null,
  source_url text,
  source_hash text,
  created_at timestamptz not null default now(),
  unique(course_code, module_title)
);

create table if not exists faculties (
  id bigint generated always as identity primary key,
  name text not null unique,
  ecourseware_url text
);

-- Idempotency + operational audit trail for Meta/Zapier events.
create table if not exists message_events (
  id bigint generated always as identity primary key,
  event_id text not null unique,
  phone text not null,
  direction text not null check (direction in ('inbound','outbound')),
  message_type text not null default 'text',
  message_text text,
  provider_message_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists outbound_queue (
  id bigint generated always as identity primary key,
  phone text not null,
  message_text text not null,
  kind text not null default 'transactional',
  source_id text,
  status text not null default 'queued' check (status in ('queued','processing','sent','failed','cancelled')),
  attempts int not null default 0,
  available_at timestamptz not null default now(),
  locked_until timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'draft' check (status in ('draft','scheduled','active','paused','completed','cancelled')),
  message_template text not null,
  audience_level text,
  audience_course text,
  audience_faculty text,
  audience_stage text,
  onboarding_only boolean not null default false,
  send_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists campaign_messages (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  phone text not null,
  rendered_message text not null,
  status text not null default 'queued' check (status in ('queued','processing','sent','failed','cancelled')),
  attempts int not null default 0,
  provider_message_id text,
  last_error text,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique(campaign_id, phone)
);

create index if not exists idx_students_level_course on students using gin (courses);
create index if not exists idx_students_last_seen on students(last_seen_at desc);
create index if not exists idx_deadlines_level_course on deadlines(level, course);
create index if not exists idx_deadlines_due_date on deadlines(due_date);
create index if not exists idx_help_status on help_requests(status, created_at desc);
create index if not exists idx_message_events_phone on message_events(phone, created_at desc);
create index if not exists idx_outbound_queue_ready on outbound_queue(status, available_at);
create index if not exists idx_campaign_messages_ready on campaign_messages(status, scheduled_at);

-- Safe upgrades for databases created from the earlier v1 schema.
alter table students add column if not exists email text;
alter table students add column if not exists matric_number text;
alter table students add column if not exists faculty text;
alter table students add column if not exists department text;
alter table students add column if not exists waec_result text;
alter table students add column if not exists neco_result text;
alter table students add column if not exists primary_cert text;
alter table students add column if not exists direct_entry_qualification text;
alter table students add column if not exists state_of_origin text;
alter table students add column if not exists whatsapp_opt_in boolean not null default true;
alter table students add column if not exists onboarding_source text not null default 'whatsapp';
alter table students add column if not exists last_seen_at timestamptz;
alter table students add column if not exists updated_at timestamptz not null default now();

-- RLS is defense-in-depth. The bot uses service-role server-side and bypasses RLS.
alter table students enable row level security;
alter table deadlines enable row level security;
alter table exam_checklists enable row level security;
alter table help_requests enable row level security;
alter table course_content enable row level security;
alter table faculties enable row level security;
alter table message_events enable row level security;
alter table outbound_queue enable row level security;
alter table campaigns enable row level security;
alter table campaign_messages enable row level security;

-- Public clients may read only non-sensitive operational content.
drop policy if exists public_students_read on students;
drop policy if exists public_deadlines_read on deadlines;
drop policy if exists public_checklists_read on exam_checklists;
drop policy if exists public_course_content_read on course_content;
drop policy if exists public_faculties_read on faculties;

create policy public_students_read on students for select to public using (true);
create policy public_deadlines_read on deadlines for select to public using (true);
create policy public_checklists_read on exam_checklists for select to public using (true);
create policy public_course_content_read on course_content for select to public using (true);
create policy public_faculties_read on faculties for select to public using (true);

-- IMPORTANT: no public INSERT/UPDATE/DELETE policies.
-- The earlier public-write approach is intentionally removed.
