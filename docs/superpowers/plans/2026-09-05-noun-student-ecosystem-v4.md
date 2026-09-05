# NOUN Student Ecosystem V4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand NOUN Student Bot into a complete student operating environment covering academic learning, requests/forms, physical study-centre services, research, skills, career, commerce, community, governance and economic access.

**Architecture:** Reuse the existing tenant-scoped identity, knowledge, event, marketplace and outbound primitives. Add focused domain contracts for stateful capabilities instead of creating a new database or AI orchestration layer. Keep regulated finance/investment execution and consequential institutional actions outside autonomous NOUN intelligence.

**Tech Stack:** Node.js/Vercel serverless APIs, Supabase/Postgres, existing WhatsApp transport, existing knowledge/ABBA modules.

**Spec:** `docs/NOUN_STUDENT_ECOSYSTEM_SCOPE_V4.md`

## Global Constraints

- Preserve one persistent student identity and multi-programme context.
- Every data read/write remains tenant-scoped.
- Official institutional claims carry provenance, authority and freshness metadata.
- Mock assessments are practice only; never complete live graded work or examinations.
- Authorized representatives may perform only explicitly permitted, scoped errands; no exam attendance or impersonation.
- NOUN intelligence may discover/explain financial and investment opportunities but does not originate credit, move money, operate wallets, settle transactions or execute investments.
- Marketplace exposure is opt-in and must not leak private academic fields.
- Consequential institutional submission requires explicit user-controlled or institution-authorized action.
- WhatsApp, Vercel dashboard and scheduled workers reuse the same domain services.

---

### Task 1: Student context expansion

- [x] Add widened domain taxonomy and intents in `lib/student-ecosystem.js`.
- [x] Add tests covering the new domain categories and boundaries.
- [ ] Wire `student-context` into WhatsApp response personalization for all new domains.

### Task 2: Forms and request orchestration

- [x] Add `student_form_catalog`.
- [x] Add `student_requests` and request documents.
- [ ] Ingest official request/form catalogue with source, eligibility, required documents, required signatures and deadlines.
- [ ] Add intent routing for "I need a form", "how do I request", and known NOUN request types.
- [ ] Add request progress/status rendering in WhatsApp and portal.

### Task 3: Learning media and practice

- [x] Add `learning_media`.
- [x] Add `mock_assessments`, questions and attempts.
- [ ] Ingest/curate official how-to videos and orientation material.
- [ ] Add course-aware mock exam/test generation from approved material.
- [ ] Add score/progress feedback and revision recommendations.

### Task 4: Research and project support

- [x] Add research/project categories and intents.
- [ ] Integrate PAS discovery and supervisor/facilitator request guidance.
- [ ] Add project-topic helper, topic screening checklist and milestone tracking.
- [ ] Add library/literature-search guidance with source-aware retrieval.

### Task 5: Physical services

- [x] Add `physical_service_requests` and study-space requests.
- [ ] Connect verified providers for printing, photocopying, scanning, binding, handouts and other student services.
- [ ] Add physical ID/exam-card/registration-slip service workflows where officially supported.
- [ ] Add request quotes, status and delivery tracking.

### Task 6: Authorized representative service

- [x] Add explicit representation contract and boundary.
- [ ] Add representative verification and task-level authorization.
- [ ] Add expiry/revocation and evidence trail.
- [ ] Explicitly reject exam attendance, identity impersonation and restricted academic actions.

### Task 7: Skills, careers and enterprise

- [x] Expand skills, apprenticeship, work and commerce taxonomy.
- [ ] Connect NOUN entrepreneurship/incubation resources.
- [ ] Add skills profile → training → mentor → opportunity → marketplace pathway.
- [ ] Add employment, internship, SIWES, NYSC, fellowship, scholarship and competition matching.

### Task 8: Finance and investment education

- [x] Preserve nano-finance discovery stages.
- [x] Add investment-education boundary.
- [ ] Connect verified student-loan, scholarship, grant and device-funding sources.
- [ ] Add financial-literacy learning resources.
- [ ] Add eligibility/terms comparison with freshness metadata.
- [ ] Route actual regulated execution to I/O or the authorized provider.

### Task 9: Student life and governance

- [x] Add sports, clubs, associations, excursions, competitions and governance taxonomy/schema.
- [ ] Ingest verified events and group information.
- [ ] Add registration/reminder flows.
- [ ] Add verified election/ballot information and student decision support without automated voting.

### Task 10: Verification and production gate

- [ ] Run repository test suite in CI.
- [ ] Verify Vercel production deployment reaches READY.
- [ ] Verify `/api/health` and `/api/dashboard`.
- [ ] Verify no runtime errors introduced by new domain modules.
- [ ] Apply reviewed Supabase V4 migration before activating stateful new features.
- [ ] Validate one end-to-end journey for academic, request, service, research, skills, career, marketplace, governance and finance-discovery domains.
