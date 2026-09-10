-- Canonical NOUN Bot alert/notification state.
-- Institutional truth remains in source tables; these tables record derived student-facing state.
create table if not exists public.student_alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  student_phone text not null,
  alert_key text not null,
  severity text not null check (severity in ('CRITICAL','URGENT','IMPORTANT','REMINDER','RECOMMENDATION','INFORMATION')),
  title text not null,
  body text not null,
  source_type text not null,
  source_id bigint,
  course_code text,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open','acknowledged','dismissed','resolved','expired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  expires_at timestamptz,
  unique (tenant_id, student_phone, alert_key)
);

create table if not exists public.student_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  student_phone text not null,
  alert_id uuid references public.student_alerts(id) on delete set null,
  notification_key text not null,
  channel text not null check (channel in ('in_app','email','whatsapp','sms','push')),
  status text not null default 'pending' check (status in ('pending','queued','sent','failed','acknowledged','cancelled')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  acknowledged_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, student_phone, notification_key, channel)
);

create index if not exists idx_student_alerts_student_status on public.student_alerts(tenant_id, student_phone, status, due_at);
create index if not exists idx_student_alerts_due on public.student_alerts(tenant_id, due_at, severity);
create index if not exists idx_student_notifications_due on public.student_notifications(tenant_id, scheduled_at, status);
create index if not exists idx_student_notifications_student on public.student_notifications(tenant_id, student_phone, status, scheduled_at);

alter table public.student_alerts enable row level security;
alter table public.student_notifications enable row level security;

drop policy if exists student_alerts_tenant_isolation on public.student_alerts;
create policy student_alerts_tenant_isolation on public.student_alerts for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());

drop policy if exists student_notifications_tenant_isolation on public.student_notifications;
create policy student_notifications_tenant_isolation on public.student_notifications for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());

comment on table public.student_alerts is 'Derived NOUN Bot student-facing alerts; institutional source data remains authoritative.';
comment on table public.student_notifications is 'Idempotent notification delivery state for NOUN Bot alerts.';
