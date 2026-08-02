-- NOUN Student Bot — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New Query → paste → Run

create table if not exists students (
  phone text primary key,
  level text not null,
  courses text[] not null default '{}',
  stage text not null default 'active',
  created_at timestamptz not null default now()
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

-- Indexes for the admin dashboard's common queries
create index if not exists idx_students_level_course on students using gin (courses);
create index if not exists idx_deadlines_level_course on deadlines (level, course);
