-- Phase 1B: tenant authorization/RLS
-- Apply AFTER supabase-phase1.sql and after the application has a real authenticated actor model.
-- Service-role requests bypass RLS; browser/client requests do not.

create or replace function public.current_tenant_member(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships m
    where m.tenant_id = target_tenant
      and m.subject_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.current_tenant_role(target_tenant uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.tenant_memberships m
  where m.tenant_id = target_tenant
    and m.subject_id = auth.uid()
    and m.status = 'active'
  limit 1;
$$;

revoke all on function public.current_tenant_member(uuid) from public;
revoke all on function public.current_tenant_role(uuid) from public;
grant execute on function public.current_tenant_member(uuid) to authenticated;
grant execute on function public.current_tenant_role(uuid) to authenticated;

-- New control-plane tables: only authenticated tenant members can read their own tenant metadata.
create policy tenant_member_read on tenants
for select to authenticated
using (public.current_tenant_member(id));

create policy membership_self_read on tenant_memberships
for select to authenticated
using (subject_id = auth.uid());

create policy audit_member_read on audit_events
for select to authenticated
using (tenant_id is not null and public.current_tenant_member(tenant_id));

create policy consent_self_read on consent_records
for select to authenticated
using (subject_id = auth.uid() and public.current_tenant_member(tenant_id));

-- No client INSERT/UPDATE/DELETE policies are intentionally granted for these control tables.
-- Server-side workflows must use the service role and record audit events.

-- IMPORTANT: Existing tables may still contain legacy public policies from the pre-tenant system.
-- Those policies must be reviewed and replaced before a second institution is provisioned.
-- Do NOT simply add a permissive tenant policy alongside an existing public policy.

-- Recommended final pattern for a tenant-scoped table:
-- CREATE POLICY <table>_tenant_select ON <table>
--   FOR SELECT TO authenticated
--   USING (public.current_tenant_member(tenant_id));
-- CREATE POLICY <table>_tenant_insert ON <table>
--   FOR INSERT TO authenticated
--   WITH CHECK (public.current_tenant_member(tenant_id));
-- CREATE POLICY <table>_tenant_update ON <table>
--   FOR UPDATE TO authenticated
--   USING (public.current_tenant_member(tenant_id))
--   WITH CHECK (public.current_tenant_member(tenant_id));
-- DELETE should normally be prohibited for student/audit data and handled by controlled server workflows.
