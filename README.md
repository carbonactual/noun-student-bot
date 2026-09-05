# NOUN Student Bot — Production v2

A serverless NOUN student support and onboarding system built around **WhatsApp Business as the primary communication channel**.

## Full NOUN academic coverage

NOUN Student Bot is a **full academic-ladder service**, not an undergraduate-only bot.

Canonical learner pathways:

- **Certificate** — certificate and professional/short-cycle certificate pathways.
- **Undergraduate** — diploma/bachelor-level pathways, including existing 100–400 level workflows where applicable.
- **Postgraduate Diploma** — postgraduate diploma pathways.
- **Master's** — master's programmes, taught/research contexts and programme requirements.
- **PhD / Doctoral** — doctoral programmes, research-stage context and programme requirements.

The data model now supports `study_level`, programme identity, award title, academic status, admission session, expected completion and `student_programmes`, so one human can progress across certificates, undergraduate study, postgraduate study, master's and PhD without creating a new identity. Existing undergraduate `level` behavior remains for compatibility.

See `docs/ACADEMIC_COVERAGE.md` for the coverage contract.

## Canonical architecture

```text
Student WhatsApp
      ↓
Meta WhatsApp Business / Cloud API
      ↓
Zapier — inbound event adapter + outbound sender
      ↓
Vercel Serverless API
      ├── identity + onboarding/state machine
      ├── academic-pathway routing
      ├── deterministic commands
      ├── human escalation
      ├── deadline/checklist logic
      ├── campaign engine
      ├── outbound queue
      └── Gemini study/retrieval layer
      ↓
Supabase Postgres
      ├── student identity + academic registry
      ├── multi-programme relationships
      ├── academic faculties/departments/programmes
      ├── course + programme-course graph
      ├── admissions/requirements
      ├── course content
      ├── deadlines/events/assessments
      ├── audit/idempotency events
      ├── help requests
      ├── campaigns
      └── outbound queue

Vercel dashboard → aggregate-only /api/dashboard
Resend → email backup + human escalation
```

There is **no WhatsApp QR session, whatsapp-web.js, laptop process, VPS bot process, Node cron or Telegram bridge** in the canonical production architecture.

## WhatsApp is not optional

WhatsApp is the main student acquisition, onboarding, support and notification surface. Every WhatsApp interaction is treated as an event with an idempotency key, while student state remains in Supabase.

Zapier remains the adapter that receives Meta WhatsApp events and sends Vercel responses through WhatsApp Business. Vercel never stores a WhatsApp login session or QR credential.

## Current capabilities

- WhatsApp-first onboarding: unknown number → academic pathway → programme/level → courses → active learner
- Full learner pathway model: certificate, undergraduate, postgraduate diploma, master's, doctoral
- Multi-programme academic history under one student identity
- `mycourses`, `help/menu`, `profile`, `email`, `examcheck`, `done`
- Human escalation from any point in onboarding
- Gemini study support grounded in registered course material
- Exam-hall checklist per student/course where applicable
- Deadline registry and academic-event support
- Programme, faculty, department and course knowledge graph
- Admission/requirements knowledge structures with source verification
- Privacy-safe aggregate operations dashboard
- Idempotent inbound message processing
- Outbound transactional queue
- Campaign creation, audience targeting and launch
- Campaign targeting by legacy undergraduate `level` and canonical `study_level`
- Opt-in guard on campaign delivery
- Message/event audit trail
- Server-side Supabase service key only

## Academic experience by pathway

**Certificate:** discovery, eligibility, programme information, course/content support, schedules, deadlines and completion-oriented guidance where supported by verified source data.

**Undergraduate:** existing numbered-level onboarding, course selection, study support, exam checklist, deadlines and human escalation.

**Postgraduate Diploma:** programme-first onboarding and postgraduate-specific requirements, courses, events, deadlines and support.

**Master's:** programme-first onboarding with taught-course and research-aware support, admissions, requirements, policies, deadlines and study assistance.

**PhD / Doctoral:** programme/research-stage identity, doctoral requirements, academic events, policy/requirement retrieval and source-backed research/study assistance.

The same learner identity persists as academic status changes from prospective/applicant to admitted, active, graduated/alumni or another supported state.

## Campaign system

Campaigns are separated from transactional messages and can target by `study_level` as well as legacy undergraduate `level`, course, faculty and stage.

Examples:

```text
admin campaign target [campaign-id] study_level=masters
admin campaign target [campaign-id] study_level=doctoral
admin campaign target [campaign-id] study_level=certificate
admin campaign target [campaign-id] level=300 course=CIT301
```

Use consent, useful content, frequency limits and clear identity before broad external launch.

## Database

`supabase-schema.sql` is the canonical schema. Academic coverage includes:

- `academic_levels`
- `academic_faculties`
- `academic_departments`
- `programmes`
- `programme_courses`
- `course_offerings`
- `programme_admissions`
- `student_programmes`
- `knowledge_sources`
- `knowledge_claims`
- `noun_policies`
- `academic_events`
- `assessments`

The schema explicitly supports certificate, undergraduate, postgraduate diploma, master's and doctoral/PhD pathways.

## Security and AI boundaries

Vercel uses the Supabase service-role key server-side; the browser never receives it. Sensitive student tables have no public write policies. Incoming Zapier calls require `x-webhook-secret`. Duplicate inbound events are rejected. Campaign delivery respects opt-in.

Gemini is a support layer, not the source of truth. It may explain, summarize and support study/research. It must not claim access to private NOUN records, impersonate NOUN, submit consequential official actions, take graded work/exams, fabricate academic requirements or present uncertain information as officially verified.

Official publicly accessible NOUN courseware, programme information and policies should be ingested with source URL/hash and verification metadata. Long source passages should not simply be republished.

## Human support

`human`, `help me`, `talk to someone` and `agent` create a `help_requests` record and notify configured staff. The learner remains in WhatsApp.

## Deployment sequence

1. Apply `supabase-schema.sql` as a reviewed migration.
2. Confirm the full academic ladder is represented in `academic_levels` and programme data.
3. Set server-only environment variables.
4. Deploy to Vercel.
5. Configure Meta WhatsApp → Zapier → `/api/whatsapp-webhook`.
6. Configure outbound and campaign dispatch.
7. Test one onboarding flow for each academic pathway.
8. Test programme selection and multi-programme history.
9. Test source verification for admissions/programme/policy answers.
10. Test human escalation, deadlines and applicable exam workflows.

## Repository status

The canonical production implementation lives under `api/` and `dashboard/`. The old persistent WhatsApp/QR implementation has been removed to prevent architecture drift.
