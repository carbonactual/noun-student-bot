# NOUN Student Ecosystem v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans (recommended) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn NOUN Student Bot into a personalized student operating layer connecting academics, institutional services, student life, skills, work, student commerce, governance and financial-access discovery around one persistent identity.

**Architecture:** Reuse the existing NOUN tenant, Supabase system of record, Carbon Actual Core primitives, WhatsApp transport and Vercel functions. Add a single student-ecosystem contract, a canonical service/opportunity/event taxonomy, personalized context assembly, unified discovery commands, and domain-safe finance/governance boundaries. Do not add a second database, AI layer or financial execution engine.

**Tech Stack:** Node.js CommonJS, Supabase/Postgres, Vercel Serverless, WhatsApp Business via Zapier, Gemini, existing Carbon Actual Core SQL and domain tables.

**Spec:** `docs/superpowers/specs/2026-09-05-noun-student-ecosystem-v3-design.md`

## Global Constraints

- WhatsApp remains the primary NOUN student communication surface.
- Supabase remains the system of record.
- Existing tenant scoping and RLS must remain intact.
- One persistent person/student identity may own multiple academic programmes and roles.
- Student academic/private data must not be exposed to marketplace participants without explicit student-controlled publication/consent.
- Financial discovery may run in NOUN; loan origination, credit approval, wallet custody, money movement, payment execution, repayment collection and settlement remain outside this repository.
- Open ballot means student governance/election participation, not wagering.
- Consequential actions require explicit approved flows.
- Prefer existing serverless functions and domain modules over new endpoints.
- No portal passwords are stored.

---

### Task 1: Canonical student ecosystem contract

**Files:**
- Existing: `lib/student-ecosystem.js`
- Test: `tests/student-ecosystem.test.js`

**Interfaces:**
- `DOMAINS`, `ALL_CATEGORIES`, `INTENTS`
- `domainForCategory(category)`
- `classifyIntent(text)`
- `financialBoundary(action)`
- `buildStudentHome({identity, academic, preferences})`

- [ ] **Step 1: Write/extend failing tests before any new production behavior**

Add tests for complete category coverage, domain mapping, governance classification, service/commerce classification, and finance boundary.

- [ ] **Step 2: Run the focused test**

Run: `node --test tests/student-ecosystem.test.js`
Expected: any missing behavior fails with a direct assertion rather than a syntax error.

- [ ] **Step 3: Implement only the missing contract behavior**

Keep the existing module as the single intent/domain mapper. Do not duplicate taxonomy inside the WhatsApp handler.

- [ ] **Step 4: Re-run the focused test**

Run: `node --test tests/student-ecosystem.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/student-ecosystem.js tests/student-ecosystem.test.js
git commit -m "feat: establish canonical NOUN student ecosystem contract"
```

### Task 2: Student service and opportunity taxonomy

**Files:**
- Modify: `lib/service-intelligence.js`
- Modify: `lib/abba.js`
- Test: `tests/student-ecosystem.test.js`

**Interfaces:**
- `CATEGORIES`
- `classify(title, text)`
- `classifyEvent(input)`

- [ ] **Step 1: Add failing classifier tests**

Test signatures/signing, photocopying, printing, handouts, training, skills acquisition, sports, excursions, student business, employment, apprenticeship, NYSC, matriculation and graduation/gowns.

- [ ] **Step 2: Run and confirm failure for any missing category**

Run: `node --test tests/student-ecosystem.test.js`

- [ ] **Step 3: Expand the canonical event classifier**

Update `lib/abba.js` so the event model can distinguish governance, student-life, skills, work, commerce, and institutional-service changes while retaining existing academic/policy classifications. Student governance/election signals map to `student_governance` and never to a finance/gambling category.

- [ ] **Step 4: Re-run tests**

Run: `node --test tests/student-ecosystem.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/service-intelligence.js lib/abba.js tests/student-ecosystem.test.js
git commit -m "feat: expand NOUN student service and life taxonomy"
```

### Task 3: Personalized student context assembler

**Files:**
- Create: `lib/student-context.js`
- Test: `tests/student-context.test.js`

**Interfaces:**
- `buildStudentContext(student, programmes, activity, preferences) -> context`

- [ ] **Step 1: Write failing tests**

Test that certificate, undergraduate, PGD, master's and doctoral students produce pathway-aware context; that multiple programmes are preserved; that status and completion state are included; and that private marketplace exposure is absent by default.

- [ ] **Step 2: Run and confirm failure**

Run: `node --test tests/student-context.test.js`
Expected: FAIL because `buildStudentContext` does not exist.

- [ ] **Step 3: Implement minimal context assembler**

