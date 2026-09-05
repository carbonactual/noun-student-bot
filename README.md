# NOUN Student Bot — Student Ecosystem v3

A serverless NOUN student continuity and value network built around **WhatsApp Business as the primary communication channel**.

NOUN Student Bot is more than a chatbot. It is a personalized student operating layer under InstituteGPT, connecting academic progression, institutional services, student life, skills, work opportunities, student businesses, marketplace discovery, governance participation and financial-access intelligence around one persistent student identity.

## Full NOUN academic coverage

Canonical learner pathways:

- **Certificate** — certificate and professional/short-cycle certificate pathways.
- **Undergraduate** — diploma/bachelor-level pathways, including existing 100–400 level workflows where applicable.
- **Postgraduate Diploma** — postgraduate diploma pathways.
- **Master's** — master's programmes, taught/research contexts and programme requirements.
- **PhD / Doctoral** — doctoral programmes, research-stage context and programme requirements.

The data model supports `study_level`, programme identity, award title, academic status, admission session, expected completion and `student_programmes`, so one human can progress across certificates, undergraduate study, postgraduate study, master's and PhD without creating a new identity. Existing undergraduate `level` behavior remains for compatibility.

## Student ecosystem domains

```text
                         STUDENT / CARBON IDENTITY
                                  │
                    PERSONALIZED STUDENT CONTEXT
                                  │
        ┌─────────────┬───────────┼───────────┬─────────────┐
        ▼             ▼           ▼           ▼             ▼
     ACADEMIC      SERVICES     STUDENT      SKILLS        WORK
                                  LIFE
        └─────────────┬───────────┼───────────┬─────────────┘
                      ▼           ▼           ▼
                 COMMERCE     GOVERNANCE   ECONOMIC ACCESS
                      │           │           │
                      └───────────┼───────────┘
                                  ▼
                           ABBA INTELLIGENCE
                                  │
                    MATCH → ALERT → SUPPORT → ACT
                                  │
                           HUMAN ESCALATION
```

### Academic
Programme/level, courses, courseware, TMA, assessments, exams, research, progression and graduation readiness.

### Institutional services
Signatures/signing, clearance, ID, matriculation, printing, photocopying, binding, handouts, textbooks, study-centre services, transport, accommodation and graduation gowns/regalia.

### Student life
Matriculation, graduation, clubs, associations, sports, excursions and approved student events.

### Skills
Skills acquisition, training, workshops, bootcamps, masterclasses, apprenticeships and peer learning.

### Work and opportunity
Employment, internships, SIWES, apprenticeships, NYSC information, scholarships, grants, fellowships and competitions.

### Student economy
Student businesses, provider profiles, service offers, requests, matching, reputation, referrals and dispute escalation.

### Governance
Verified student-election notices, eligibility, candidate information, ballot instructions and participation guidance. **Open ballot means governance/election participation and is never a wagering product.**

### Economic access
Verified discovery and explanation of student finance, grants, device funding, scholarships, savings and financial-education opportunities. Regulated execution remains outside this repository in Carbon Actual I/O.

## Personalized student experience

The same human identity persists across the learner journey:

`Prospective → Applicant → Admitted → Active → Progressing → Completing → Graduate/Alumni`

A student may have multiple programmes and roles. NOUN Student Bot builds context from verified identity, academic programmes, current courses, academic status, research stage where applicable, stated interests, preferences, opportunity needs, service needs and support history.

Private academic information is not automatically exposed to marketplace or provider participants. Public provider/business visibility requires student-controlled publication and consent.

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
      ├── personalized student context
      ├── academic-pathway routing
      ├── deterministic commands
      ├── student service/opportunity discovery
      ├── human escalation
      ├── deadline/checklist logic
      ├── campaign engine
      ├── outbound queue
      └── Gemini study/retrieval layer
      ↓
Supabase Postgres
      ├── student identity + academic registry
      ├── multi-programme relationships
      ├── academic knowledge graph
      ├── services + provider marketplace
      ├── events + student groups
      ├── skills + work opportunities
      ├── governance/election publication
      ├── financial-access discovery
      ├── deadlines/events/assessments
      ├── audit/idempotency events
      ├── help requests
      ├── campaigns
      └── outbound queue

Vercel dashboard → aggregate-only operations
Resend → email backup + human escalation
Carbon Actual I/O → future regulated finance execution boundary
```

There is **no WhatsApp QR session, whatsapp-web.js, laptop process, VPS bot process, Node cron or Telegram bridge** in the canonical production architecture.

## Student value cycle

```text
Need
 ↓
Intent
 ↓
Verified student context
 ↓
Discovery
 ↓
Eligibility / safety / relevance
 ↓
Match
 ↓
Student choice
 ↓
Engagement / order / institutional flow
 ↓
Value event
 ↓
Reputation / history
 ↓
