# Phase 1 Completion Gate

Phase 1 is complete only when all of the following have evidence from the live Supabase project and application runtime.

1. `noun` tenant exists.
2. Every tenant-scoped production row has a non-null tenant_id.
3. `tenant_id` is NOT NULL on all tenant-scoped tables.
4. RLS is enabled on every tenant-scoped table.
5. No permissive public/anon tenant-data policy remains.
6. Authenticated tenant members can access only their tenant.
7. A second test tenant cannot read or mutate NOUN rows.
8. Student access is limited to authorized student scope.
9. Institution admins cannot cross tenant boundaries.
10. Platform operators have explicit role-based access and audit coverage.
11. Privileged mutations generate audit events.
12. Consent is purpose-specific and withdrawal is honored by optional communication paths.
13. Webhook authentication rejects invalid secrets.
14. Service-role credentials are server-only.
15. Rate limiting is active for inbound webhook/API traffic.
16. Backups and restore procedure have been tested.
17. WhatsApp webhook, automation, outbound acknowledgement and portal/API routes use tenant-aware access patterns.
18. Production smoke tests pass for onboarding, profile, deadlines, human escalation, campaigns and outbound delivery.

The repository can contain the migration and code gates before live execution, but the phase must not be described as production-complete until these runtime/database conditions are evidenced.