Return identity, programmes, primary academic state, current courses where available, activity-derived interests, notification preferences, support status and explicit publication/consent flags. Never copy private academic fields into public provider profile fields automatically.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/student-context.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/student-context.js tests/student-context.test.js
git commit -m "feat: add personalized NOUN student context assembler"
```

### Task 4: Unified discovery and student-value commands

**Files:**
- Modify: `api/whatsapp-webhook.js`
- Test: `tests/student-value-routing.test.js`
- Documentation: `docs/WHATSAPP_VALUE_NETWORK_COMMANDS.md`

**Interfaces:**
- Canonical intents from `lib/student-ecosystem.js`.
- Commands/intents: `services`, `opportunities`, `events`, `skills`, `business`, `marketplace`, `finance`, `governance`, `sports`, `human`.

- [ ] **Step 1: Write failing routing tests**

Test messages such as “I need photocopying”, “show internships”, “find skills training”, “student marketplace”, “sports this week”, “student election ballot”, and “student finance options” route to the canonical intent/domain.

- [ ] **Step 2: Run and confirm failure**

Run: `node --test tests/student-value-routing.test.js`
Expected: FAIL for unsupported routes.

- [ ] **Step 3: Implement routing through the canonical contract**

The webhook should resolve an intent, load personalized context, query the appropriate existing domain table/module, return a bounded result, and offer human escalation when data is missing/conflicting or the requested action is consequential. Keep idempotency and opt-in checks.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/student-value-routing.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/whatsapp-webhook.js tests/student-value-routing.test.js docs/WHATSAPP_VALUE_NETWORK_COMMANDS.md
git commit -m "feat: route NOUN WhatsApp into unified student value network"
```

### Task 5: Student events, clubs, sports, excursions and governance data contract

**Files:**
- Create: `supabase-student-life.sql`
- Test: `tests/student-life-schema.test.js`
- Documentation: `docs/STUDENT_LIFE_AND_GOVERNANCE.md`

**Interfaces:**
- Tables: `student_events`, `student_event_participants`, `student_groups`, `student_group_memberships`, `student_governance_cycles`, `student_governance_candidates`, `student_ballot_publication`.

- [ ] **Step 1: Write schema-contract tests**

Test required columns: tenant scope, source/verification metadata, start/end dates, eligibility, capacity where applicable, consent, status, and audit timestamps. Governance tables must distinguish election cycle, candidate information and ballot instructions from any financial activity.

- [ ] **Step 2: Run schema-contract tests**

Run: `node --test tests/student-life-schema.test.js`
Expected: FAIL until migration text contains the required contracts.

- [ ] **Step 3: Write the SQL migration**

Use tenant-scoped UUIDs, RLS, verification status and source fields. Participation records must not reveal private student information by default. Do not create wagering, odds, stake or payout tables.

- [ ] **Step 4: Re-run tests**

Run: `node --test tests/student-life-schema.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase-student-life.sql tests/student-life-schema.test.js docs/STUDENT_LIFE_AND_GOVERNANCE.md
git commit -m "feat: add NOUN student life and governance contracts"
```

### Task 6: Student skills, work and apprenticeship contract

**Files:**
- Create: `supabase-student-opportunities.sql`
- Test: `tests/student-opportunities.test.js`
- Documentation: `docs/STUDENT_OPPORTUNITIES.md`

**Interfaces:**
- Tables: `student_skills`, `skill_opportunities`, `work_opportunities`, `student_opportunity_interests`, `student_opportunity_matches`.

- [ ] **Step 1: Write failing tests**

Test support for skills acquisition, training providers, apprenticeships, internships, SIWES, employment, NYSC information and scholarship/grant opportunity categories; require source verification and expiry/freshness fields.

- [ ] **Step 2: Run focused tests**

Run: `node --test tests/student-opportunities.test.js`
Expected: FAIL until all categories/contracts exist.

- [ ] **Step 3: Implement migration and matching contract**

Use the existing opportunity/service concepts where possible. Store skill interests separately from academic records and preserve user-controlled visibility. Match on actual eligibility, skills, location/remote compatibility, availability and verification before ecosystem preference.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/student-opportunities.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase-student-opportunities.sql tests/student-opportunities.test.js docs/STUDENT_OPPORTUNITIES.md
git commit -m "feat: add NOUN skills and work opportunity network"
```

### Task 7: Student marketplace and business participation

**Files:**
- Extend existing: `supabase-phase2-peer-economy.sql`
- Create: `tests/student-marketplace.test.js`
- Create/modify: `lib/service-matching.js`

**Interfaces:**
- Existing provider/request/match records plus marketplace visibility flags.
- `rankProviders(request, providers) -> matches[]`

- [ ] **Step 1: Write failing matching tests**

Verify skill/category match, service quality/verification, availability, location/remote support, safety flags, and student-controlled public visibility. Academic programme/grade should never be used as a hidden ranking boost.

- [ ] **Step 2: Run focused tests**

Run: `node --test tests/student-marketplace.test.js`
Expected: FAIL because `lib/service-matching.js` is not yet implemented or does not satisfy the contract.

- [ ] **Step 3: Implement deterministic explainable matching**

Keep service requests, offers and marketplace listings separate from academic records. Preserve provider consent, reputation and dispute paths.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/student-marketplace.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase-phase2-peer-economy.sql lib/service-matching.js tests/student-marketplace.test.js
git commit -m "feat: strengthen NOUN student marketplace matching"
```

