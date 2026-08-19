# NOUN Canonical Student Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make WhatsApp study interactions consume the canonical NOUN knowledge model, record useful student-intelligence events, and harden outbound delivery and dashboard operations without adding another database or AI layer.

**Architecture:** Reuse `lib/knowledge.js` as the single tenant-scoped knowledge interface. Refactor WhatsApp AI to consume canonical grounding plus course content, then record interaction outcomes through the existing Supabase activity/audit tables. Keep outbound queue lifecycle in `api/automation.js` and operational reporting in `api/dashboard.js`.

**Tech Stack:** Node.js serverless functions, Vercel, Supabase/Postgres, Gemini 3.6 Flash, existing WhatsApp/Zapier webhook contract.

**Spec:** `docs/superpowers/specs/2026-08-20-noun-canonical-student-intelligence-design.md`

## Global Constraints

- All reads/writes are tenant-scoped using the active NOUN tenant.
- Gemini credentials remain server-side only.
- WhatsApp AI uses Gemini 3.6 Flash.
- Canonical authority tiers remain Tier 1 official NOUN through Tier 5 external.
- Do not add a new serverless function when an existing endpoint can carry the capability.
- No production diagnostic endpoint may expose provider credentials or response internals.
- Preserve inbound idempotency and outbound queue lifecycle.
- Production deployments must remain within the current Vercel function limit.

---

### Task 1: Establish test harness for canonical knowledge routing

**Files:**
- Create: `tests/knowledge-routing.test.js`
- Modify: `lib/knowledge.js`

**Interfaces:**
- Produces: `buildStudentGrounding({knowledge, courseContent})` returning `{text, sources, confidence}`.

- [ ] **Step 1: Write the failing tests**

```js
const { buildStudentGrounding } = require('../lib/knowledge');

test('canonical grounding prefers authoritative NOUN facts and includes course content', () => {
  const result = buildStudentGrounding({
    knowledge: {
      facts: [{ authority_tier: 1, title: 'Official policy', summary: 'Use the official process.' }],
      sources: [{ tier: 1, title: 'Official policy', url: 'https://example.test/policy' }],
      confidence: 'high'
    },
    courseContent: '[CIT301 — Research Methods]\nPrimary data are collected directly by a researcher.'
  });

  expect(result.text).toContain('[Tier 1 official_noun] Official policy');
  expect(result.text).toContain('CIT301 — Research Methods');
  expect(result.sources[0].tier).toBe(1);
  expect(result.confidence).toBe('high');
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/knowledge-routing.test.js`
Expected: FAIL because `buildStudentGrounding` does not exist.

- [ ] **Step 3: Implement the minimal canonical grounding helper**

Add to `lib/knowledge.js`:

```js
function buildStudentGrounding({ knowledge = { facts: [], sources: [], confidence: 'low' }, courseContent = null }) {
  const canonical = buildGrounding(knowledge);
  const text = [canonical, courseContent ? `COURSE MATERIAL:\n${courseContent}` : '']
    .filter(Boolean)
    .join('\n\n');
  const sources = [
    ...(knowledge.sources || []),
    ...(courseContent ? [{ tier: 2, title: 'Matched course content', url: null }] : [])
  ];
  return { text, sources, confidence: knowledge.confidence || 'low' };
}
module.exports = { db, searchKnowledge, buildGrounding, buildStudentGrounding, recordActivity, TIER_NAMES, tenantId };
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `node --test tests/knowledge-routing.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/knowledge-routing.test.js lib/knowledge.js
git commit -m "feat: add canonical student grounding helper"
```

### Task 2: Route WhatsApp Gemini through canonical NOUN knowledge

**Files:**
- Create: `tests/whatsapp-ai.test.js`
- Modify: `api/whatsapp-webhook.js`

**Interfaces:**
- Consumes: `searchKnowledge`, `buildStudentGrounding`, existing `getRelevantCourseContent`.
- Produces: `askGemini(question, student)` using canonical knowledge and returns a generated answer or null.

- [ ] **Step 1: Write the failing test**

```js
test('WhatsApp AI prompt contains canonical NOUN evidence before course material', async () => {
  const source = require('fs').readFileSync('api/whatsapp-webhook.js', 'utf8');
  expect(source).toContain('searchKnowledge');
  expect(source).toContain('buildStudentGrounding');
  expect(source).not.toContain('gemini-2.0-flash');
  expect(source).toContain('gemini-3.6-flash');
});
```

- [ ] **Step 2: Run and verify it fails**

Run: `node --test tests/whatsapp-ai.test.js`
Expected: FAIL because WhatsApp currently uses its local course-content grounding only.

- [ ] **Step 3: Implement the minimal route change**

Update the import:

```js
const { tenantId, searchKnowledge, buildStudentGrounding } = require('../lib/knowledge');
```

Update `askGemini` so it retrieves canonical knowledge first:

```js
const knowledge = await searchKnowledge(question, { limit: 8 });
const courseContent = await getRelevantCourseContent(question, student?.courses || []);
const grounding = buildStudentGrounding({ knowledge, courseContent });
```

Use `grounding.text` in the Gemini prompt and preserve the existing WhatsApp safety rules. Include source/authority awareness in the generated prompt and record the confidence in the caller's event metadata.

- [ ] **Step 4: Run the test and verify it passes**

Run: `node --test tests/whatsapp-ai.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/whatsapp-ai.test.js api/whatsapp-webhook.js
git commit -m "feat: route WhatsApp study AI through canonical NOUN knowledge"
```

### Task 3: Add student-intelligence outcome events

**Files:**
- Create: `tests/student-intelligence.test.js`
- Modify: `api/whatsapp-webhook.js`
- Modify: `lib/knowledge.js`

**Interfaces:**
- Consumes: `recordActivity(phone, event_type, course_code, topic, metadata)`.
- Produces: normalized study outcome events for `study_question`, `study_answered`, and `study_fallback`.

- [ ] **Step 1: Write failing tests**

```js
test('successful AI answer records a study_answered event', () => {
  const source = require('fs').readFileSync('api/whatsapp-webhook.js', 'utf8');
  expect(source).toContain("recordActivity(from,'study_answered'");
});

