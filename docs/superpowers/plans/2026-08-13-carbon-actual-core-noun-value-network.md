# Carbon Actual Core + NOUN Value Network Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a reusable Carbon Actual Core data contract and wire the NOUN bot to shared commerce, service, opportunity, communication, trust and intelligence primitives without importing Carbon Actual I/O financial execution.

**Architecture:** Core primitives live in shared SQL/contracts; NOUN owns academic/institutional extensions; ABBA consumes evidence-backed domain services; WhatsApp remains primary delivery and Vercel remains operational/aggregate portal. Financial execution remains an external I/O boundary.

**Tech Stack:** Supabase Postgres, Vercel serverless, Node.js, WhatsApp Business via Zapier, Gemini, GitHub.

## Global Constraints

- Core primitives must be tenant-scoped where applicable.
- Product-specific schemas reference Core primitives instead of redefining them.
- No portal passwords.
- No autonomous exam/assignment submission.
- No autonomous financial approval, lending, payment, wallet or settlement execution in NOUN.
- WhatsApp remains the primary student communication surface.
- Vercel browser APIs must not expose the Supabase service-role key.
- Consequential actions require explicit authorized flows.

---

### Task 1: Core ontology SQL

**Files:**
- Create: `carbon-actual-core.sql`
- Test: Supabase SQL execution and information-schema checks

**Interfaces:**
- Produces: `core_entities`, `core_roles`, `core_relationships`, `core_products`, `core_services`, `core_offers`, `core_requests`, `core_orders`, `core_listings`, `core_trades`, `core_opportunities`, `core_contacts`, `core_events`, `core_consents`, `core_verifications`, `core_reputations`, `core_cases`, `core_tasks`, `core_workflows`, `core_messages`, `core_notifications`, `core_campaigns`, `core_audit_events`.

- [ ] Create tables with UUID identifiers, tenant_id where domain-owned, lifecycle status, created_at and updated_at.
- [ ] Add foreign keys for product/service/offer/request/order/listing/trade relationships.
- [ ] Add indexes for tenant, status and creation timestamps.
- [ ] Enable RLS on every Core table.
- [ ] Add tenant-member read policies and owner/role-restricted mutation policies where applicable.
- [ ] Add uniqueness constraints for slugs and tenant-scoped natural identifiers.
- [ ] Run SQL against Supabase when connectivity is available; if the connector times out, preserve the migration and report execution status rather than claiming deployment.
- [ ] Commit the migration.

### Task 2: NOUN value-chain adapters

**Files:**
- Create: `supabase-noun-valuechain.sql`
- Modify: `docs/PHASE2_IMPLEMENTATION_MATRIX.md`

**Interfaces:**
- Produces: NOUN-specific references from students/programmes/courses/services/opportunities to Core IDs.

- [ ] Add student role profiles for learner, entrepreneur, employee, freelancer, provider and opportunity seeker.
- [ ] Add service-provider references to `core_entities` and `core_services`.
- [ ] Add opportunity references to `core_opportunities`.
- [ ] Add student business/provider consent and visibility state.
- [ ] Add marketplace participation without exposing academic/private fields.
- [ ] Add explicit financial-access reference fields that point to verified external products without executing finance.
- [ ] Add indexes and RLS.
- [ ] Validate referential integrity.

### Task 3: ABBA capability contract

**Files:**
- Create: `lib/core-capabilities.js`
- Create: `docs/ABBA_CAPABILITY_MATRIX.md`

**Interfaces:**
- Produces: `canPerform(capability, context)` and `requiresApproval(capability)`.

- [ ] Encode read/analyze/classify/organize/monitor/recommend/report as autonomous capabilities.
- [ ] Encode publish/delete/submit/pay/approve-credit/execute-trade as approval-required capabilities.
- [ ] Encode source evidence requirements for consequential factual answers.
- [ ] Add unit tests for every capability class.

### Task 4: Commerce and peer matching contract

**Files:**
- Create: `lib/service-matching.js`
- Create: `tests/service-matching.test.js`

**Interfaces:**
- `rankProviders(request, providers) -> matches[]`.

- [ ] Test category and skill match.
- [ ] Test location/remote compatibility.
- [ ] Test qualification and verification weighting.
- [ ] Test availability and response reliability weighting.
- [ ] Test student ecosystem preference as a secondary signal only.
- [ ] Test safety/eligibility exclusion.
- [ ] Implement deterministic ranking with explainable reasons.

### Task 5: Knowledge-to-ABBA bridge

**Files:**
- Create: `lib/knowledge-answer-contract.js`
- Modify: existing Gemini retrieval handler identified by repository search
- Create: `tests/knowledge-answer-contract.test.js`

**Interfaces:**
- `selectEvidence(claims, threshold) -> evidence[]`.
- `buildAnswerContext(question, evidence) -> context`.

- [ ] Reject unverified claims for authoritative answers.
- [ ] Downgrade stale evidence.
- [ ] Preserve source URL, authority, retrieval time and effective date internally.
- [ ] Refuse silent conflict resolution.
- [ ] Add fallback to human support for unresolved consequential questions.

### Task 6: WhatsApp value-network commands

**Files:**
- Modify: existing WhatsApp webhook command router
- Create: `docs/WHATSAPP_VALUE_NETWORK_COMMANDS.md`

**Interfaces:**
- Commands: `services`, `offer`, `request`, `opportunities`, `finance`, `contact human`.

- [ ] Add read-only discovery commands first.
- [ ] Add provider opt-in/opt-out controls.
- [ ] Add request creation with tenant and requester identity.
- [ ] Add bounded result sets.
- [ ] Add human escalation for disputes and consequential actions.
- [ ] Preserve message idempotency.

### Task 7: Vercel operations surface

**Files:**
- Modify: aggregate dashboard API
- Create: dashboard sections for source health, opportunities, peer economy and queue health where the existing dashboard architecture permits

- [ ] Expose aggregate operational metrics only.
- [ ] Show source freshness and conflict counts.
- [ ] Show service/opportunity request volumes without exposing private student data.
- [ ] Show campaign and outbound queue health.
- [ ] Show human escalation queue counts.

### Task 8: Source and scheduled-worker integration

**Files:**
- Create/modify: source collector modules and scheduled endpoints found by repository search
- Create: `docs/SOURCE_MONITORING_CONTRACT.md`

- [ ] Register authoritative NOUN source families.
- [ ] Implement fetch/fingerprint/change detection.
- [ ] Persist monitor runs.
- [ ] Prevent unchanged sources from creating duplicate claims.
- [ ] Create review events for conflicts/stale authoritative sources.
- [ ] Feed only validated claims to ABBA retrieval.

### Task 9: Testing and production gate

**Files:**
- Create: `tests/core-tenant-isolation.test.js`
- Create: `tests/capability-boundaries.test.js`
- Create: `docs/PHASE2_PRODUCTION_GATE.md`

- [ ] Verify every Core table has tenant isolation.
- [ ] Verify service-provider consent.
- [ ] Verify financial execution is unreachable from NOUN intelligence endpoints.
- [ ] Verify WhatsApp duplicate events are idempotent.
- [ ] Verify evidence-backed answers.
- [ ] Verify campaign opt-in.
- [ ] Verify human escalation.
- [ ] Verify no secret values appear in repository files.
- [ ] Verify deployment before claiming production readiness.
