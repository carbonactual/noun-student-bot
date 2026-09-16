# NOUN ABBA Backend Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move NOUN Student Bot toward a thin Vercel delivery surface backed by real server-side orchestration, with ABBA as the intelligence layer and NOUN retaining domain boundaries.

**Architecture:** Vercel and WhatsApp remain lightweight interaction surfaces. A backend orchestration contract normalizes identity/context, classifies the requested capability, obtains evidence, checks boundaries, invokes ABBA for reasoning, executes only explicitly authorized actions, records durable events, and returns a compact result. NOUN does not create a second intelligence system; its existing AI study behavior becomes an ABBA-consumer path.

**Tech Stack:** Node.js CommonJS, Vercel serverless API, Supabase/Postgres, existing NOUN domain libraries, external ABBA runtime contract, existing test runner (`node --test`).

**Spec:** `docs/NOUN_STUDENT_ECOSYSTEM_SCOPE_V4.md` and the architectural direction established in the repository README.

## Global Constraints

- Vercel is a thin presentation/transport surface; business orchestration is backend-owned.
- ABBA is the intelligence/reasoning layer; NOUN must not create a competing general intelligence primitive.
- Existing NOUN identity, evidence, financial, representation and academic-integrity boundaries remain unchanged.
- Financial execution remains outside NOUN intelligence and inside Carbon Actual I/O or an authorized regulated provider.
- Consequential institutional actions remain explicitly user-controlled or institution-authorized.
- Official evidence outranks secondary evidence, with provenance and conflict state retained.
- Existing Supabase tenant boundaries remain authoritative for NOUN persistence.

---

### Task 1: Define the backend orchestration contract

**Files:**
- Create: `lib/abba-contract.js`
- Test: `tests/abba-contract.test.js`

**Interfaces:**
- Produces `normalizeAbbaRequest(input)` returning `{ requestId, channel, identity, utterance, requestedCapability, context, authorization }`.
- Produces `buildAbbaResult(result)` returning `{ requestId, answer, capability, actions, evidence, followUp, boundaries }`.
- Produces `ABBA_PROTOCOL_VERSION`.

- [ ] **Step 1: Write failing tests** covering required request fields, channel normalization, safe identity shaping, result normalization, and protocol-version presence.
- [ ] **Step 2: Run `node --test tests/abba-contract.test.js` and verify failure.**
- [ ] **Step 3: Implement the minimal contract without adding model calls.**
- [ ] **Step 4: Run the targeted test and the existing suite.**
- [ ] **Step 5: Commit with `feat: define abba orchestration contract`.**

### Task 2: Add a capability registry

**Files:**
- Create: `lib/capability-registry.js`
- Test: `tests/capability-registry.test.js`

**Interfaces:**
- `listCapabilities()` returns the canonical NOUN capability descriptors.
- `resolveCapability(name)` returns a descriptor or `null`.
- `capabilityForIntent(intent)` maps existing NOUN intents to capabilities.
- Each descriptor contains `name`, `domain`, `execution`, `evidenceRequired`, and `boundary`.

- [ ] **Step 1: Write failing tests for academic, research, institutional, marketplace, opportunities, finance, governance, representation and human-escalation capabilities.**
- [ ] **Step 2: Run targeted tests and verify failure.**
- [ ] **Step 3: Implement the registry using existing `DOMAINS` and `INTENTS` rather than duplicating category logic.**
- [ ] **Step 4: Verify no finance or representation descriptor permits prohibited execution.**
- [ ] **Step 5: Commit with `feat: add noun capability registry`.**

### Task 3: Create the backend ABBA adapter

**Files:**
- Create: `lib/abba-runtime.js`
- Test: `tests/abba-runtime.test.js`

**Interfaces:**
- `invokeAbba(request, dependencies)` accepts a normalized request plus `{ fetchImpl, runtimeUrl, runtimeKey }` and returns a normalized ABBA result.
- Production runtime URL is read from `ABBA_RUNTIME_URL`.
- Authentication is read from `ABBA_RUNTIME_KEY` when configured.
- The adapter must fail closed when the production ABBA runtime is unavailable; it must not silently substitute a second production intelligence implementation.

- [ ] **Step 1: Write failing tests for request envelope, authentication, HTTP failure, malformed response and successful response.**
- [ ] **Step 2: Run targeted tests and verify failure.**
- [ ] **Step 3: Implement the adapter with timeout, bounded payloads and normalized errors.**
- [ ] **Step 4: Verify successful responses remain intelligence results rather than direct model-provider responses.**
- [ ] **Step 5: Commit with `feat: add abba runtime adapter`.**

