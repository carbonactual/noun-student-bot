# Phase 1 Execution — Tenant, Identity, Security

## Status

Migration prepared in `supabase-phase1.sql` and intentionally staged. It must be reviewed/executed against the live Supabase project before application code begins relying on tenant isolation.

## Order of operations

1. Backup/export the live database.
2. Run `supabase-phase1.sql` in Supabase SQL Editor or migration pipeline.
3. Verify every existing NOUN row has `tenant_id` pointing to the `noun` tenant.
4. Verify no rows remain with null `tenant_id` in tenant-scoped tables.
5. Add authenticated RLS policies based on tenant membership.
6. Add server-side request context that resolves tenant + actor + role.
7. Replace application queries that do not filter by tenant with tenant-scoped repositories.
8. Add audit writes for administrative and consequential operations.
9. Add consent checks to campaigns, insights and non-essential communications.
10. Add webhook signature verification and rate limiting.
11. Test cross-tenant access denial before adding a second institution.
12. Only after tests pass, enforce `tenant_id NOT NULL` on tenant-scoped tables.

## Why this is staged

Existing production rows currently have no tenant key. Enforcing NOT NULL immediately would break deployment or require unsafe assumptions. The migration therefore creates the boundary, backfills NOUN, and leaves enforcement for the verification step.

## Identity model

`tenant_memberships.subject_id` is intentionally an application identity identifier rather than a phone number. WhatsApp phone numbers are communication identifiers, not a sufficient authorization model for administrators.

Recommended roles:

- student
- support
- department_admin
- faculty_admin
- institution_admin
- platform_operator

## Security invariants

- Service-role secrets never reach browser/WhatsApp clients.
- Tenant data cannot be selected, updated or deleted outside an authorized tenant context.
- Audit records are append-oriented and not student-editable.
- Consent is purpose-specific.
- Campaigns require the appropriate communication consent and institutional approval where required.
- Student-specific intelligence must not leak into aggregate institution or platform analytics.
- Human contact data must carry provenance and verification metadata.

## Phase 1 acceptance tests

- NOUN is a tenant.
- All current NOUN rows have tenant_id.
- Authenticated institution admin can only access NOUN rows.
- A simulated second tenant cannot read NOUN rows.
- Student can only access their authorized student scope.
- Platform operator can access tenant metadata without bypassing audit requirements.
- Consent withdrawal prevents the corresponding optional communication path.
- Every privileged mutation produces an audit event.
- Invalid/unsigned webhook requests are rejected.
- Rate limits prevent uncontrolled repeated webhook/API calls.

## Do not mark Phase 1 complete until the tests above are evidenced.
