-- Phase 2 Knowledge Intelligence
create table if not exists knowledge_sources (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id),
 name text not null, url text not null, authority_class text not null check(authority_class in ('A','B','C','D')),
 source_type text not null, active boolean not null default true, check_interval_minutes integer not null default 360,
 last_checked_at timestamptz, last_changed_at timestamptz, last_fingerprint text, verification_status text not null default 'unverified',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id,url)
);
create table if not exists knowledge_documents (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), source_id uuid not null references knowledge_sources(id) on delete cascade,
 canonical_url text not null, title text, content_hash text not null, retrieved_at timestamptz not null default now(), published_at timestamptz,
 effective_at timestamptz, supersedes_id uuid references knowledge_documents(id), status text not null default 'active' check(status in ('active','superseded','rejected','review')),
 metadata jsonb not null default '{}', unique(tenant_id,canonical_url,content_hash)
);
create table if not exists knowledge_claims (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), document_id uuid not null references knowledge_documents(id) on delete cascade,
 claim text not null, normalized_claim text, confidence numeric(5,4) not null default 0, verified boolean not null default false,
 freshness_score numeric(5,4) not null default 0, valid_from timestamptz, valid_until timestamptz, review_status text not null default 'pending' check(review_status in ('pending','approved','rejected','conflict')),
 created_at timestamptz not null default now()
);
create table if not exists knowledge_conflicts (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), topic text not null,
 claim_ids uuid[] not null, severity text not null default 'medium', status text not null default 'open', resolution text, reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists source_monitor_runs (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), source_id uuid not null references knowledge_sources(id) on delete cascade,
 started_at timestamptz not null default now(), finished_at timestamptz, status text not null default 'running', http_status integer, changed boolean not null default false,
 error text, metadata jsonb not null default '{}'
);
create index if not exists idx_ks_tenant_active on knowledge_sources(tenant_id,active);
create index if not exists idx_kd_source on knowledge_documents(tenant_id,source_id,retrieved_at desc);
create index if not exists idx_kc_review on knowledge_claims(tenant_id,review_status,created_at desc);
create index if not exists idx_kconflict_open on knowledge_conflicts(tenant_id,status,created_at desc);
create index if not exists idx_monitor_due on source_monitor_runs(tenant_id,source_id,started_at desc);
alter table knowledge_sources enable row level security;
alter table knowledge_documents enable row level security;
alter table knowledge_claims enable row level security;
alter table knowledge_conflicts enable row level security;
alter table source_monitor_runs enable row level security;
create policy knowledge_sources_member on knowledge_sources for select to authenticated using(public.current_tenant_id()=tenant_id);
create policy knowledge_documents_member on knowledge_documents for select to authenticated using(public.current_tenant_id()=tenant_id);
create policy knowledge_claims_member on knowledge_claims for select to authenticated using(public.current_tenant_id()=tenant_id and review_status='approved');
create policy knowledge_conflicts_admin on knowledge_conflicts for select to authenticated using(public.has_tenant_role(tenant_id,array['support','institution_admin','platform_operator']));
create policy source_monitor_admin on source_monitor_runs for select to authenticated using(public.has_tenant_role(tenant_id,array['support','institution_admin','platform_operator']));
