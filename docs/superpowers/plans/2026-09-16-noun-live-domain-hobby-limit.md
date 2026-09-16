# NOUN Live Domain + Hobby Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing NOUN Student Bot production deployment deployable on Vercel Hobby, preserve its student-service intelligence, and prepare `noun.carbonactual.com` as the production front door.

**Architecture:** Keep `carbonactual/noun-student-bot` as the canonical NOUN application. Preserve the existing `service-intelligence` capability but move its HTTP boundary into the already-existing `automation` function, reducing the deployment from 13 to 12 serverless functions without changing the underlying intelligence module. Add an internal rewrite so the established `/api/service-intelligence` contract remains valid. After production reaches READY, attach `noun.carbonactual.com` to the existing Vercel project through project/domain configuration; DNS remains external to GitHub source and must resolve to Vercel before final HTTPS verification.

**Tech Stack:** Node.js 24.x, CommonJS serverless handlers, Vercel, Supabase, GitHub Actions, HTML dashboard.

**Spec:** `docs/superpowers/specs/2026-08-20-noun-canonical-student-intelligence-design.md`

## Global Constraints

- Remain within the current Vercel serverless-function limit.
- Prefer modifying existing functions/modules over adding new functions when an existing boundary is suitable.
- Keep production diagnostics non-sensitive.
- Verify production deployment health after every production-affecting change.
- Preserve tenant scoping and protected mutation authorization.
- Do not create a second database, AI orchestration layer, or parallel NOUN knowledge hierarchy.
- Free-first: do not introduce a paid hosting requirement solely to solve the function-count problem.

---

### Task 1: Consolidate service-intelligence HTTP handling into automation

**Files:**
- Modify: `api/automation.js`
- Delete: `api/service-intelligence.js`
- Modify: `vercel.json`
- Modify: `.github/workflows/intelligence-monitor.yml`
- Test: `tests/automation-service-intelligence.test.js`

**Interfaces:**
- Consumes: existing `lib/service-intelligence.js` exports `ingest`, `expireStale`, and `recordDemand`; existing `api/service-intelligence.js` GET/POST semantics; existing webhook and intelligence cron secrets.
- Produces: `/api/automation` supporting its existing `deadline-dispatch` and `campaign-dispatch` POST actions plus the existing service-intelligence POST actions (`ingest`, `expire`, `demand`) and protected GET service discovery. `/api/service-intelligence` remains externally compatible through a rewrite to `/api/automation`.

- [ ] **Step 1: Add tests for the consolidated service-intelligence actions**

```js
const test = require('node:test');
const assert = require('node:assert/strict');

test('automation module contains the service-intelligence actions', async () => {
  const source = require('node:fs').readFileSync('api/automation.js', 'utf8');
  assert.match(source, /expireStale/);
  assert.match(source, /recordDemand/);
  assert.match(source, /action==='expire'/);
  assert.match(source, /action==='demand'/);
  assert.match(source, /GET/);
});

test('legacy service-intelligence route rewrites to automation', async () => {
  const config = JSON.parse(require('node:fs').readFileSync('vercel.json', 'utf8'));
  assert.ok(config.rewrites.some(r => r.source === '/api/service-intelligence' && r.destination === '/api/automation'));
});
```

- [ ] **Step 2: Run the focused test before implementation**

Run: `node --test tests/automation-service-intelligence.test.js`
Expected: FAIL because the new test file and consolidated behavior do not yet exist.

- [ ] **Step 3: Extend `api/automation.js` with the service-intelligence behavior**

At the top of `api/automation.js`, import the existing intelligence implementation:

```js
const { ingest, expireStale, recordDemand } = require('../lib/service-intelligence');
```

Update the method guard so `GET` is accepted for service discovery and retain `POST` for all existing mutation/dispatch operations. Preserve the current `WEBHOOK_SECRET` authorization and additionally accept `INTELLIGENCE_CRON_SECRET` for the service-intelligence protected actions.

For `GET`, use the current `tenantId()` helper and return the same tenant-scoped `student_services` filtering behavior and human-handoff message currently implemented by `api/service-intelligence.js`.

For `POST`, preserve these exact action branches:

```js
if (action === 'deadline-dispatch') ...
if (action === 'campaign-dispatch') ...
if (action === 'ingest') return res.status(200).json({ ok: true, result: await ingest(req.body.items || []) });
if (action === 'expire') return res.status(200).json({ ok: true, expired: await expireStale() });
if (action === 'demand') return res.status(200).json({ ok: true, recorded: await recordDemand(req.body) });
```

Keep the existing protected-route status codes: unauthorized requests return `401`, unsupported methods return `405`, unknown actions return `400`, and caught failures return `500` without leaking provider credentials.

- [ ] **Step 4: Replace the legacy function with a rewrite**

