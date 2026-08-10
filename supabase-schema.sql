-- NOUN Student Bot — Supabase schema v2
-- Run in Supabase SQL Editor. Existing deployments should apply the ALTER below.

create table if not exists students (
  phone text primary key,
  level text,
  courses text[] not null default '{}',
  stage text not null default 'ask_level',
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

create index if not exists idx_students_level_course on students using gin (courses);
create index if not exists idx_students_level on students (level);
create index if not exists idx_deadlines_level_course on deadlines (level, course);
create index if not exists idx_deadlines_due_date on deadlines (due_date);

-- Safe migration for the original v1 schema:
alter table students alter column level drop not null;
alter table students add column if not exists updated_at timestamptz not null default now();
alter table students alter column stage set default 'ask_level';
