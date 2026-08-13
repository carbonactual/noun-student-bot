-- Carbon Actual Core: canonical common-denominator primitives for ecosystem products.
-- NOUN-specific academic data remains in NOUN tables; regulated finance execution remains in I/O.

create table if not exists core_entities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  entity_type text not null check (entity_type in ('person','organization','business','institution','community','system')),
  display_name text not null,
  status text not null default 'active' check (status in ('active','inactive','suspended','archived')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core_roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  entity_id uuid not null references core_entities(id) on delete cascade,
  role_type text not null,
  scope_type text,
  scope_id uuid,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (tenant_id, entity_id, role_type, scope_type, scope_id)
);

create table if not exists core_relationships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  subject_entity_id uuid not null references core_entities(id) on delete cascade,
  relationship_type text not null,
  object_entity_id uuid not null references core_entities(id) on delete cascade,
  status text not null default 'active',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (tenant_id, subject_entity_id, relationship_type, object_entity_id)
);

create table if not exists core_products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  owner_entity_id uuid references core_entities(id) on delete set null,
  name text not null,
  product_type text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','active','paused','retired')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core_services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  provider_entity_id uuid references core_entities(id) on delete set null,
  name text not null,
  service_type text not null,
  description text not null,
  status text not null default 'active' check (status in ('draft','active','paused','retired')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core_offers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  seller_entity_id uuid references core_entities(id) on delete set null,
  product_id uuid references core_products(id) on delete set null,
  service_id uuid references core_services(id) on delete set null,
  title text not null,
  price_amount numeric(20,6),
  currency_code text,
  terms jsonb not null default '{}',
  status text not null default 'active' check (status in ('draft','active','paused','closed')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  check ((product_id is not null) or (service_id is not null))
);

create table if not exists core_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  requester_entity_id uuid references core_entities(id) on delete set null,
  request_type text not null,
  title text not null,
  description text not null,
  constraints jsonb not null default '{}',
  status text not null default 'open' check (status in ('open','matched','fulfilled','cancelled','disputed','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  requester_entity_id uuid references core_entities(id) on delete set null,
  provider_entity_id uuid references core_entities(id) on delete set null,
  offer_id uuid references core_offers(id) on delete set null,
  request_id uuid references core_requests(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','accepted','in_progress','fulfilled','cancelled','disputed','closed')),
  commercial_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core_listings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  owner_entity_id uuid references core_entities(id) on delete set null,
  product_id uuid references core_products(id) on delete set null,
  service_id uuid references core_services(id) on delete set null,
  listing_type text not null check (listing_type in ('sale','service','trade','rent','wanted','opportunity')),
  title text not null,
  quantity numeric(20,6),
  price_amount numeric(20,6),
  currency_code text,
  status text not null default 'active' check (status in ('draft','active','paused','closed')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core_trades (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  listing_id uuid references core_listings(id) on delete set null,
  buyer_entity_id uuid references core_entities(id) on delete set null,
  seller_entity_id uuid references core_entities(id) on delete set null,
  trade_type text not null,
  quantity numeric(20,6),
  agreed_price numeric(20,6),
  currency_code text,
  status text not null default 'proposed' check (status in ('proposed','accepted','rejected','executing','completed','cancelled','disputed')),
  settlement_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core_opportunities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  publisher_entity_id uuid references core_entities(id) on delete set null,
  opportunity_type text not null,
  title text not null,
  description text not null,
  eligibility jsonb not null default '{}',
  source_url text,
  source_authority text,
  verified_at timestamptz,
  expires_at timestamptz,
  status text not null default 'active' check (status in ('draft','active','expired','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  entity_id uuid references core_entities(id) on delete set null,
  contact_type text not null,
  label text,
  value text not null,
  source_url text,
  verified_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists core_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  event_type text not null,
  actor_entity_id uuid references core_entities(id) on delete set null,
  subject_type text,
  subject_id uuid,
  occurred_at timestamptz not null default now(),
  idempotency_key text,
  payload jsonb not null default '{}',
  unique (tenant_id, idempotency_key)
);

create table if not exists core_consents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  entity_id uuid not null references core_entities(id) on delete cascade,
  purpose text not null,
  status text not null check (status in ('granted','withdrawn','expired')),
  granted_at timestamptz,
  withdrawn_at timestamptz,
  expires_at timestamptz,
  evidence jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists core_verifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  entity_id uuid references core_entities(id) on delete cascade,
  subject_type text not null,
  subject_id uuid,
  verification_type text not null,
  status text not null check (status in ('pending','verified','rejected','expired')),
  source_url text,
  evidence jsonb not null default '{}',
  verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists core_reputations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  entity_id uuid not null references core_entities(id) on delete cascade,
  dimension text not null,
  score numeric(8,4) not null default 0,
  sample_count integer not null default 0,
  source text,
  updated_at timestamptz not null default now(),
  unique (tenant_id, entity_id, dimension)
);

create table if not exists core_cases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  case_type text not null,
  subject_entity_id uuid references core_entities(id) on delete set null,
  status text not null default 'open' check (status in ('open','assigned','waiting','resolved','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  summary text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  case_id uuid references core_cases(id) on delete cascade,
  task_type text not null,
  assigned_entity_id uuid references core_entities(id) on delete set null,
  status text not null default 'open' check (status in ('open','in_progress','blocked','done','cancelled')),
  due_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core_workflows (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  workflow_type text not null,
  subject_type text,
  subject_id uuid,
  status text not null default 'active',
  state jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  sender_entity_id uuid references core_entities(id) on delete set null,
  recipient_entity_id uuid references core_entities(id) on delete set null,
  channel text not null,
  direction text not null check (direction in ('inbound','outbound')),
  body text not null,
  provider_message_id text,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

create table if not exists core_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  recipient_entity_id uuid references core_entities(id) on delete set null,
  notification_type text not null,
  channel text not null,
  title text,
  body text not null,
  scheduled_at timestamptz,
  sent_at timestamptz,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

create table if not exists core_campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  name text not null,
  campaign_type text not null,
  message_template text not null,
  status text not null default 'draft' check (status in ('draft','scheduled','running','paused','completed','cancelled')),
  consent_required boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core_audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  actor_entity_id uuid references core_entities(id) on delete set null,
  action text not null,
  subject_type text,
  subject_id uuid,
  result text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Cross-cutting indexes.
create index if not exists idx_core_entities_tenant_status on core_entities(tenant_id,status);
create index if not exists idx_core_roles_tenant_entity on core_roles(tenant_id,entity_id,status);
create index if not exists idx_core_relationships_tenant_subject on core_relationships(tenant_id,subject_entity_id);
create index if not exists idx_core_products_tenant_status on core_products(tenant_id,status);
create index if not exists idx_core_services_tenant_status on core_services(tenant_id,status);
create index if not exists idx_core_offers_tenant_status on core_offers(tenant_id,status);
create index if not exists idx_core_requests_tenant_status on core_requests(tenant_id,status,created_at desc);
create index if not exists idx_core_orders_tenant_status on core_orders(tenant_id,status,created_at desc);
create index if not exists idx_core_listings_tenant_status on core_listings(tenant_id,status);
create index if not exists idx_core_trades_tenant_status on core_trades(tenant_id,status,created_at desc);
create index if not exists idx_core_opportunities_tenant_status on core_opportunities(tenant_id,status,expires_at);
create index if not exists idx_core_contacts_tenant_active on core_contacts(tenant_id,active);
create index if not exists idx_core_events_tenant_time on core_events(tenant_id,occurred_at desc);
create index if not exists idx_core_consents_tenant_entity on core_consents(tenant_id,entity_id,status);
create index if not exists idx_core_verifications_tenant_subject on core_verifications(tenant_id,subject_type,subject_id,status);
create index if not exists idx_core_cases_tenant_status on core_cases(tenant_id,status,priority);
create index if not exists idx_core_tasks_tenant_status on core_tasks(tenant_id,status,due_at);
create index if not exists idx_core_messages_tenant_time on core_messages(tenant_id,created_at desc);
create index if not exists idx_core_notifications_tenant_status on core_notifications(tenant_id,status,scheduled_at);
create index if not exists idx_core_campaigns_tenant_status on core_campaigns(tenant_id,status);
create index if not exists idx_core_audit_tenant_time on core_audit_events(tenant_id,created_at desc);

-- RLS: every Core table is tenant constrained. Application writes use the server-side service role;
-- authenticated member access is limited to the active tenant.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'core_entities','core_roles','core_relationships','core_products','core_services','core_offers',
    'core_requests','core_orders','core_listings','core_trades','core_opportunities','core_contacts',
    'core_events','core_consents','core_verifications','core_reputations','core_cases','core_tasks',
    'core_workflows','core_messages','core_notifications','core_campaigns','core_audit_events'
  ] LOOP
    EXECUTE format('alter table %I enable row level security', t);
  END LOOP;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'core_entities','core_roles','core_relationships','core_products','core_services','core_offers',
    'core_requests','core_orders','core_listings','core_trades','core_opportunities','core_contacts',
    'core_events','core_consents','core_verifications','core_reputations','core_cases','core_tasks',
    'core_workflows','core_messages','core_notifications','core_campaigns','core_audit_events'
  ] LOOP
    EXECUTE format('create policy %I on %I for select to authenticated using (public.current_tenant_id() = tenant_id)', 'core_member_select_'||t, t);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END LOOP;
END $$;