### Task 4: Implement the NOUN orchestration service

**Files:**
- Create: `lib/noun-orchestrator.js`
- Test: `tests/noun-orchestrator.test.js`

**Interfaces:**
- `orchestrateNounRequest(input, deps)` executes: normalize → intent/capability resolution → student context → evidence retrieval → boundary checks → ABBA invocation → durable event recording.
- Dependencies are injectable: `buildStudentIntelligence`, `searchKnowledge`, `recordActivity`, `invokeAbba`, and boundary functions.
- No UI-specific formatting occurs here.

- [ ] **Step 1: Write failing tests for study, form request, marketplace, finance and blocked actions.**
- [ ] **Step 2: Verify failure.**
- [ ] **Step 3: Implement the orchestration pipeline using existing NOUN primitives.**
- [ ] **Step 4: Verify that finance and representation boundaries remain enforced before execution.**
- [ ] **Step 5: Verify event recording captures request, capability, outcome and failure state without private profile leakage.**
- [ ] **Step 6: Run the complete Node test suite.**
- [ ] **Step 7: Commit with `feat: add noun backend orchestration`.**

### Task 5: Add the thin Vercel gateway

**Files:**
- Create: `api/abba.js`
- Test: `tests/abba-api.test.js`

**Interfaces:**
- POST body: `{ phone, message, channel, course? }`.
- Response: the normalized `buildAbbaResult()` shape only.
- The endpoint does not perform domain logic or construct model prompts.

- [ ] **Step 1: Write failing API contract tests.**
- [ ] **Step 2: Verify failure.**
- [ ] **Step 3: Implement the thin transport gateway calling `orchestrateNounRequest`.**
- [ ] **Step 4: Verify bad requests, unauthorized requests, ABBA-unavailable responses and successful responses.**
- [ ] **Step 5: Commit with `feat: add thin noun abba gateway`.**

### Task 6: Convert `api/ai-study.js` to an ABBA-backed path

**Files:**
- Modify: `api/ai-study.js`
- Modify: `tests/ai-study.test.js` if present; otherwise create `tests/ai-study-abba.test.js`

**Interfaces:**
- Existing learning continuity behavior remains intact.
- Study requests are routed through the backend orchestration service.
- ABBA receives the student context and verified evidence; the Vercel function does not directly call Gemini in the production path.

- [ ] **Step 1: Add regression tests proving learning sessions/questions still persist.**
- [ ] **Step 2: Refactor the direct model invocation behind the orchestrator.**
- [ ] **Step 3: Preserve the explicit tutor/tutorial/practice/revision semantics.**
- [ ] **Step 4: Run targeted and complete tests.**
- [ ] **Step 5: Commit with `refactor: route noun study through abba`.**

### Task 7: Add runtime documentation and configuration contract

**Files:**
- Modify: `README.md`
- Create: `docs/ABBA_BACKEND_ORCHESTRATION.md`

- [ ] **Step 1: Document the thin Vercel/backend split, ABBA responsibility and capability registry.**
- [ ] **Step 2: Document `ABBA_RUNTIME_URL` and `ABBA_RUNTIME_KEY` without exposing secrets.**
- [ ] **Step 3: Document failure behavior when ABBA is unavailable.**
- [ ] **Step 4: Document the prohibited pattern of embedding general intelligence in Vercel handlers.**
- [ ] **Step 5: Commit with `docs: document noun abba backend boundary`.**

### Task 8: Verify production conformance

**Files:**
- Modify only files necessary to make tests and conformance checks pass.

- [ ] **Step 1: Run `node --test tests/*.test.js`.**
- [ ] **Step 2: Review changed files for accidental UI coupling, direct model calls, duplicated identity logic, prohibited finance execution, or prohibited representation behavior.**
- [ ] **Step 3: Verify the latest commit and repository status through GitHub.**
- [ ] **Step 4: Commit any final conformance correction.**

---

## Spec Coverage Review

This plan covers the requested thin Vercel surface, real backend orchestration, ABBA as intelligence, universal capabilities, student context, evidence, event continuity, and existing NOUN safety/financial/representation boundaries. Product-specific UI expansion is deliberately excluded so the frontend remains simple.
