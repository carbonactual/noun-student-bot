# WhatsApp Business Cloud API — Migration Runbook (Oct 2026)

## Why
Both WhatsApp numbers (owner personal + bot 0704 648 1828) were banned on Oct 10, 2026.
Root cause: the bot's send path ran through an external/unofficial bridge. The permanent fix
is the OFFICIAL WhatsApp Business Cloud API (Meta). Unofficial automation will get any new
number banned again — do not reuse any bridge on the new line.

## Code state (DONE, deployed, dormant until configured)
- `lib/wa-cloud.js` — official sender: `sendText()` via Graph API, `drainOutbound()` queue drain
  (only to phones with inbound in the last 24h — the free-form customer-service window).
- `api/whatsapp-webhook.js` — now handles:
  - GET → Meta webhook verification handshake (`hub.challenge`, verify token = WA_VERIFY_TOKEN)
  - POST with Cloud API envelope → normalizes each message into the existing bot brain,
    then delivers the reply DIRECTLY via Graph API (no bridge)
  - POST with legacy normalized body → unchanged old path
- `api/wa-drain.js` — cron endpoint for queue drain (auth: x-webhook-secret, ?secret=,
  or Authorization: Bearer CRON_SECRET via Vercel cron).
- `vercel.json` — daily 07:30 cron on /api/wa-drain.

## Env vars needed on Vercel (project: noun-student-bot-dashboard)
| Var | What |
|---|---|
| WA_CLOUD_TOKEN | Permanent system-user access token (whatsapp_business_messaging + whatsapp_business_management) |
| WA_PHONE_NUMBER_ID | Phone number ID from Meta (not the phone number itself) |
| WA_VERIFY_TOKEN | Webhook handshake string — **ALREADY SET on Vercel (Oct 10, 2026)**; tell the owner the value when wiring Meta, or rotate |
| CRON_SECRET | **ALREADY SET on Vercel (Oct 10, 2026)** — lets the daily cron authenticate to /api/wa-drain |

Existing vars (SUPABASE_*, GEMINI_API_KEY, WEBHOOK_SECRET, ADMIN_NUMBERS, ADMIN_EMAIL, RESEND_*) unchanged.

## Meta-side setup (owner steps, ~20 minutes, needs Business Manager admin)
1. business.facebook.com → your Business Manager → create/approve a Meta app with the
   WhatsApp product (developers.facebook.com → My Apps → Create App → Business).
2. In the app's WhatsApp → API Setup: a WABA is auto-created. Register a NEW phone number
   (fresh SIM; the banned line cannot migrate while banned). Verify by SMS/call.
   Copy the temporary + permanent token, and the Phone number ID.
3. Webhook configuration: callback URL
   `https://noun-student-bot-dashboard.vercel.app/api/whatsapp-webhook`
   verify token = the WA_VERIFY_TOKEN string. Subscribe to the `messages` field.
4. Add a payment method in Meta Business settings (billing) — Cloud API usage is billed
   per message; Nigeria rates are among the lowest. Without a payment method, sending
   stops after the free test tier.
5. Business verification (optional at launch): unverified businesses can message up to
   250 unique users per rolling 24h — enough to start. Verify when scaling (CAC docs).
6. Create a System User in Business settings → generate permanent token with
   whatsapp_business_messaging + whatsapp_business_management → that's WA_CLOUD_TOKEN.

## Rules of the official rail (why bans won't recur)
- Business-initiated messages outside a 24h customer window require PRE-APPROVED templates.
  V1 code only free-form replies inside the window (inbound-triggered) + queue drain to
  phones active in the last 24h. Templates to submit later: deadline_alert, exam_reminder.
- No mass cold campaigns without opt-in evidence (campaigns table already gates on
  whatsapp_opt_in = true).
- Rate limits: 80 messages/second shared — far beyond our volume.

## Test plan (after envs are set)
1. Owner texts the new number "help" → expects the menu back within seconds.
2. Onboard flow: 100 → CIT301, MTH281 → menu.
3. Admin: "admin queue" → queue size; "admin adddeadline 300 CIT301 TMA | 2026-11-01".
4. GET /api/wa-drain?secret=... → {ok:true, configured:true, sent:n}.
