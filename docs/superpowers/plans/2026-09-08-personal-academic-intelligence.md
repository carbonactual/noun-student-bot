# Personal Academic Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn NOUN BOT into a student-specific academic companion that can tutor, practice with past questions, curate personal intelligence, surface relevant events, and route human services.

**Architecture:** Keep Supabase as the tenant-scoped system of record and Vercel serverless APIs as the application layer. Reuse existing knowledge, student, activity, assessment/past-question, event and service tables where available; add only a small provenance-aware assessment model if the existing schema lacks the needed fields. The web student space and WhatsApp remain two interfaces over the same student state.

**Tech Stack:** Vercel serverless JavaScript, Supabase Postgres, existing NOUN knowledge/ranking helpers, static HTML/CSS/JS student workspace.

**Spec:** `docs/NOUN_STUDENT_ECOSYSTEM_SCOPE_V4.md` and `docs/ACADEMIC_INTELLIGENCE.md`

## Global Constraints

- Official NOUN evidence outranks secondary evidence.
- Past questions are revision-only and must retain provenance/verification labels.
- Student intelligence is private and scoped to the authenticated/identified student context.
- Automatic alerts require verified events and matching student context/opt-in.
- Human services are discoverable/requestable, but consequential institutional submissions stay explicit.
- AI must not answer live exams or facilitate academic misconduct.

### Task 1: Student intelligence aggregation

**Files:**
- Create: `lib/student-intelligence.js`
- Create: `api/student-intelligence.js`
- Modify: `api/ai-study.js`

**Deliverable:** A shared function that loads one student's profile, relevant deadlines/events, recent activity/learning signals, matched assessments, and services; a GET endpoint returns a private brief; AI study prompts receive that context.

### Task 2: Past-question practice

**Files:**
- Create: `api/past-questions.js`
- Modify: `lib/knowledge.js`

**Deliverable:** Course-aware revision retrieval with explicit provenance and verification labels, plus a practice mode that explains answers instead of completing live assessments.

### Task 3: Events and human services

**Files:**
- Create: `api/student-events.js`
- Create: `api/student-services.js`

**Deliverable:** Student-scoped event ranking and service discovery/request routing using existing `academic_events`, `student_services`, `service_offers`, and `service_requests` structures where present.

### Task 4: Student workspace UI

**Files:**
- Create: `student/index.html`
- Modify: `index.html`

**Deliverable:** A polished student workspace exposing Today, Study Tutor, Practice, Intelligence, Events, and Help while keeping the public landing page simple.

### Task 5: Verification and deployment

**Files:**
- Modify: docs/status as needed

**Deliverable:** Commit all changes to `main`, deploy the current project to Vercel, verify deployment readiness and critical API/static routes, and report the production deployment URL.
