-- NOUN Student Ecosystem V4
-- State-bearing contracts for forms, requests, learning media, mock assessment, physical services and authorized representation.
-- Tenant-scoped. Consequential institutional actions remain explicitly approved and outside autonomous intelligence.

create table if not exists student_form_catalog (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  title text not null,
  form_type text not null,
  description text,
  official_url text,
  required_documents jsonb not null default '[]',
  required_signatures jsonb not null default '[]',
  eligibility jsonb not null default '{}',
  submission_channel text,
  deadline_rule text,
  authority_tier int not null default 1 check(authority_tier between 1 and 5),
  verification_status text not null default 'pending' check(verification_status in ('verified','pending','stale','conflicting','retired')),
  retrieved_at timestamptz,
  effective_from date,
  effective_to date,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists student_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  subject_id uuid not null,
  request_type text not null,
  title text not null,
  description text,
  form_id uuid references student_form_catalog(id) on delete set null,
  status text not null default 'draft' check(status in ('draft','ready_for_review','submitted_by_user','in_progress','needs_information','completed','rejected','cancelled','expired')),
  official_tracking_code text,
  official_url text,
  due_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  consent_recorded_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists student_request_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  request_id uuid not null references student_requests(id) on delete cascade,
  document_type text not null,
  storage_reference text,
  status text not null default 'required' check(status in ('required','provided','verified','rejected')),
  verified_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists learning_media (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  title text not null,
  media_type text not null check(media_type in ('video','audio','article','guide','checklist','interactive')),
  category text not null,
  description text,
  media_url text not null,
  course_code text,
  programme_id uuid references programmes(id) on delete set null,
  study_level text,
  skill_tags text[] not null default '{}',
  duration_seconds int,
  authority_tier int not null default 4 check(authority_tier between 1 and 5),
  verification_status text not null default 'pending' check(verification_status in ('verified','pending','stale','conflicting','retired')),
  source_url text,
  retrieved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mock_assessments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  title text not null,
  assessment_type text not null check(assessment_type in ('mock_exam','mock_test','practice_set','revision_set','diagnostic')),
  course_code text,
  programme_id uuid references programmes(id) on delete set null,
  study_level text,
  duration_minutes int,
  question_count int,
  source_type text not null default 'original_practice' check(source_type in ('original_practice','official_sample','licensed_content','approved_course_material')),
  source_url text,
  verification_status text not null default 'pending' check(verification_status in ('verified','pending','stale','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mock_assessment_questions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  assessment_id uuid not null references mock_assessments(id) on delete cascade,
  question_no int not null,
  prompt text not null,
  options jsonb not null default '[]',
  correct_option text,
  explanation text,
  course_topic text,
  difficulty text,
  created_at timestamptz not null default now(),
  unique(assessment_id,question_no)
);

create table if not exists mock_attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  subject_id uuid not null,
  assessment_id uuid not null references mock_assessments(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score numeric(7,3),
  answered_count int not null default 0,
  metadata jsonb not null default '{}'
);

create table if not exists physical_service_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  subject_id uuid not null,
  service_type text not null check(service_type in ('id_card','exam_card','registration_slip','library_card','certificate','transcript','printing','photocopying','scanning','binding','handouts','gown_regalia','document_pickup','document_delivery','other')),
  study_centre text,
  quantity int,
  specifications jsonb not null default '{}',
  provider_id uuid,
  price_text text,
  status text not null default 'requested' check(status in ('requested','quoted','approved','processing','ready','delivered','cancelled','disputed')),
  authorized_representation boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists study_space_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  subject_id uuid not null,
  study_centre text not null,
  requested_date date,
  start_at timestamptz,
  end_at timestamptz,
  purpose text,
  resources_requested jsonb not null default '[]',
  status text not null default 'requested' check(status in ('requested','approved','declined','cancelled','completed')),
  official_form_id uuid references student_form_catalog(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists authorized_representation_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  subject_id uuid not null,
  representative_subject_id uuid,
  task_type text not null,
  task_description text not null,
  scope jsonb not null default '{}',
  starts_at timestamptz,
  expires_at timestamptz,
  authorization_status text not null default 'pending' check(authorization_status in ('pending','authorized','declined','expired','revoked','completed')),
  institution_confirmation jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists financial_learning_resources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  title text not null,
  topic text not null,
  description text,
  resource_url text,
  resource_type text not null default 'education' check(resource_type in ('education','calculator','glossary','video','guide')),
  authority_tier int not null default 4 check(authority_tier between 1 and 5),
  verification_status text not null default 'pending' check(verification_status in ('verified','pending','stale','conflicting','retired')),
  eligibility_note text,
  age_or_eligibility_gate text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_form_catalog_tenant_type on student_form_catalog(tenant_id,form_type,verification_status);
create index if not exists idx_student_requests_subject on student_requests(tenant_id,subject_id,status,created_at desc);
create index if not exists idx_learning_media_course on learning_media(tenant_id,course_code,study_level,verification_status);
create index if not exists idx_mock_assessments_course on mock_assessments(tenant_id,course_code,assessment_type,verification_status);
create index if not exists idx_mock_attempts_subject on mock_attempts(tenant_id,subject_id,submitted_at desc);
create index if not exists idx_physical_services_subject on physical_service_requests(tenant_id,subject_id,status,created_at desc);
create index if not exists idx_study_space_subject on study_space_requests(tenant_id,subject_id,requested_date);
create index if not exists idx_representation_subject on authorized_representation_requests(tenant_id,subject_id,authorization_status);

alter table student_form_catalog enable row level security;
alter table student_requests enable row level security;
alter table student_request_documents enable row level security;
alter table learning_media enable row level security;
alter table mock_assessments enable row level security;
alter table mock_assessment_questions enable row level security;
alter table mock_attempts enable row level security;
alter table physical_service_requests enable row level security;
alter table study_space_requests enable row level security;
alter table authorized_representation_requests enable row level security;
alter table financial_learning_resources enable row level security;

-- Assessment integrity boundary: mock/practice is allowed; live exam completion or proxy attendance is not represented by this schema.
-- Representation boundary: authorization is explicit, time-bounded and task-scoped; exam attendance and identity impersonation remain prohibited.
