# NOUN Student Bot — Student Ecosystem v4

A serverless NOUN student continuity and value network built around **WhatsApp Business as the primary communication channel**.

NOUN Student Bot is more than a chatbot. It is a personalized student operating layer under InstituteGPT, connecting academic progression, institutional services, student life, research, skills, work opportunities, student businesses, marketplace discovery, governance participation and financial-access intelligence around one persistent student identity.

## Expanded student environment

The student home now spans:

- Academic study and progression
- Mock exams, mock tests, practice sets and revision
- How-to videos and learning media
- Projects, research topics, supervisors/facilitators and authentic assessments
- Study-centre, library and physical-service workflows
- Forms, requests, applications and request tracking
- Physical ID/exam-card/registration-slip/document services where officially supported
- Printing, photocopying, scanning, binding and handouts
- Lawful authorized representative/errand services
- Sports, clubs, associations, excursions and competitions
- Skills acquisition, training, workshops, mentorship and apprenticeships
- Employment, internships, SIWES, NYSC, fellowships and other opportunities
- Student businesses, providers, marketplace listings and service requests
- Student loans, grants, scholarships, device funding and financial literacy
- Investment education and verified opportunity discovery, subject to eligibility and regulated-provider boundaries
- Student governance, elections, ballot information and consultations
- Matriculation, graduation, gowns, certificates, transcripts and alumni continuity

## Full NOUN academic coverage

Canonical learner pathways:

- **Certificate**
- **Undergraduate**
- **Postgraduate Diploma**
- **Master's**
- **PhD / Doctoral**

The identity follows the human across academic stages. Multiple programmes can exist under the same person without creating separate identities.

## Evidence-backed scope

The widened scope is grounded in current public NOUN materials. NOUN exposes student support and study-centre functions including study space, peer tutorials, counselling, examinations and community/social uses; a Projects Administration System for projects, seminars, teaching practice and practicum; library membership, reference, literature-search and user-education services; entrepreneurship/incubation, mentorship, vocational training and start-up support; SIWES; transcript/certificate/letter workflows; e-courseware and instructional media; and an official link to NELFUND student financial aid.

See `docs/NOUN_STUDENT_ECOSYSTEM_SCOPE_V4.md` for the full contract and `docs/superpowers/plans/2026-09-05-noun-student-ecosystem-v4.md` for the implementation sequence.

## Architecture

```text
Human / Carbon Actual Identity
        ↓
NOUN learner context
        ↓
WhatsApp / Vercel portal
        ↓
Canonical tenant-scoped NOUN domain services
        ├── Academic + progression
        ├── Learning media + mock practice
        ├── Research + projects
        ├── Forms + requests
        ├── Study-centre + physical services
        ├── Student life + governance
        ├── Skills + careers
        ├── Student commerce + marketplace
        ├── Economic access + finance discovery
        └── ABBA intelligence + human escalation
        ↓
Supabase Postgres / event history / evidence
        ↓
External institutional/provider boundaries when explicitly authorized

Carbon Actual I/O remains the regulated financial execution boundary.
```

## Learning continuity layer

The canonical Supabase project now contains tenant-scoped persistence for:

- student course enrolments
- study questions and tutor modes
- learner notes linked to questions when useful
- learning sessions and continuity metadata

The database migration is captured in `supabase-noun-learning-continuity.sql`. Row-level security uses the existing Carbon Actual tenant boundary rather than exposing student records publicly.

## AI study layer

`api/ai-study.js` is the course-aware AI study endpoint. It combines student intelligence, verified knowledge retrieval, live evidence where available, matched practice material and explicit tutor modes (`tutor`, `tutorial`, `practice`, `revision`). It is designed to distinguish official evidence from secondary evidence and to avoid fabricating NOUN rules or pretending to access private student portals.

## Important boundaries

- Mock assessments are for practice and learning only.
- The system does not take live exams or submit graded work for students.
- Authorized representatives may perform explicitly permitted errands; they cannot attend examinations or impersonate a student.
- Consequential institutional requests remain user-controlled or institution-authorized.
- NOUN intelligence can discover and explain student loans, grants, scholarships, device funding and investment concepts/opportunities, but does not approve credit, originate loans, move money, operate wallets, settle transactions or execute investments.
- Sports is a student-life domain and contains no wagering or betting functionality.
- Private academic information is not exposed to marketplace customers unless deliberately published by the student.
- Official claims remain source-backed with authority, freshness and verification metadata.

## Current implementation artifacts

- `lib/student-ecosystem.js` — widened domains, intents and boundaries.
- `api/ai-study.js` — grounded course-aware study endpoint.
- `tests/student-ecosystem-v4.test.js` — coverage for widened scope and boundaries.
- `supabase-student-ecosystem-v4.sql` — state-bearing contracts for forms, requests, learning media, mock practice, physical services and authorized representation.
- `supabase-noun-learning-continuity.sql` — canonical learner continuity persistence applied to Supabase.
- `docs/NOUN_STUDENT_ECOSYSTEM_SCOPE_V4.md` — full product scope.
- `docs/superpowers/plans/2026-09-05-noun-student-ecosystem-v4.md` — implementation plan.

The canonical production implementation remains under `api/` and `dashboard/`; Supabase is the system of record and Vercel is the student/operator delivery surface.
