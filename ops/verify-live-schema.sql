-- NOUN BOT live schema invariant verification
-- Run against the canonical omnii-canonical Supabase project with a privileged connection.

with required(name) as (
  values
    ('tenants'),('tenant_memberships'),('audit_events'),('app_accounts'),
    ('students'),('past_questions'),('exams'),('practice_attempts'),
    ('student_support_cases'),('source_monitor_runs'),('opportunities'),
    ('student_services'),('intelligence_signals'),('noun_events'),('noun_pulses'),
    ('noun_human_escalations'),('student_course_enrolments'),
    ('student_study_questions'),('student_study_notes'),('student_learning_sessions'),
    ('student_alerts'),('student_notifications'),('student_form_catalog'),
    ('student_requests'),('student_request_documents'),('learning_media'),
    ('mock_assessments'),('mock_assessment_questions'),('mock_attempts'),
    ('physical_service_requests'),('study_space_requests'),
    ('authorized_representation_requests'),('financial_learning_resources'),
    ('noun_student_roles'),('noun_provider_profiles'),('noun_domain_links'),
    ('noun_financial_access_refs')
)
select
  count(*) filter (where to_regclass('public.'||name) is null) as missing_tables,
  count(*) filter (where to_regclass('public.'||name) is not null) as present_tables
from required;

select
  count(*) filter (where not c.relrowsecurity) as rls_disabled_tables,
  count(*) as tenant_bound_tables
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relkind='r'
  and exists (
    select 1
    from pg_attribute a
    where a.attrelid=c.oid
      and a.attname='tenant_id'
      and a.attnum>0
      and not a.attisdropped
  );

select
  (select count(*) from public.omnii_registry_nodes where node_type='domain_scope') as domain_scope_nodes,
  (select count(*) from public.omnii_scope_records) as scope_records,
  (select count(*) from public.omnii_registry_nodes n
    where n.node_type='domain_scope'
    and not exists(select 1 from public.omnii_scope_records s where s.id=n.id)) as scope_projection_gaps,
  (select count(*) from public.omnii_registry_nodes n
    where n.node_type='capability_family'
    and not exists(
      select 1 from public.omnii_registry_edges e
      where (e.source_node=n.id or e.target_node=n.id)
      and e.relationship_type in('groups','contains','belongs_to')
    )) as ungrouped_capabilities,
  (select count(*) from public.omnii_registry_edges e
    left join public.omnii_registry_nodes s on s.id=e.source_node
    left join public.omnii_registry_nodes t on t.id=e.target_node
    where s.id is null or t.id is null) as dangling_registry_edges;