test('AI fallback records a study_fallback event', () => {
  const source = require('fs').readFileSync('api/whatsapp-webhook.js', 'utf8');
  expect(source).toContain("recordActivity(from,'study_fallback'");
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/student-intelligence.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement event writes**

Immediately before generating the AI response:

```js
await recordActivity(from, 'study_question', null, text.split(/\s+/).slice(0, 8).join(' '), {
  knowledge_confidence: knowledge.confidence,
  source: 'whatsapp'
});
```

On success:

```js
await recordActivity(from, 'study_answered', null, text.split(/\s+/).slice(0, 8).join(' '), {
  knowledge_confidence: knowledge.confidence,
  source: 'whatsapp',
  ai_model: 'gemini-3.6-flash'
});
```

On fallback:

```js
await recordActivity(from, 'study_fallback', null, text.split(/\s+/).slice(0, 8).join(' '), {
  source: 'whatsapp'
});
```

Do not store the full generated answer in this metadata.

- [ ] **Step 4: Run and verify pass**

Run: `node --test tests/student-intelligence.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/student-intelligence.test.js api/whatsapp-webhook.js
 git commit -m "feat: record NOUN student intelligence outcomes"
```

### Task 4: Harden outbound queue lifecycle

**Files:**
- Create: `tests/outbound-queue.test.js`
- Modify: `api/automation.js`

**Interfaces:**
- Consumes: existing `dispatch` and `ack` actions.
- Produces: deterministic queued → processing → sent/failed lifecycle with attempt limits and lock release.

- [ ] **Step 1: Write failing tests**

```js
test('automation rejects unknown acknowledgement status as failed', () => {
  const source = require('fs').readFileSync('api/automation.js', 'utf8');
  expect(source).toContain("status:req.body.status==='sent'?'sent':'failed'");
});

test('automation includes attempt count and locking fields', () => {
  const source = require('fs').readFileSync('api/automation.js', 'utf8');
  expect(source).toContain('attempts:');
  expect(source).toContain('locked_until');
});
```

- [ ] **Step 2: Run and verify failure if any expected contract is missing**

Run: `node --test tests/outbound-queue.test.js`
Expected: FAIL if the existing implementation does not satisfy the hardened contract.

- [ ] **Step 3: Implement bounded retries**

Before selecting rows for dispatch, restrict work to rows with `attempts < 5`. On failure acknowledgement, clear `locked_until`, record `last_error`, and return the message to `queued` only when attempts remain; otherwise mark it `failed`.

- [ ] **Step 4: Run tests**

Run: `node --test tests/outbound-queue.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/outbound-queue.test.js api/automation.js
git commit -m "feat: harden NOUN outbound delivery lifecycle"
```

### Task 5: Add dashboard demand metrics without exposing raw student data

**Files:**
- Create: `tests/dashboard-intelligence.test.js`
- Modify: `api/dashboard.js`

**Interfaces:**
- Consumes: tenant-scoped `student_activity` counts.
- Produces: aggregated `intelligence` metrics: study questions, answered questions, fallbacks, human-help requests.

- [ ] **Step 1: Write failing test**

```js
test('dashboard response includes aggregated intelligence metrics', () => {
  const source = require('fs').readFileSync('api/dashboard.js', 'utf8');
  expect(source).toContain('student_activity');
  expect(source).toContain('intelligence');
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/dashboard-intelligence.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement aggregated metrics**

Query tenant-scoped `student_activity` counts by event type using head/count queries and add:

```js
intelligence: {
  study_questions,
  study_answered,
  study_fallback,
  human_help_requests
}
```

No phone numbers, message text, or student profiles should appear in this aggregate block.

- [ ] **Step 4: Run the test**

Run: `node --test tests/dashboard-intelligence.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/dashboard-intelligence.test.js api/dashboard.js
git commit -m "feat: add tenant-scoped student intelligence metrics"
```

### Task 6: Production validation and cleanup

**Files:**
- Modify only files required by failing production verification.

- [ ] **Step 1: Run all local tests**

Run: `node --test tests/*.test.js`
Expected: PASS.

- [ ] **Step 2: Verify production deployment**

Confirm Vercel production deployment reaches `READY`.

- [ ] **Step 3: Verify `/api/health`**

Expect HTTP 200 and `gemini: true`, with no diagnostic flags or provider response exposed.

- [ ] **Step 4: Verify `/api/dashboard`**

Expect HTTP 200 and aggregated intelligence fields with tenant-scoped empty datasets accepted as valid.

- [ ] **Step 5: Verify runtime errors**

Inspect current production errors. Historical errors from the temporary diagnostic period are not grounds for rollback unless they recur on the final deployment.

- [ ] **Step 6: Verify repository contains no retired Gemini model references**

Run: `grep -R "gemini-2.0-flash\|gemini-1.5" api lib tests || true`
Expected: no retired-model references in active code.

- [ ] **Step 7: Commit any final test-only changes**

```bash
git add .
git commit -m "chore: finalize NOUN student intelligence production hardening"
```
