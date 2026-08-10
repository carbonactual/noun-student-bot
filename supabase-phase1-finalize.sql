-- PHASE 1 FINALIZATION
-- Execute only after supabase-phase1.sql has been run and verification returns zero NULL tenant_id rows.

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tm.tenant_id
  from public.tenant_memberships tm
  where tm.subject_id = auth.uid()
    and tm.status = 'active'
  order by tm.created_at asc
  limit 1
$$;

create or replace function public.is_tenant_member(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_memberships tm
    where tm.tenant_id = target_tenant
      and tm.subject_id = auth.uid()
      and tm.status = 'active'
  )
$$;

create or replace function public.has_tenant_role(target_tenant uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_memberships tm
    where tm.tenant_id = target_tenant
      and tm.subject_id = auth.uid()
      and tm.status = 'active'
      and tm.role = any(allowed_roles)
  )
$$;

-- Replace permissive public policies on tenant-scoped tables with authenticated tenant membership.
do $$
declare t text;
begin
  foreach t in array array[
    'students','deadlines','exam_checklists','help_requests','course_content','faculties',
    'campaigns','campaign_messages','student_activity','student_preferences','insights',
    'academic_faculties','academic_departments','programmes','courses','programme_courses',
    'course_offerings','knowledge_sources','knowledge_claims','noun_policies','academic_events','assessments'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists public_all on public.%I', t);
    execute format('drop policy if exists public_access on public.%I', t);
    execute format('drop policy if exists anon_all on public.%I', t);
    execute format('drop policy if exists authenticated_tenant_access on public.%I', t);
    execute format('create policy authenticated_tenant_access on public.%I for all to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id))', t);
  end loop;
end $$;

-- Service-role backend access remains possible because Supabase service role bypasses RLS.
-- Browser clients must use authenticated JWTs and cannot use the service-role key.

-- Protect tenant metadata and membership administration.
drop policy if exists tenant_member_read on public.tenant_memberships;
create policy tenant_member_read on public.tenant_memberships for select to authenticated using (public.is_tenant_member(tenant_id));

drop policy if exists tenant_self_insert on public.tenant_memberships;
create policy tenant_self_insert on public.tenant_memberships for insert to authenticated with check (subject_id = auth.uid() and public.has_tenant_role(tenant_id, array['institution_admin','platform_operator']));

drop policy if exists tenant_admin_update on public.tenant_memberships;
create policy tenant_admin_update on public.tenant_memberships for update to authenticated using (public.has_tenant_role(tenant_id, array['institution_admin','platform_operator'])) with check (public.has_tenant_role(tenant_id, array['institution_admin','platform_operator']));

drop policy if exists tenant_admin_delete on public.tenant_memberships;
create policy tenant_admin_delete on public.tenant_memberships for delete to authenticated using (public.has_tenant_role(tenant_id, array['institution_admin','platform_operator']));

-- Audit events are readable by authorized institution/platform roles but never mutable from clients.
drop policy if exists audit_read on public.audit_events;
create policy audit_read on public.audit_events for select to authenticated using (public.has_tenant_role(tenant_id, array['institution_admin','platform_operator','faculty_admin','department_admin','support']));

-- Consent is private to the subject or authorized institution roles.
drop policy if exists consent_read on public.consent_records;
create policy consent_read on public.consent_records for select to authenticated using (
  subject_id = auth.uid() or public.has_tenant_role(tenant_id, array['institution_admin','platform_operator'])
);

drop policy if exists consent_insert on public.consent_records;
create policy consent_insert on public.consent_records for insert to authenticated with check (
  subject_id = auth.uid() and public.is_tenant_member(tenant_id)
);

drop policy if exists consent_update on public.consent_records;
create policy consent_update on public.consent_records for update to authenticated using (subject_id = auth.uid()) with check (subject_id = auth.uid());

-- Final tenant enforcement after successful backfill.
do $$
declare t text;
begin
  foreach t in array array[
    'students','deadlines','exam_checklists','help_requests','course_content','faculties',
    'campaigns','campaign_messages','student_activity','student_preferences','insights',
    'academic_faculties','academic_departments','programmes','courses','programme_courses',
    'course_offerings','knowledge_sources','knowledge_claims','noun_policies','academic_events','assessments'
  ] loop
    if exists (select 1 from pg_attribute where attrelid=format('public.%I',t)::regclass and attname='tenant_id' and attnotnull=false) then
      execute format('alter table public.%I alter column tenant_id set not null', t);
    end if;
  end loop;
end $$;

-- Prevent accidental cross-tenant updates through application-level APIs.
create index if not exists idx_membership_tenant_subject on public.tenant_memberships(tenant_id,subject_id,status);
