-- NOUN Student Bot — canonical production schema
create extension if not exists pgcrypto;

create table if not exists students (phone text primary key, full_name text, level text, courses text[] not null default '{}', stage text not null default 'ask_level', email text, matric_number text, faculty text, department text, waec_result text, neco_result text, primary_cert text, direct_entry_qualification text, state_of_origin text, whatsapp_opt_in boolean not null default true, onboarding_source text not null default 'whatsapp', last_seen_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists deadlines (id bigint generated always as identity primary key, level text not null, course text not null, title text not null, due_date date not null, reminded_at int[] not null default '{}', created_at timestamptz not null default now());
create table if not exists exam_checklists (phone text not null, course text not null, stamp1 boolean not null default false, stamp2 boolean not null default false, stamp3 boolean not null default false, laminated boolean not null default false, updated_at timestamptz not null default now(), primary key(phone,course));
create table if not exists help_requests (id bigint generated always as identity primary key, phone text not null, level text, courses text[] not null default '{}', note text, status text not null default 'open' check(status in('open','assigned','resolved')), created_at timestamptz not null default now(), resolved_at timestamptz);
create table if not exists course_content (id bigint generated always as identity primary key, course_code text not null, module_title text not null, content text not null, source_url text, source_hash text, created_at timestamptz not null default now(), unique(course_code,module_title));
create table if not exists faculties (id bigint generated always as identity primary key, name text not null unique, ecourseware_url text);
create table if not exists message_events (id bigint generated always as identity primary key, event_id text not null unique, phone text not null, direction text not null check(direction in('inbound','outbound')), message_type text not null default 'text', message_text text, provider_message_id text, metadata jsonb not null default '{}', created_at timestamptz not null default now());
create table if not exists outbound_queue (id bigint generated always as identity primary key, phone text not null, message_text text not null, kind text not null default 'transactional', source_id text, status text not null default 'queued' check(status in('queued','processing','sent','failed','cancelled')), attempts int not null default 0, available_at timestamptz not null default now(), locked_until timestamptz, provider_message_id text, last_error text, created_at timestamptz not null default now(), sent_at timestamptz);
create table if not exists campaigns (id uuid primary key default gen_random_uuid(), name text not null, status text not null default 'draft' check(status in('draft','scheduled','active','paused','completed','cancelled')), message_template text not null, audience_level text, audience_course text, audience_faculty text, audience_stage text, onboarding_only boolean not null default false, send_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists campaign_messages (id bigint generated always as identity primary key, campaign_id uuid not null references campaigns(id) on delete cascade, phone text not null, rendered_message text not null, status text not null default 'queued' check(status in('queued','processing','sent','failed','cancelled')), attempts int not null default 0, provider_message_id text, last_error text, scheduled_at timestamptz not null default now(), sent_at timestamptz, created_at timestamptz not null default now(), unique(campaign_id,phone));

-- NOUN academic knowledge graph
create table if not exists academic_faculties (id bigint generated always as identity primary key, name text not null unique, source_url text, source_tier int not null default 1, verified_at timestamptz, active boolean not null default true);
create table if not exists academic_departments (id bigint generated always as identity primary key, faculty_id bigint references academic_faculties(id) on delete cascade, name text not null, source_url text, source_tier int not null default 1, verified_at timestamptz, active boolean not null default true, unique(faculty_id,name));
create table if not exists programmes (id bigint generated always as identity primary key, department_id bigint references academic_departments(id) on delete set null, title text not null, award_type text, programme_level text, programme_code text, source_url text, source_tier int not null default 1, verification_status text not null default 'verified' check(verification_status in('verified','supplementary','conflicting','stale')), verified_at timestamptz, active boolean not null default true, unique(title,department_id));
create table if not exists courses (id bigint generated always as identity primary key, course_code text not null unique, title text, credit_units numeric, source_url text, source_tier int not null default 1, verification_status text not null default 'verified' check(verification_status in('verified','supplementary','conflicting','stale','unknown')), verified_at timestamptz, active boolean not null default true);
create table if not exists programme_courses (programme_id bigint not null references programmes(id) on delete cascade, course_id bigint not null references courses(id) on delete cascade, level text, semester int, course_type text, source_url text, source_tier int not null default 1, verified_at timestamptz, primary key(programme_id,course_id,level,semester));
create table if not exists course_offerings (id bigint generated always as identity primary key, course_id bigint references courses(id) on delete cascade, faculty_id bigint references academic_faculties(id) on delete set null, level text, semester int, credit_units numeric, source_url text, source_tier int not null default 1, verified_at timestamptz, unique(course_id,faculty_id,level,semester));
create table if not exists knowledge_sources (id bigint generated always as identity primary key, source_url text not null unique, source_type text not null, authority_tier int not null check(authority_tier between 1 and 5), title text, publisher text, retrieved_at timestamptz, published_at timestamptz, content_hash text, status text not null default 'active' check(status in('active','stale','conflicting','failed')), notes text);
create table if not exists knowledge_claims (id bigint generated always as identity primary key, claim text not null, source_id bigint references knowledge_sources(id) on delete set null, subject_type text, subject_id text, claim_type text not null, authority_tier int not null check(authority_tier between 1 and 5), confidence numeric not null default 0.5 check(confidence between 0 and 1), effective_from timestamptz, effective_to timestamptz, verified_at timestamptz, status text not null default 'active' check(status in('active','stale','conflicting','rejected')));
create table if not exists noun_policies (id bigint generated always as identity primary key, policy_code text, title text not null, source_url text not null unique, policy_area text, authority_tier int not null default 1, effective_date date, retrieved_at timestamptz, status text not null default 'active' check(status in('active','stale','conflicting','repealed')), summary text);
create table if not exists academic_events (id bigint generated always as identity primary key, event_type text not null, title text not null, start_at timestamptz, end_at timestamptz, level text, course_code text, programme_id bigint references programmes(id) on delete set null, source_id bigint references knowledge_sources(id) on delete set null, authority_tier int not null default 1, confidence numeric not null default 0.8 check(confidence between 0 and 1), status text not null default 'verified' check(status in('verified','supplementary','conflicting','stale')), created_at timestamptz not null default now());
create table if not exists assessments (id bigint generated always as identity primary key, course_id bigint references courses(id) on delete set null, assessment_type text not null, title text, academic_session text, semester int, question_text text, source_url text, source_tier int not null default 1, verification_status text not null default 'unknown' check(verification_status in('official','verified_secondary','student_submitted','unknown','conflicting')), retrieved_at timestamptz, notes text);

-- Student intelligence / privacy-aware analytics
create table if not exists student_activity (id bigint generated always as identity primary key, phone text not null, event_type text not null, course_code text, topic text, metadata jsonb not null default '{}', created_at timestamptz not null default now());
create table if not exists student_preferences (phone text primary key, insight_opt_in boolean not null default true, campaign_opt_in boolean not null default true, reminder_opt_in boolean not null default true, updated_at timestamptz not null default now());
create table if not exists insights (id bigint generated always as identity primary key, scope text not null check(scope in('student','course','programme','faculty','institution')), subject_key text, title text not null, insight_text text not null, evidence_count int not null default 0, confidence numeric not null default 0.5 check(confidence between 0 and 1), source_tier int not null default 4, status text not null default 'draft' check(status in('draft','reviewed','approved','published','rejected')), generated_at timestamptz not null default now(), reviewed_at timestamptz);
create table if not exists insight_evidence (insight_id bigint not null references insights(id) on delete cascade, evidence_type text not null, evidence_key text, metric numeric, metadata jsonb not null default '{}', primary key(insight_id,evidence_type,evidence_key));
create table if not exists insight_recommendations (id bigint generated always as identity primary key, insight_id bigint not null references insights(id) on delete cascade, action_type text not null, recommendation text not null, target_definition jsonb not null default '{}', status text not null default 'proposed' check(status in('proposed','approved','executed','rejected')), created_at timestamptz not null default now());

-- Existing schema compatibility
alter table students add column if not exists full_name text;
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

create index if not exists idx_students_level_course on students using gin(courses);
create index if not exists idx_students_last_seen on students(last_seen_at desc);
create index if not exists idx_deadlines_level_course on deadlines(level,course);
create index if not exists idx_deadlines_due_date on deadlines(due_date);
create index if not exists idx_help_status on help_requests(status,created_at desc);
create index if not exists idx_message_events_phone on message_events(phone,created_at desc);
create index if not exists idx_outbound_queue_ready on outbound_queue(status,available_at);
create index if not exists idx_campaign_messages_ready on campaign_messages(status,scheduled_at);
create index if not exists idx_academic_departments_faculty on academic_departments(faculty_id);
create index if not exists idx_programmes_department on programmes(department_id);
create index if not exists idx_courses_code on courses(course_code);
create index if not exists idx_programme_courses_course on programme_courses(course_id);
create index if not exists idx_course_offerings_code on course_offerings(course_id);
create index if not exists idx_knowledge_claims_subject on knowledge_claims(subject_type,subject_id,status);
create index if not exists idx_academic_events_time on academic_events(start_at,status);
create index if not exists idx_assessments_course on assessments(course_id,assessment_type);
create index if not exists idx_student_activity_phone on student_activity(phone,created_at desc);
create index if not exists idx_student_activity_course on student_activity(course_code,created_at desc);
create index if not exists idx_insights_status on insights(status,generated_at desc);

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
alter table academic_faculties enable row level security;
alter table academic_departments enable row level security;
alter table programmes enable row level security;
alter table courses enable row level security;
alter table programme_courses enable row level security;
alter table course_offerings enable row level security;
alter table knowledge_sources enable row level security;
alter table knowledge_claims enable row level security;
alter table noun_policies enable row level security;
alter table academic_events enable row level security;
alter table assessments enable row level security;
alter table student_activity enable row level security;
alter table student_preferences enable row level security;
alter table insights enable row level security;
alter table insight_evidence enable row level security;
alter table insight_recommendations enable row level security;

drop policy if exists public_students_read on students;
drop policy if exists public_deadlines_read on deadlines;
drop policy if exists public_checklists_read on exam_checklists;
drop policy if exists public_course_content_read on course_content;
drop policy if exists public_faculties_read on faculties;
create policy public_deadlines_read on deadlines for select to public using(true);
create policy public_course_content_read on course_content for select to public using(true);
create policy public_faculties_read on faculties for select to public using(true);
create policy public_academic_faculties_read on academic_faculties for select to public using(true);
create policy public_academic_departments_read on academic_departments for select to public using(true);
create policy public_programmes_read on programmes for select to public using(true);
create policy public_courses_read on courses for select to public using(true);
create policy public_programme_courses_read on programme_courses for select to public using(true);
create policy public_course_offerings_read on course_offerings for select to public using(true);
create policy public_knowledge_sources_read on knowledge_sources for select to public using(true);
create policy public_policies_read on noun_policies for select to public using(true);
create policy public_academic_events_read on academic_events for select to public using(true);
create policy public_assessments_read on assessments for select to public using(true);

-- Server uses SUPABASE_SERVICE_ROLE_KEY. Never expose it to the browser.