### Task 8: Nano-finance discovery and I/O boundary

**Files:**
- Modify: existing financial-access SQL contract
- Modify: `lib/core-capabilities.js`
- Test: `tests/student-finance-boundary.test.js`
- Documentation: `docs/STUDENT_NANO_FINANCE.md`

**Interfaces:**
- `financialBoundary(action)`
- financial-opportunity discovery/interest remains read/explain/refer only.

- [ ] **Step 1: Write failing boundary tests**

Require discovery of student finance, grants, device funding and financial education while rejecting origination, credit approval, money movement, payment execution, wallet operations, repayment collection and settlement.

- [ ] **Step 2: Run focused tests**

Run: `node --test tests/student-finance-boundary.test.js`
Expected: FAIL until all boundary actions are represented.

- [ ] **Step 3: Implement contract updates**

Use current `financial_opportunities`, `financial_interests`, `financial_access_events` and `peer_finance_interest` concepts. Do not import I/O wallet/ledger/payment code into NOUN. Future Nano Finance experiments are discovery/eligibility records until an explicit I/O integration exists.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/student-finance-boundary.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/core-capabilities.js tests/student-finance-boundary.test.js docs/STUDENT_NANO_FINANCE.md
# include any reviewed SQL migration changes
git commit -m "feat: formalize NOUN student nano-finance boundary"
```

### Task 9: Dashboard and operational visibility

**Files:**
- Modify: `api/dashboard.js`
- Modify: `dashboard/index.html`
- Test: `tests/dashboard-student-ecosystem.test.js`

**Interfaces:**
- Aggregate metrics for academic demand, services, events, skills, opportunities, marketplace, governance and financial-discovery interest.

- [ ] **Step 1: Write failing dashboard tests**

Require aggregate-only ecosystem cards and counts with no raw phones or private academic fields.

- [ ] **Step 2: Run focused tests**

Run: `node --test tests/dashboard-student-ecosystem.test.js`
Expected: FAIL until the response contains the new aggregate blocks.

- [ ] **Step 3: Implement dashboard aggregates**

Reuse existing dashboard patterns and tenant scoping. Surface source freshness, opportunity/service demand, outbound health and human escalation counts.

- [ ] **Step 4: Run tests**

Run: `node --test tests/dashboard-student-ecosystem.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/dashboard.js dashboard/index.html tests/dashboard-student-ecosystem.test.js
git commit -m "feat: expose unified NOUN student ecosystem operations"
```

### Task 10: Documentation, full verification and deployment gate

**Files:**
- Modify: `README.md`
- Modify: `docs/PHASE2_BUILD_COMPLETE.md`
- Create: `docs/NOUN_STUDENT_ECOSYSTEM_V3.md`
- Tests: all `tests/*.test.js`

- [ ] **Step 1: Document the complete product contract**

Update the README so NOUN Student Bot is described as a student operating/value layer rather than only a WhatsApp bot. Include the full pathway ladder and the new service/life/skills/work/commerce/governance/economic-access domains.

- [ ] **Step 2: Run the full test suite**

Run: `node --test tests/*.test.js`
Expected: PASS.

- [ ] **Step 3: Verify repository security and architecture**

Confirm no portal passwords, provider secrets, wallet/ledger/payment execution code, wagering tables, or retired architecture reappears.

- [ ] **Step 4: Verify deployment**

Confirm the Vercel production deployment reaches `READY` and the final commit is the deployed commit.

- [ ] **Step 5: Verify production health boundaries**

Check `/api/health` and the aggregate dashboard; confirm errors are not introduced by the final build. Verify WhatsApp routing changes are tenant-scoped and idempotent.

- [ ] **Step 6: Commit documentation/final fixes**

```bash
git add README.md docs/PHASE2_BUILD_COMPLETE.md docs/NOUN_STUDENT_ECOSYSTEM_V3.md
git commit -m "docs: finalize NOUN student ecosystem v3"
```
