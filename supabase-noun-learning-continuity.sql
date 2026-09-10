-- NOUN BOT learning continuity layer
-- Applied to the canonical Noun bot Supabase project as migration: noun_student_learning_continuity
-- Keeps learner courses, questions, notes and study sessions in the system of record.
-- Uses the existing tenant model and current_tenant_id() RLS boundary.

create table if not exists public.student_course_enrolments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  student_phone text not null,
  course_id bigint references public.courses(id) on delete set null,
  course_code text not null,
  study_level text,
  semester integer,
  status text not null default 'active' check (status in ('active','completed','paused','dropped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, student_phone, course_code)
);

create table if not exists public.student_study_questions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  student_phone text not null,
  course_code text,
  question text not null,
  mode text not null default 'tutor' check (mode in ('tutor','tutorial','practice','revision')),
  status text not null default 'open' check (status in ('open','answered','saved','archived')),
  answer_summary text,
  knowledge_confidence numeric(5,4),
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

create table if not exists public.student_study_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  student_phone text not null,
  course_code text,
  title text not null,
  body text not null,
  source_question_id uuid references public.student_study_questions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_learning_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  student_phone text not null,
  course_code text,
  mode text not null default 'tutor' check (mode in ('tutor','tutorial','practice','revision')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  question_count integer not null default 0,
  metadata jsonb not null default '{}'
);

create index if not exists idx_student_course_enrolments_student on public.student_course_enrolments(tenant_id,student_phone,status);
create index if not exists idx_student_study_questions_student on public.student_study_questions(tenant_id,student_phone,created_at desc);
create index if not exists idx_student_study_questions_course on public.student_study_questions(tenant_id,course_code,created_at desc);
create index if not exists idx_student_study_notes_student on public.student_study_notes(tenant_id,student_phone,created_at desc);
create index if not exists idx_student_learning_sessions_student on public.student_learning_sessions(tenant_id,student_phone,started_at desc);

alter table public.student_course_enrolments enable row level security;
alter table public.student_study_questions enable row level security;
alter table public.student_study_notes enable row level security;
alter table public.student_learning_sessions enable row level security;

create policy student_course_enrolments_tenant on public.student_course_enrolments for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
create policy student_study_questions_tenant on public.student_study_questions for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
create policy student_study_notes_tenant on public.student_study_notes for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
create policy student_learning_sessions_tenant on public.student_learning_sessions for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
