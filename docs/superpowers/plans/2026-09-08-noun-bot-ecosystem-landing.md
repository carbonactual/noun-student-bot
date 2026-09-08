# NOUN BOT Ecosystem Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the NOUN Student Bot root route into the public product landing page for the NOUN learner ecosystem while preserving the existing operational dashboard at `/dashboard/` and keeping Carbon Actual ecosystem rails canonical.

**Architecture:** The root page is a static, accessible, responsive product surface that explains NOUN BOT as the InstituteGPT product for a persistent student identity. It links into the existing dashboard rather than duplicating dashboard functionality, and it presents the capability domains already defined by `student-ecosystem.js` and the README scope. Product claims remain bounded by current repository governance: practice assessments are not live exams, consequential submissions stay user/institution controlled, financial functionality is discovery/education rather than execution, and academic claims are evidence-backed.

**Tech Stack:** Existing plain HTML/CSS/vanilla JavaScript repository; no new runtime dependency. Reuse the existing visual language from the repository's dashboard and Omni surfaces. Validate with the existing Node test suite.

**Spec:** Existing NOUN Student Bot v4 README/scope and approved chat design; `README.md`, `docs/NOUN_STUDENT_ECOSYSTEM_SCOPE_V4.md`, `lib/student-ecosystem.js`, `dashboard/index.html`.

## Global Constraints

- Keep `/dashboard/` as the authenticated/operations surface; `/` is public product marketing.
- Use the canonical NOUN coverage: Certificate, Undergraduate, Postgraduate Diploma, Master's, PhD/Doctoral.
- Describe WhatsApp as a primary communication channel without claiming unsupported live institutional automation.
- Keep Carbon Actual / InstituteGPT attribution visible but secondary to NOUN BOT.
- Do not add AI/API dependencies or secrets to the landing page.
- Preserve mobile responsiveness and accessible navigation.
- Do not expose private student data on the public page.
- All writes must land on a feature branch, not `main`.

---

### Task 1: Add root landing page

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: existing `dashboard/` route, existing NOUN product scope.
- Produces: public root landing page with stable fragment IDs and CTAs to `/dashboard/`.

- [x] **Step 1: Replace the redirect with the complete landing page markup and styles.**
- [x] **Step 2: Add keyboard-visible focus states, semantic headings, skip link, and reduced-motion handling.**
- [x] **Step 3: Add product sections for hero, learner pathways, capabilities, how it works, ecosystem position, trust boundaries, and final CTA.**

### Task 2: Add landing-page regression tests

**Files:**
- Create: `tests/landing-page.test.js`

**Interfaces:**
- Consumes: `index.html`.
- Produces: deterministic text/structure assertions for the public product surface.

- [x] **Step 1: Assert the root no longer performs an automatic redirect.**
- [x] **Step 2: Assert the canonical academic levels and core product positioning are present.**
- [x] **Step 3: Assert the dashboard CTA and key trust boundaries are present.**

### Task 3: Validate and document the change

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: landing page behavior.
- Produces: README entry-point documentation pointing readers to `/` and `/dashboard/`.

- [x] **Step 1: Add a concise entry-point section distinguishing public landing and operations dashboard.**
- [ ] **Step 2: Run `node --test tests/*.test.js`.**
- [x] **Step 3: Review changed files for secrets, unsupported claims, or accidental dashboard removal.**
- [x] **Step 4: Commit the completed landing page as one coherent feature commit.**

**Verification note:** The GitHub connector available in this session can inspect and write repository content but does not provide an arbitrary shell/runtime execution endpoint. The regression test file is included and syntax-checked by construction, but the full `node --test tests/*.test.js` command must be run by CI/Vercel or a local checkout before merge.
