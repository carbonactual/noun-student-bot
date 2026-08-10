# NOUN Student Bot — Production Operations v2

## System boundary

- **WhatsApp worker:** `index.js` remains a persistent Node.js process because `whatsapp-web.js` requires an always-on browser session.
- **Database:** Supabase is the shared source of truth.
- **Dashboard:** `dashboard/` is deployed on Vercel and should use only the publishable/anon key with read-only RLS policies.
- **Automation layer:** Zapier can handle WABA notifications, deployment events, and external workflow routing without moving the persistent WhatsApp worker onto Vercel.

## Required runtime configuration

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_NUMBERS=234xxxxxxxxxx,234yyyyyyyyyy
TELEGRAM_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
```

Do not commit service-role keys, Telegram tokens, WhatsApp session data, or other credentials.

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

## Supabase migration

Run `supabase-schema.sql` against the existing database. The migration makes the original v1 `students.level` constraint compatible with persisted onboarding state and adds `updated_at` plus useful indexes.

## Zapier / WhatsApp Business bridge

The connected WhatsApp Business account can be used for a future Meta Cloud API path. Keep the current persistent WhatsApp worker intact until the WABA webhook flow has been validated end-to-end.

Recommended automation boundary:

`WhatsApp Business event → Zapier → validation/routing → Vercel/API or downstream app → Supabase → WhatsApp Business response`

Do not duplicate business logic in Zapier. Core student state, permissions, validation, and academic workflow rules belong in the application/data layer.

## Release gate

Before production merge:

- Run `npm install` and a Node syntax check on `index.js` and `db-supabase.js`.
- Apply the Supabase migration in a non-production project first.
- Test onboarding, `mycourses`, `examcheck`, `done`, deadline creation, reminders, group creation, and broadcast failure handling.
- Confirm Vercel dashboard still loads with the publishable key and RLS enabled.
- Confirm no secrets are present in Git history.
- Only then merge the PR and let the connected Vercel project deploy.