New opportunity
```

This lets a student move naturally between learning, services, skills, employment and commerce instead of encountering unrelated mini-apps.

## Nano-finance practice boundary

NOUN is a useful controlled environment for learning how future nano-finance could work around real student needs. The intelligence layer can capture needs, financial education, verified product discovery, eligibility explanation, terms explanation and provider routing.

The execution boundary remains Carbon Actual I/O. NOUN does not originate loans, approve credit, operate wallets, move money, execute payments, collect repayments or settle financial transactions.

## Current capabilities

- WhatsApp-first onboarding
- Certificate → undergraduate → PGD → master's → doctoral pathway model
- Multi-programme academic identity
- Personalized student context foundation
- `mycourses`, `help/menu`, `profile`, `email`, `examcheck`, `done`
- Human escalation
- Gemini study support grounded in course material
- Exam-hall checklist
- Deadline and academic-event support
- Programme/faculty/department/course knowledge graph
- Source verification and authority/freshness model
- Student-service taxonomy for printing, photocopying, signatures, handouts, textbooks, gowns, ID, transport and related services
- Student events, clubs, sports and excursion domain contracts
- Skills acquisition, training and apprenticeship domain contracts
- Employment, internship, SIWES and NYSC opportunity contracts
- Student business and provider marketplace foundations
- Governance/election publication contract with no wagering model
- Financial-access discovery and nano-finance boundary
- Explainable provider matching
- Privacy-safe aggregate operations dashboard
- Idempotent inbound message processing
- Auditable outbound queue
- Campaign creation and consent-aware targeting

## Academic experience by pathway

**Certificate:** discovery, eligibility, programme information, course/content support, schedules, deadlines and completion-oriented guidance where supported by verified source data.

**Undergraduate:** numbered-level workflows, course selection, study support, exam checklist, deadlines and human escalation.

**Postgraduate Diploma:** programme-first onboarding, postgraduate requirements, courses, events, deadlines and support.

**Master's:** programme-first onboarding with taught-course and research-aware support, admissions, requirements, policies, deadlines and study assistance.

**PhD / Doctoral:** programme/research-stage identity, doctoral requirements, academic events, policy/requirement retrieval and source-backed research/study assistance.

## Security and authority boundaries

Vercel uses the Supabase service-role key server-side; the browser never receives it. Sensitive student tables have no public write policies. Incoming Zapier calls require `x-webhook-secret`. Duplicate inbound events are rejected. Campaign delivery respects opt-in.

Gemini is a support layer, not the source of truth. It may explain, summarize and support study/research. It must not claim access to private NOUN records, impersonate NOUN, submit consequential official actions, take graded work/exams, fabricate academic requirements or present uncertain information as officially verified.

Official NOUN claims should be ingested with source URL/hash and verification metadata. Conflicts and stale material must be reviewed rather than silently merged.

## Human support

`human`, `help me`, `talk to someone` and `agent` create a structured support case and notify configured staff. The learner remains in WhatsApp.

## Repository contracts

Primary ecosystem contracts added in v3:

- `lib/student-ecosystem.js` — domains, intents, student home and finance boundary.
- `lib/student-context.js` — personalized student context assembly.
- `lib/service-matching.js` — deterministic explainable provider matching.
- `supabase-student-ecosystem-v3.sql` — events, groups, governance, skills, work and opportunity schema.
- `tests/student-ecosystem.test.js` — ecosystem taxonomy and boundary tests.
- `tests/student-context.test.js` — personalization tests.
- `tests/student-marketplace.test.js` — provider matching tests.
- `tests/student-finance-boundary.test.js` — nano-finance boundary tests.
- `tests/student-life-schema.test.js` — student-life/governance schema contract tests.

## Database boundary

The canonical schema remains the reviewed Supabase schema plus explicit Phase 2/3 domain migrations. Financial discovery records may exist in NOUN, while wallet/ledger/payment execution belongs to Carbon Actual I/O.

## Deployment sequence

1. Review/apply `supabase-student-ecosystem-v3.sql` after the existing schema migrations.
2. Confirm the complete academic ladder and current authoritative programme/course catalogue.
3. Set server-only environment variables.
4. Deploy to Vercel.
5. Configure Meta WhatsApp → Zapier → `/api/whatsapp-webhook`.
6. Validate one onboarding flow for each academic pathway.
7. Validate services, events, skills, work, marketplace, governance and financial-discovery contracts.
8. Validate tenant isolation, consent, verification and human escalation.

## Repository status

The canonical production implementation lives under `api/`, `lib/`, `dashboard/` and reviewed SQL migrations. Legacy WhatsApp/QR architecture is not part of the canonical design.

See:

- `docs/ACADEMIC_COVERAGE.md`
- `docs/PHASE2_BUILD_COMPLETE.md`
- `docs/PHASE2_P2P_SERVICE_ECONOMY.md`
- `docs/PHASE2_REGULATORY_REGISTER_2026.md`
- `docs/superpowers/specs/2026-09-05-noun-student-ecosystem-v3-design.md`
- `docs/superpowers/plans/2026-09-05-noun-student-ecosystem-v3.md`
