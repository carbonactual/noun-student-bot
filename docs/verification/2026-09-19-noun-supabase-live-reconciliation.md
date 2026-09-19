# NOUN BOT — Live Supabase Reconciliation Record
Date: 2026-09-19

## Connection

NOUN BOT uses the active Supabase project `omnii-canonical`. The project is also Carbon Actual's canonical shared database.

Constitutional authority:
`carbonactual/hapi-world/CANON.md`

Semantic operating-spine:
`carbonactual/carbonactual`

## Applied NOUN database sequence

The live project records these NOUN-specific migrations:

1. `noun_base_application_schema_reconciliation_20260919`
2. `noun_tenant_foundation_dependency_safe_20260919b`
3. `noun_private_tenant_authority_and_rls_20260919`
4. `noun_operating_learning_alert_surfaces_20260919`
5. `noun_student_ecosystem_v4_canonical_20260919`
6. `noun_services_signals_and_valuechain_composition_20260919`
7. `noun_runtime_dependency_closure_20260919c`

Additional Carbon Actual database controls applied around the NOUN deployment include tenant policy hygiene, FK coverage, catalog policy deduplication, exact duplicate-index cleanup, and tenant-membership policy splitting.

## Compatibility decisions

NOUN is composed into the Carbon Actual shared model rather than establishing a competing ontology.

- Existing `consent_records` was extended rather than replaced.
- Existing `knowledge_sources` / `knowledge_claims` bigint identifiers were preserved.
- Existing `programmes.id` bigint identifiers were preserved.
- NOUN provider profiles reference existing Carbon Actual `omnii_objects`.
- Student service, value-chain, event, Pulse and escalation records are tenant-bound.
- Internal queues and derived evidence are not client-writable.
- Public academic catalog read policies remain separate from private student state.

## Required live surfaces

The following runtime dependency families are present:

- tenant and membership
- student identity/account linkage
- academic catalogue
- course/study continuity
- past questions and exams
- practice attempts
- support cases
- service discovery
- opportunities
- knowledge-source monitoring
- event and Pulse records
- alerts and notifications
- human ABBA escalations
- student roles/provider profiles/domain links
- financial-access references
- ABBA session continuity

## Security

Student-specific API routes require authenticated identity.

Internal webhook/automation surfaces fail closed without their configured shared secrets.

RLS is enabled on NOUN tenant-bound tables, with private tenant/role helpers used for policy decisions.

No credentials or secret values are stored in registry or migration metadata.

## Verification target

The live invariants are:

- no missing NOUN runtime dependency tables
- no tenantless legacy NOUN records requiring tenant assignment
- zero domain-scope projection gaps
- zero ungrouped capability families
- zero dangling registry edges

## Residual provider-managed issue

Supabase continues to report PostGIS objects in the public schema, including `spatial_ref_sys` and the managed `st_estimatedextent` SECURITY DEFINER overloads.

These are tracked in:
`ops/SUPABASE_POSTGIS_HARDENING_REQUEST.md`

Do not resolve them with an unapproved extension drop/recreate. Use the supported provider-assisted relocation procedure.

## Rebuild rule

This record is an audit map, not a second source of truth. The executable database migrations and canonical Carbon Actual contracts remain authoritative for implementation semantics.
