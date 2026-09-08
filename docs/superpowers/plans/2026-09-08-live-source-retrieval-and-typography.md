# Live Source Retrieval and Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move NOUN BOT toward live/connected evidence retrieval instead of relying on manually populated academic tables, while upgrading the product typography and preserving the existing Vercel Hobby function budget.

**Architecture:** The database remains the tenant-scoped student state, cache, activity, and provenance store, not the authoritative origin of every academic fact. A source-adapter layer retrieves allowed public/connected material on demand, normalizes it into evidence objects, ranks it with the existing authority model, and optionally caches short-lived copies. The AI tutor consumes the resulting evidence plus the student's private context; the web UI uses the same retrieval path. Typography changes stay self-contained in the static landing/student pages so no new frontend runtime is required.

**Tech Stack:** Node.js CommonJS serverless functions, Vercel, Supabase, existing `lib/knowledge.js`, static HTML/CSS/JS, Node test runner.

**Spec:** `docs/NOUN_STUDENT_ECOSYSTEM_SCOPE_V4.md` and `docs/ACADEMIC_INTELLIGENCE.md`

## Global Constraints

- Official NOUN evidence outranks secondary evidence and conflicts must be surfaced.
- Student-specific intelligence must remain tenant-scoped and must not expose private academic state to other students.
- Past questions are revision material only; provenance and verification status must remain visible internally and in product copy.
- Live retrieval must not impersonate portal access or claim official status without a verified integration.
- No more than 12 Vercel Serverless Functions may be deployed on the current Hobby plan.
- Do not introduce a frontend framework or unnecessary dependencies into the static site.
- Keep the public-facing experience simple, student-first, and free of internal ecosystem terminology.

---

### Task 1: Add live-source adapter contract

**Files:**
- Create: `lib/live-sources.js`
- Create: `tests/live-sources.test.js`

**Interfaces:**
- Produces `normalizeSource(raw, adapter)` returning `{title,url,authority_tier,source_type,retrieved_at,verified_at,content,metadata}`.
- Produces `fetchLiveSources(query, options)` returning `{facts,sources,confidence}`.
- Includes a built-in official-NOUN adapter targeting the public NOUN domain with bounded fetch size/time.

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSource, buildEvidence } = require('../lib/live-sources');

test('live source normalization preserves provenance and authority', () => {
  const source = normalizeSource({ title: 'Calendar', url: 'https://nou.edu.ng/calendar/', content: 'Academic calendar' }, { authority_tier: 1, source_type: 'official_noun' });
  assert.equal(source.authority_tier, 1);
  assert.equal(source.source_type, 'official_noun');
  assert.equal(source.url, 'https://nou.edu.ng/calendar/');
  assert.ok(source.retrieved_at);
});

test('evidence builder ignores empty source bodies', () => {
  const result = buildEvidence([{ title: 'Empty', url: 'https://nou.edu.ng/x', content: '' }]);
  assert.deepEqual(result, []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/live-sources.test.js`
Expected: FAIL because `lib/live-sources.js` does not yet exist.

- [ ] **Step 3: Write the minimal implementation**

```js
const https = require('node:https');

const OFFICIAL_NOUN = { base: 'https://nou.edu.ng', authority_tier: 1, source_type: 'official_noun' };

function clean(value, max = 12000) { return String(value || '').trim().slice(0, max); }
function normalizeSource(raw = {}, adapter = OFFICIAL_NOUN) {
  return {
    title: clean(raw.title, 240),
    url: clean(raw.url, 500),
    authority_tier: Number(adapter.authority_tier || 4),
    source_type: clean(adapter.source_type || 'external', 80),
    retrieved_at: new Date().toISOString(),
    verified_at: raw.verified_at || null,
    content: clean(raw.content),
    metadata: raw.metadata || {}
  };
}
function buildEvidence(rows = []) {
  return rows.filter(x => clean(x.content)).map(x => normalizeSource(x, x));
}
function fetchText(url, timeoutMs = 7000, maxBytes = 180000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'user-agent': 'NOUN-BOT/2.1 source retrieval' } }, res => {
      if ((res.statusCode || 500) < 200 || (res.statusCode || 500) >= 300) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; if (Buffer.byteLength(body) > maxBytes) req.destroy(new Error('source too large')); });
      res.on('end', () => resolve(body.slice(0, maxBytes)));
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error('source timeout')));
    req.on('error', reject);
  });
}
function extractText(html) { return clean(String(html).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' '), 12000); }
async function fetchLiveSources(query, options = {}) {
  const q = clean(query, 240);
  if (!q) return { facts: [], sources: [], confidence: 'low' };
  const paths = Array.isArray(options.paths) && options.paths.length ? options.paths.slice(0, 5) : ['/calendar/', '/faqs/', '/e-courseware/', '/news/'];
  const found = [];
  for (const path of paths) {
    try {
      const url = new URL(path, OFFICIAL_NOUN.base).toString();
      const content = extractText(await fetchText(url));
      if (!content.toLowerCase().includes(q.toLowerCase().split(/\s+/)[0])) continue;
      found.push(normalizeSource({ title: `NOUN ${path.replace(/\//g, ' ')}`.trim(), url, content }, OFFICIAL_NOUN));
    } catch (_) {}
  }
  return { facts: found.slice(0, options.limit || 5), sources: found.slice(0, options.limit || 5).map(x => ({ tier: x.authority_tier, title: x.title, url: x.url })), confidence: found.length ? 'high' : 'low' };
}
module.exports = { normalizeSource, buildEvidence, fetchLiveSources };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/live-sources.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/live-sources.js tests/live-sources.test.js
git commit -m "feat(noun): add live source adapter contract"
```

### Task 2: Route knowledge retrieval through live evidence first, cache second

**Files:**
- Modify: `lib/knowledge.js`
- Create: `tests/knowledge-live-retrieval.test.js`

**Interfaces:**
- `searchKnowledge(query, opts)` remains the public retrieval API.
- It should merge database evidence with bounded live evidence and rank official live evidence ahead of stale database records when relevant.

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('knowledge module exposes live retrieval fallback', () => {
  const source = fs.readFileSync('lib/knowledge.js', 'utf8');
  assert.match(source, /fetchLiveSources/);
  assert.match(source, /live_facts/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/knowledge-live-retrieval.test.js`
