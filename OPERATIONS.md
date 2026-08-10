# NOUN Student Bot — Production Operations v2

## System boundary

- **WhatsApp worker:** `index.js` remains a persistent Node.js process because `whatsapp-web.js` requires an always-on browser session.
- **Database:** Supabase is the shared source of truth for authoritative student state.
- **Dashboard:** `dashboard/` is deployed on Vercel and should use only the publishable/anon key with read-only RLS policies.
- **Automation layer:** Zapier handles integration/event routing, WABA workflows, deployment events, and external automation. It does not own academic business rules.
- **Study layer:** `lib/study-retrieval.js` and `api/study.js` are read-only over `course_content` and may not mutate authoritative academic state.

## Required runtime configuration

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_NUMBERS=234xxxxxxxxxx,234yyyyyyyyyy
TELEGRAM_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
GEMINI_API_KEY=
```

Never commit service-role keys, provider tokens, WhatsApp session data, or other credentials. Rotate any credential that has ever been committed to repository history.

## Hardened behavior

1. New students are persisted in `ask_level` state so onboarding survives process restarts.
2. Level is nullable during onboarding and becomes required logically before the student reaches `active`.
3. Course codes are normalized, deduplicated, and capped at 12.
4. Students cannot update an exam checklist for a course they did not register.
5. Admin commands validate level, course, message, and ISO date input.
6. Broadcasts and reminders continue after an individual WhatsApp delivery failure.
7. Deadline cron runs in `Africa/Lagos` time explicitly.
8. Admin notification failures never crash the bot.
9. WhatsApp authentication, disconnect, and runtime errors are logged.
10. User-facing errors fail closed without exposing stack traces.
11. Transport events have an idempotency key so Zapier/WhatsApp retries do not create duplicate processing records.
12. Study retrieval is read-only and is isolated from student/registration/checklist mutations.
13. Grounded study responses expose source metadata so answers can be audited.

## Event-routing contract

Canonical flow:

`WhatsApp/WABA → Zapier → POST /api/whatsapp-webhook → classify → authoritative command OR read-only study route → response`

The shared event boundary is implemented in `lib/event-router.js`.

Minimum normalized event fields:

```json
{
  "event_id": "provider-message-id",
  "source": "whatsapp",
  "from": "234xxxxxxxxxx",
  "text": "What is ...?",
  "received_at": "2026-08-10T00:00:00.000Z"
}
```

Zapier should pass the provider message ID as `event_id` whenever available. If an event is retried, the application returns the previously recorded response instead of processing the event again.

## Study API

`POST /api/study`

Request:

```json
{
  "phone": "234xxxxxxxxxx",
  "question": "Explain this topic"
}
```

The endpoint looks up the student's registered courses, retrieves matching `course_content`, asks Gemini to answer only from that evidence, and returns source metadata. It does **not** modify `students`, registrations, deadlines, or checklists.

The retrieval implementation currently uses deterministic lexical ranking. The interface is intentionally isolated so embedding/vector retrieval can replace the ranking implementation later without changing the academic core.

## Supabase migration

Run `supabase-schema.sql` first, then `supabase-migrations/2026-08-10-study-events.sql` against a non-production project. The second migration creates the transport/audit `bot_events` table with a unique event ID and RLS enabled.

## Zapier / WhatsApp Business bridge

Keep the current persistent WhatsApp worker intact until the WABA webhook flow has been validated end-to-end.

Recommended automation boundary:

`WhatsApp Business event → Zapier → validation/routing → Vercel API → Supabase → WhatsApp Business response`

Do not duplicate student validation, permissions, academic workflow rules, or AI grounding rules in Zapier. Zapier should transform, route, retry, and notify; the application remains authoritative.

## Release gate

Before production merge:

- Run `npm install` and Node syntax checks on all changed JavaScript files.
- Apply both Supabase migrations in a non-production project first.
- Test onboarding, `mycourses`, `examcheck`, `done`, deadline creation, reminders, group creation, and broadcast failure handling.
- Test duplicate webhook delivery using the same `event_id` twice.
- Test a study question with a registered course and verify source metadata is returned.
- Test a question with no matching evidence and verify the grounded-false response.
- Confirm Vercel dashboard still loads with the publishable key and RLS enabled.
- Confirm no secrets are present in Git history; rotate any previously exposed credentials before production use.
- Only then merge the PR and let the connected Vercel project deploy.
