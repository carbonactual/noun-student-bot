# NOUN Student Bot — Production v2

A serverless NOUN student support and onboarding system built around **WhatsApp Business as the primary communication channel**.

## Canonical architecture

```text
Student WhatsApp
      ↓
Meta WhatsApp Business / Cloud API
      ↓
Zapier — inbound event adapter + outbound sender
      ↓
Vercel Serverless API
      ├── onboarding/state machine
      ├── deterministic commands
      ├── human escalation
      ├── deadline/checklist logic
      ├── campaign engine
      ├── outbound queue
      └── Gemini study/retrieval layer
      ↓
Supabase Postgres
      ├── student registry
      ├── academic support state
      ├── course content
      ├── deadlines
      ├── audit/idempotency events
      ├── help requests
      ├── campaigns
      └── outbound queue

Vercel dashboard → aggregate-only /api/dashboard
Resend → email backup + human escalation
```

There is **no WhatsApp QR session, whatsapp-web.js, laptop process, VPS bot process, Node cron or Telegram bridge** in the canonical production architecture.

## WhatsApp is not optional

WhatsApp is the main student acquisition, onboarding, support and notification surface. The design therefore treats every WhatsApp interaction as an event with an idempotency key and keeps student state in Supabase rather than in the messaging provider.

Zapier remains the adapter that receives Meta WhatsApp events and sends the Vercel response back through WhatsApp Business. Vercel never stores a WhatsApp login session or QR credential.

## Current capabilities

- WhatsApp-first onboarding: unknown number → level → courses → active student
- `mycourses`, `help/menu`, `profile`, `email`, `examcheck`, `done`
- Human escalation from any point in onboarding
- Gemini study support grounded in registered course material
- Exam-hall checklist per student/course
- Deadline registry
- Privacy-safe aggregate operations dashboard
- Idempotent inbound message processing
- Outbound transactional queue
- Campaign creation, audience targeting and launch
- Campaign templates with `{{name}}`, `{{level}}`, `{{course}}`
- Opt-in guard on campaign delivery
- Message/event audit trail
- Server-side Supabase service key only
- Public Supabase policies restricted to non-sensitive reference data

## Campaign system

Campaigns are deliberately separated from transactional messages.

Example onboarding campaign:

```text
admin campaign create NOUN 2026 Onboarding | Welcome {{name}} 👋 Get NOUN Student Bot on WhatsApp for course reminders, exam checklists and study help. Reply HELP to explore.
```

Then target it:

```text
admin campaign target [campaign-id] level=100
```

Or course-specific:

```text
admin campaign target [campaign-id] level=300 course=CIT301
```

Then launch:

```text
admin campaign launch [campaign-id]
```

The launch creates `campaign_messages`; the campaign dispatcher puts them into the shared outbound queue. Zapier is responsible for the actual WhatsApp Business send step.

Recommended campaign families:

1. **Acquisition** — introduce the bot to eligible NOUN students.
2. **Onboarding completion** — students who started but did not finish registration.
3. **Academic activation** — prompt students to add courses and try study support.
4. **Exam readiness** — exam-checklist activation before examination periods.
5. **Deadline awareness** — targeted reminders around TMA/exam/admin dates.
6. **Reactivation** — opted-in students who have gone quiet.
7. **Human support** — targeted notices when a service/process requires staff attention.

Do not turn campaigns into spam. Use consent, clear identity, useful content, frequency limits and an opt-out mechanism before broad external launch.

## Environment variables

Configure these in Vercel. Never commit them.

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
WEBHOOK_SECRET
GEMINI_API_KEY
RESEND_API_KEY
RESEND_FROM
ADMIN_NUMBERS=234xxxxxxxxxx,234xxxxxxxxxx
ADMIN_EMAIL=admin@example.com
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. The browser must never receive it.

`WEBHOOK_SECRET` must be configured in the Zapier webhook action as `x-webhook-secret`.

## Zapier / WhatsApp contract

### Inbound Zap

Meta WhatsApp Business event → Zapier → POST to:

```text
/api/whatsapp-webhook
```

Payload should contain at least:

```json
{
  "message_id": "provider-message-id",
  "from": "2348000000000",
  "text": "help",
  "timestamp": "2026-08-10T00:00:00Z"
}
```

Vercel returns:

```json
{
  "reply": "...",
  "to": "2348000000000",
  "event_id": "..."
}
```