Expected: FAIL because `knowledge.js` does not import or expose live retrieval.

- [ ] **Step 3: Write minimal implementation**

Add `const { fetchLiveSources } = require('./live-sources');` and, inside `searchKnowledge`, retrieve live evidence only when `opts.live !== false`, then append live facts with `kind: 'live'`, preserving authority and freshness in `rank`. Return `live_facts` separately so consumers can see which evidence was fetched during the request.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/knowledge-live-retrieval.test.js tests/knowledge-routing.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/knowledge.js tests/knowledge-live-retrieval.test.js
git commit -m "feat(noun): augment knowledge with live evidence"
```

### Task 3: Strengthen the AI tutor around live retrieval and provenance

**Files:**
- Modify: `api/ai-study.js`
- Modify: `tests/whatsapp-ai.test.js`
- Create: `tests/ai-live-retrieval.test.js`

**Interfaces:**
- POST `/api/ai-study` keeps `{phone, question, mode}`.
- `mode` supports `tutor`, `tutorial`, `practice`, `revision`.
- The prompt must explicitly distinguish live source evidence, cached/database evidence, and student context.

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('AI study route instructs model to use live evidence without claiming portal access', () => {
  const source = fs.readFileSync('api/ai-study.js', 'utf8');
  assert.match(source, /live evidence/i);
  assert.match(source, /portal/i);
  assert.match(source, /mode/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ai-live-retrieval.test.js`
Expected: FAIL because the current prompt does not identify live evidence or mode behavior explicitly.

- [ ] **Step 3: Write minimal implementation**

Update the route to call `searchKnowledge(question,{limit:10,live:true})`, pass the selected mode into the prompt, label live evidence clearly, instruct the model to treat live retrieval as current web evidence but never as proof of private portal state, and log whether live evidence was used in `student_activity.metadata`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ai-live-retrieval.test.js tests/whatsapp-ai.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/ai-study.js tests/ai-live-retrieval.test.js tests/whatsapp-ai.test.js
git commit -m "feat(noun): make tutor live-evidence aware"
```

### Task 4: Upgrade public and student typography without adding dependencies

**Files:**
- Modify: `dashboard/index.html`
- Modify: `student/index.html`
- Create: `tests/typography.test.js`

**Interfaces:**
- Public page and Student Space use the same typography tokens.
- No runtime font package is introduced.

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

for (const file of ['dashboard/index.html', 'student/index.html']) {
  test(`${file} uses the NOUN typography system`, () => {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /--font-display/);
    assert.match(source, /--font-body/);
    assert.doesNotMatch(source, /font-family:\s*Inter,ui-sans-serif,system-ui/);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/typography.test.js`
Expected: FAIL because both pages currently use the generic system stack.

- [ ] **Step 3: Write minimal implementation**

Introduce a display face using a broadly available editorial stack such as `Georgia, 'Times New Roman', serif` and a UI/body face using `Arial, Helvetica, sans-serif`. Keep headings editorial and confident, while controls, metadata, chat and forms remain highly legible. Apply the same CSS variables on both pages and tune letter-spacing/line-height so the new typography is visibly distinct without loading third-party font files.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/typography.test.js tests/dashboard-ui.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add dashboard/index.html student/index.html tests/typography.test.js
git commit -m "design(noun): refresh academic typography"
```

### Task 5: Verify function count, build, and production health

**Files:**
- Modify: `docs/ACADEMIC_INTELLIGENCE.md`
- Modify: `README.md` if needed to document live-source behavior

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 2: Verify Vercel function count remains within Hobby limits**

Run the project deployment and confirm the build does not return `exceeded_serverless_functions_per_deployment`.

- [ ] **Step 3: Verify the root and Student Space**

Check production `/` and `/student/` for HTTP 200 and verify the rendered HTML contains the updated typography tokens and Student Space copy.

- [ ] **Step 4: Verify runtime errors**

Check production runtime errors for the new deployment. Expected: no new runtime error clusters.

- [ ] **Step 5: Commit documentation**

```bash
git add docs/ACADEMIC_INTELLIGENCE.md README.md
git commit -m "docs(noun): document live-source retrieval model"
```

### Task 6: Final verification and production deployment

- [ ] **Step 1: Inspect the latest `main` commit and deployment mapping**

Confirm Vercel is building the exact GitHub `main` SHA produced by the final documentation commit.

- [ ] **Step 2: Confirm deployment state**

Expected: production state `READY`.

- [ ] **Step 3: Confirm aliases**

Expected: `noun-student-bot-dashboard.vercel.app` resolves to the new production deployment.

- [ ] **Step 4: Confirm no regression in existing endpoint budget**

Expected: deployment remains under 12 serverless functions and previous working routes stay available.

---
