-- NOUN operating layer continuity tables.
-- Reuses the existing tenant boundary and does not create a new identity system.

create table if not exists public.noun_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  event_id text not null,
  event_name text not null,
  principal text,
  subject text,
  correlation_id text not null,
  payload jsonb not null default '{}'::jsonb,
  evidence_ref text,
  occurred_at timestamptz not null,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (tenant_id, event_id)
);

create index if not exists noun_events_tenant_correlation_idx on public.noun_events(tenant_id, correlation_id);
create index if not exists noun_events_principal_occurred_idx on public.noun_events(tenant_id, principal, occurred_at desc);

create table if not exists public.noun_pulses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  phone text,
  course_code text,
  capability text not null,
  event_id text not null,
  outcome text not null,
  value_sent numeric not null default 0,
  value_returned numeric not null default 0,
  status text not null check (status in ('asset','liability','unknown')),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, event_id)
);

create index if not exists noun_pulses_tenant_phone_idx on public.noun_pulses(tenant_id, phone, occurred_at desc);
create index if not exists noun_pulses_capability_idx on public.noun_pulses(tenant_id, capability, occurred_at desc);

create table if not exists public.noun_human_escalations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  request_id text not null,
  phone text not null,
  route text not null,
  reason text not null,
  priority text not null default 'normal',
  status text not null default 'open',
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, request_id)
);

create index if not exists noun_human_escalations_open_idx on public.noun_human_escalations(tenant_id, status, priority, created_at desc);

alter table public.noun_events enable row level security;
alter table public.noun_pulses enable row level security;
alter table public.noun_human_escalations enable row level security;

-- These operational control records are server-written through the protected service role.
-- Client policies are intentionally not granted here.