Update `vercel.json` so the existing `/api/onboard` rewrite is preserved and the legacy service-intelligence route is added:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/api/onboard", "destination": "/api/dashboard" },
    { "source": "/api/service-intelligence", "destination": "/api/automation" }
  ]
}
```

- [ ] **Step 5: Delete `api/service-intelligence.js`**

Remove only the HTTP wrapper file; keep `lib/service-intelligence.js` unchanged so the domain capability remains intact.

- [ ] **Step 6: Update the scheduled intelligence workflow**

Change the workflow call from:

```bash
-X POST "$BASE_URL/api/service-intelligence"
```

to:

```bash
-X POST "$BASE_URL/api/automation"
```

Keep the `x-intelligence-secret` header and `{"trigger":"github-actions","mode":"scheduled","action":"expire"}` payload unchanged.

- [ ] **Step 7: Run the focused test again**

Run: `node --test tests/automation-service-intelligence.test.js`
Expected: PASS.

- [ ] **Step 8: Commit the consolidation**

```bash
git add api/automation.js vercel.json .github/workflows/intelligence-monitor.yml tests/automation-service-intelligence.test.js
git rm api/service-intelligence.js
git commit -m "fix: consolidate service intelligence for Vercel hobby"
```

### Task 2: Verify the full application and production deployment

**Files:**
- Test: repository test suite and production health endpoints.
- Modify: none unless verification finds a concrete regression.

**Interfaces:**
- Consumes: the Task 1 consolidated deployment boundary and existing `/api/health`, `/api/dashboard`, `/student/`, and root UI.
- Produces: a READY production deployment with the canonical NOUN application reachable on its existing Vercel hostname.

- [ ] **Step 1: Run the full repository test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 2: Deploy the GitHub branch to Vercel Preview**

Use the Vercel project linked to `carbonactual/noun-student-bot` and verify that the deployment reaches READY rather than `exceeded_serverless_functions_per_deployment`.

- [ ] **Step 3: Verify production health after merge/deploy**

Check:

```text
GET /api/health
GET /api/dashboard
GET /
GET /student/
```

Expected: production responses are available and the UI routes do not error.

- [ ] **Step 4: Verify service-intelligence compatibility**

Check the legacy route through the production URL with the required authorization where applicable. Confirm it is served by the automation function via rewrite and that unauthorized requests still return `401` rather than exposing tenant data.

- [ ] **Step 5: Commit/update documentation only if verification exposes a concrete mismatch**

Do not add speculative documentation changes; update existing operational documentation only when the verified deployment contract differs.

### Task 3: Promote and attach `noun.carbonactual.com`

**Files:**
- Modify: Vercel project domain configuration (not a source file).
- Verify: DNS, TLS, production response, and canonical links.

**Interfaces:**
- Consumes: the READY production deployment from Task 2.
- Produces: `https://noun.carbonactual.com/` resolving to the NOUN Student Bot Vercel project and serving the production application.

- [ ] **Step 1: Ensure the production deployment is the canonical project deployment**

Use the existing Vercel project `noun-student-bot-dashboard` linked to `carbonactual/noun-student-bot`.

- [ ] **Step 2: Add the custom domain in Vercel project settings**

Add `noun.carbonactual.com` as a project domain. This is a Vercel account/project mutation, not a GitHub source change.

- [ ] **Step 3: Ensure DNS points the subdomain at Vercel**

Create/update the DNS record required by Vercel for `noun.carbonactual.com` using the exact target Vercel reports for the project. Do not invent or hard-code a DNS target in source control.

- [ ] **Step 4: Verify HTTPS and application routing**

Check:

```text
https://noun.carbonactual.com/
https://noun.carbonactual.com/student/
https://noun.carbonactual.com/api/health
```

Expected: valid TLS, root NOUN UI, student route, and healthy API response.

- [ ] **Step 5: Verify no promotional dependency**

Confirm the domain itself is the functional NOUN entry point; no ad/promotion layer is required for students to access the student environment.

### Task 4: Final review and record the live contract

**Files:**
- Modify: `README.md` only if the canonical production URL is not already documented.
- Review: changed source, tests, Vercel deployment, and domain response.

- [ ] **Step 1: Review the final diff against the approved canonical-intelligence spec**

Check that identity, tenancy, security, outbound behavior, canonical knowledge hierarchy, and production constraints remain unchanged. fileciteturn22file0

- [ ] **Step 2: Verify function count is at or below 12**

Use the successful Vercel deployment metadata as evidence that the Hobby function limit is no longer exceeded.

- [ ] **Step 3: Record the canonical live URL**

Document `https://noun.carbonactual.com` as the public NOUN entry point only after DNS/TLS verification succeeds.

- [ ] **Step 4: Create the final implementation commit/PR**

Use a concise commit/PR message describing the Hobby-compatible consolidation and live-domain activation.