Zapier then sends `reply` to `to` through the connected WhatsApp Business action.

### Outbound dispatcher

Use a Zapier scheduled trigger to POST:

```json
{ "action": "dispatch" }
```

The endpoint returns a bounded batch of queued messages. Loop over the messages, send each through WhatsApp Business, then POST an acknowledgement:

```json
{
  "action": "ack",
  "id": 123,
  "status": "sent",
  "provider_message_id": "meta-message-id"
}
```

Use another scheduled Zap for:

```json
{ "action": "campaign-dispatch" }
```

This keeps Meta credentials and WhatsApp delivery inside the official/Zapier communication layer while Vercel remains the deterministic application layer.

## Database

`supabase-schema.sql` is now the canonical schema. It includes:

- `students`
- `deadlines`
- `exam_checklists`
- `help_requests`
- `course_content`
- `faculties`
- `message_events`
- `outbound_queue`
- `campaigns`
- `campaign_messages`

Run it against the existing Supabase project as a migration. It uses `IF NOT EXISTS`/safe `ALTER TABLE` statements for the fields introduced after v1.

## Security model

The old architecture allowed the publishable Supabase key to perform application writes under broad public policies. That is no longer the design.

Production rules:

- Vercel API uses the Supabase service-role key server-side.
- Browser dashboard never gets the service-role key.
- Student/checklist/event/queue/campaign tables have no public write policies.
- Dashboard exposes aggregate/non-sensitive information only.
- Incoming Zapier calls are authenticated with `x-webhook-secret`.
- Duplicate inbound events are rejected using `message_events.event_id`.
- Outbound messages use a queue with attempts and leases.
- Campaign delivery checks `whatsapp_opt_in`.
- Credentials are environment variables only.

## AI boundary

Gemini is a support layer, not the source of truth.

It may:

- explain concepts
- summarize supplied course material
- answer general study questions
- suggest study approaches

It may not:

- claim access to NOUN portal records
- submit registration/exams/payments
- impersonate NOUN
- take exams or graded work for students
- invent official administrative information

Course retrieval is currently deterministic keyword-overlap. The next retrieval upgrade should be embeddings + hybrid search once enough course material has accumulated to justify the operational complexity.

## Content pipeline

Official publicly accessible NOUN courseware should be ingested into `course_content` as structured modules with source URL/hash. The bot should explain/summarize rather than republish long source passages.

Recommended ingestion metadata:

```text
course_code
module_title
content
source_url
source_hash
created_at
```

## Human support

`human`, `help me`, `talk to someone` and `agent` create a `help_requests` record and notify the configured admin email. The student remains in WhatsApp and can continue using normal bot functions.

## Admin commands

```text
admin adddeadline [level] [course] [title] | [YYYY-MM-DD]
admin liststudents [level] [course]
admin campaign create Name | Message
admin campaign target [campaign-id] level=300 course=CIT301
admin campaign launch [campaign-id]
admin campaign pause [campaign-id]
admin campaign list
admin queue
```

## Dashboard

Live dashboard:

```text
https://noun-student-bot-dashboard.vercel.app
```

The dashboard now calls `/api/dashboard` and receives aggregate/non-sensitive operational data instead of reading student records directly from Supabase.

## Deployment sequence

1. Apply `supabase-schema.sql`.
2. Rotate every credential previously exposed during development.
3. Set Vercel environment variables.
4. Deploy the repository to Vercel.
5. Configure Zapier Meta WhatsApp inbound webhook to the Vercel endpoint.
6. Add `x-webhook-secret` to Zapier.
7. Configure the Zapier reply step to send `reply` to `to`.
8. Configure scheduled outbound dispatch and campaign-dispatch Zaps.
9. Test onboarding from an unregistered WhatsApp number.
10. Test duplicate Meta message delivery.
11. Test `human` escalation.
12. Test `examcheck` and `done`.
13. Test campaign create → target → launch → WhatsApp send.
14. Test failed outbound acknowledgement and retry behavior.
15. Only then move beyond Meta development/test recipients.

## Deliberate boundaries

The bot does not store NOUN portal passwords, silently submit academic actions, or automate exam-taking. Any future official-system integration must use explicit confirmation and preserve the student as the final actor for consequential submissions.

## Repository status

The canonical production implementation lives under `api/` and `dashboard/`. The old persistent WhatsApp/QR implementation has been removed to prevent architecture drift.
