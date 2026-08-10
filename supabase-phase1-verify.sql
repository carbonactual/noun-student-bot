-- Phase 1 verification queries. Run after supabase-phase1.sql.
-- These are read-only checks.

-- 1. Tenant exists.
select id, slug, name, status from public.tenants where slug = 'noun';

-- 2. Count any tenant-scoped tables that still have NULL tenant_id.
select 'students' table_name, count(*) null_tenant_rows from students where tenant_id is null
union all select 'deadlines', count(*) from deadlines where tenant_id is null
union all select 'exam_checklists', count(*) from exam_checklists where tenant_id is null
union all select 'help_requests', count(*) from help_requests where tenant_id is null
union all select 'course_content', count(*) from course_content where tenant_id is null
union all select 'faculties', count(*) from faculties where tenant_id is null;

-- 3. Show all tenants and row counts for the primary student table.
select t.slug, t.name, count(s.phone) student_rows
from tenants t
left join students s on s.tenant_id = t.id
group by t.id, t.slug, t.name
order by t.slug;

-- 4. Confirm tenant membership table has no duplicate subject/tenant pairs.
select tenant_id, subject_id, count(*)
from tenant_memberships
group by tenant_id, subject_id
having count(*) > 1;

-- 5. Audit and consent tables should be protected by RLS.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('tenants','tenant_memberships','audit_events','consent_records');

-- 6. Before a second institution is provisioned, inventory legacy policies on every tenant-scoped table.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 7. Final enforcement (DO NOT run until check #2 returns zero for every table):
-- alter table students alter column tenant_id set not null;
-- alter table deadlines alter column tenant_id set not null;
-- alter table exam_checklists alter column tenant_id set not null;
-- alter table help_requests alter column tenant_id set not null;
-- alter table course_content alter column tenant_id set not null;
-- alter table faculties alter column tenant_id set not null;
