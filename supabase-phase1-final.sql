-- PHASE 1 FINAL ENFORCEMENT
-- Execute only after supabase-phase1.sql has been run and its verification passes.
-- This migration closes the public-read/public-write hole for tenant-scoped data.

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tm.tenant_id
  from public.tenant_memberships tm
  where tm.subject_id = auth.uid() and tm.status = 'active'
  limit 1
$$;

create or replace function public.has_tenant_role(p_tenant uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_memberships tm
    where tm.tenant_id = p_tenant
      and tm.subject_id = auth.uid()
      and tm.status = 'active'
      and tm.role = any(p_roles)
  )
$$;

revoke all on function public.current_tenant_id() from public;
revoke all on function public.has_tenant_role(uuid,text[]) from public;
grant execute on function public.current_tenant_id() to authenticated;
grant execute on function public.has_tenant_role(uuid,text[]) to authenticated;

-- Remove the old permissive public policies. Server-side webhook operations use the service role.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname='public'
      and tablename in ('students','deadlines','exam_checklists','help_requests','course_content','faculties','campaigns','campaign_messages','student_activity','student_preferences','insights','academic_faculties','academic_departments','programmes','courses','programme_courses','course_offerings','knowledge_sources','knowledge_claims','noun_policies','academic_events','assessments')
      and (policyname ilike '%public%' or policyname ilike '%anon%' or policyname ilike '%all%')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Enable RLS everywhere in the tenant surface.
do $$
declare t text;
begin
  foreach t in array array['students','deadlines','exam_checklists','help_requests','course_content','faculties','campaigns','campaign_messages','student_activity','student_preferences','insights','academic_faculties','academic_departments','programmes','courses','programme_courses','course_offerings','knowledge_sources','knowledge_claims','noun_policies','academic_events','assessments']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Generic authenticated tenant policies. Students are intentionally restricted to their own row.
create policy students_select_own on public.students for select to authenticated
using (tenant_id = public.current_tenant_id() and phone = coalesce(auth.jwt()->>'phone',''));
create policy students_update_own on public.students for update to authenticated
using (tenant_id = public.current_tenant_id() and phone = coalesce(auth.jwt()->>'phone',''))
with check (tenant_id = public.current_tenant_id());

create policy students_admin_all on public.students for all to authenticated
using (public.has_tenant_role(tenant_id, array['support','department_admin','faculty_admin','institution_admin','platform_operator']))
with check (public.has_tenant_role(tenant_id, array['support','department_admin','faculty_admin','institution_admin','platform_operator']));

-- Non-student tenant data is available only to authenticated members with institutional/platform roles.
do $$
declare t text;
begin
  foreach t in array array['deadlines','exam_checklists','help_requests','course_content','faculties','campaigns','campaign_messages','student_activity','student_preferences','insights','academic_faculties','academic_departments','programmes','courses','programme_courses','course_offerings','knowledge_sources','knowledge_claims','noun_policies','academic_events','assessments']
  loop
    execute format('create policy %I on public.%I for select to authenticated using (public.has_tenant_role(tenant_id, array[''support'',''department_admin'',''faculty_admin'',''institution_admin'',''platform_operator'']))', 'tenant_member_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_tenant_role(tenant_id, array[''support'',''department_admin'',''faculty_admin'',''institution_admin'',''platform_operator'']))', 'tenant_member_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_tenant_role(tenant_id, array[''support'',''department_admin'',''faculty_admin'',''institution_admin'',''platform_operator''])) with check (public.has_tenant_role(tenant_id, array[''support'',''department_admin'',''faculty_admin'',''institution_admin'',''platform_operator'']))', 'tenant_member_update', t);
  end loop;
end $$;

-- Consent/audit are never public.
create policy consent_own_select on public.consent_records for select to authenticated
using (tenant_id = public.current_tenant_id() and subject_id = auth.uid());
create policy consent_own_insert on public.consent_records for insert to authenticated
with check (tenant_id = public.current_tenant_id() and subject_id = auth.uid());
create policy consent_own_update on public.consent_records for update to authenticated
using (tenant_id = public.current_tenant_id() and subject_id = auth.uid())
with check (tenant_id = public.current_tenant_id() and subject_id = auth.uid());
create policy consent_admin_select on public.consent_records for select to authenticated
using (public.has_tenant_role(tenant_id, array['support','institution_admin','platform_operator']));

create policy audit_admin_select on public.audit_events for select to authenticated
using (public.has_tenant_role(tenant_id, array['institution_admin','platform_operator']));

-- Final integrity: every existing tenant-scoped row must belong to a tenant.
do $$
declare t text; n bigint;
begin
  foreach t in array array['students','deadlines','exam_checklists','help_requests','course_content','faculties','campaigns','campaign_messages','student_activity','student_preferences','insights','academic_faculties','academic_departments','programmes','courses','programme_courses','course_offerings','knowledge_sources','knowledge_claims','noun_policies','academic_events','assessments']
  loop
    execute format('select count(*) from public.%I where tenant_id is null', t) into n;
    if n > 0 then raise exception 'Phase 1 blocked: % rows in % have null tenant_id', n, t; end if;
    execute format('alter table public.%I alter column tenant_id set not null', t);
  end loop;
end $$;
