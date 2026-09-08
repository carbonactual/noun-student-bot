# Immersive Student-Centric NOUN BOT UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the public and student-facing NOUN BOT experience into a more immersive, student-centered product with friendlier typography, clearer academic priorities, and a calm app-like interaction model.

**Architecture:** Keep the existing static HTML/CSS/JS deployment model and existing API contracts. The redesign is presentation-first: public landing copy stays simple, while `/student/` becomes the primary personalized academic workspace with contextual greeting, academic pulse, quick actions, AI modes, and human-help pathways. No new serverless functions or content-dump database layer are introduced.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, existing Vercel serverless APIs, GitHub Actions.

**Spec:** Approved in-chat design direction from 2026-09-08.

## Global Constraints

- Keep the public surface white/mint/green and avoid visible ecosystem/backend terminology.
- Replace serif/editorial display typography with a modern rounded sans-first system using local system fallbacks; do not add an external font dependency.
- Preserve existing API endpoints and Supabase-backed student state.
- Keep the Vercel function count unchanged.
- Preserve responsive/mobile behavior and accessible labels/focus states.
- Keep official NOUN sources above secondary material in user-visible trust language.

---

### Task 1: Redesign the public landing page

**Files:**
- Modify: `dashboard/index.html`
- Test: existing `tests/dashboard-ui.test.js`

**Interfaces:**
- Consumes: existing landing form endpoint and links to `/student/`.
- Produces: a simpler, warmer public entry experience with product demo, student outcomes, and a direct route into the student space.

- [ ] **Step 1: Write the failing test assertions for the new surface**

Add assertions for the absence of serif font declarations, presence of the new student-first labels, and presence of reduced-motion behavior.

- [ ] **Step 2: Run the focused UI test and verify the new assertions fail**

Run: `node --test tests/dashboard-ui.test.js`
Expected: FAIL on the new typography/content assertions before implementation.

- [ ] **Step 3: Replace the dashboard presentation layer**

Use a rounded sans stack such as `ui-rounded, "SF Pro Rounded", "Avenir Next", Inter, system-ui, sans-serif`; create a compact navigation; simplify the hero; show an immersive AI conversation preview; introduce a three-part student journey; keep the sign-up section focused on starting a personalized student space. Add `prefers-reduced-motion: reduce` for animated surfaces.

- [ ] **Step 4: Run the focused UI test**

Run: `node --test tests/dashboard-ui.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add dashboard/index.html tests/dashboard-ui.test.js
git commit -m "design(noun): make public experience more student-centric"
```

### Task 2: Rebuild the student space as the primary experience

**Files:**
- Modify: `student/index.html`
- Test: `tests/student-ui.test.js` (create if absent)

**Interfaces:**
- Consumes: `GET /api/student-intelligence` and `POST /api/ai-study` with the existing `phone`, `question`, and `mode` fields.
- Produces: contextual student greeting, academic pulse, quick actions, AI tutor modes, personalized priorities, and support shortcuts without changing backend contracts.

- [ ] **Step 1: Write focused UI tests**

Test that the page contains the five core actions `Learn`, `Prepare`, `Plan`, `Help`, and `ABBA`; includes academic-pulse placeholders; includes AI modes; includes a mobile navigation/focus-safe layout; and contains the rounded sans typography declaration.

- [ ] **Step 2: Run the focused test and verify it fails before the redesign**

Run: `node --test tests/student-ui.test.js`
Expected: FAIL because the current student page uses the old headings and navigation.

- [ ] **Step 3: Implement the student-first workspace**

Create a calm app shell with a welcome header, profile/context chip, academic pulse area, five quick actions, AI conversation area, personalized priority cards, events/help cards, and a sticky mobile action bar. Keep all data dynamic through the existing student intelligence endpoint; never hard-code a fake student identity.

- [ ] **Step 4: Preserve and improve AI interaction behavior**

Keep tutor/tutorial/practice/revision modes, show source labels after answers, prevent duplicate sends while a request is running, and add a clear empty-profile path that asks the student to connect their number.

- [ ] **Step 5: Run focused tests**

Run: `node --test tests/student-ui.test.js tests/whatsapp-ai.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add student/index.html tests/student-ui.test.js
git commit -m "design(noun): rebuild student space around academic life"
```

### Task 3: Release verification and production check

**Files:**
- Modify: `.github/workflows/production-smoke.yml` only if required by the new route markers.

**Interfaces:**
- Consumes: the production deployment created from `main`.
- Produces: automated proof that public and student pages expose the intended user-facing markers.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 2: Run syntax validation**

Run: `find api lib scripts tests -type f -name '*.js' -print0 | xargs -0 -n1 node --check`
Expected: no syntax errors.

- [ ] **Step 3: Push/commit changes through GitHub**

The existing GitHub → Vercel integration creates the production deployment from `main`.

- [ ] **Step 4: Verify Vercel production deployment**

Confirm the deployment for the current commit is `READY` and aliased to `noun-student-bot-dashboard.vercel.app`.

- [ ] **Step 5: Verify runtime health**

Check Vercel runtime errors for the production project over the recent window; expected: no new runtime-error clusters attributable to the redesign.

- [ ] **Step 6: Confirm production smoke workflow**

Confirm `NOUN BOT Production Smoke` completes successfully for the same commit.
