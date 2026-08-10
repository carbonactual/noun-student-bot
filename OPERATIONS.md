# NOUN Student Bot — Operations Runbook

## 1. WhatsApp inbound routing

Zapier receives Meta WhatsApp Business messages.

Route `STOP`, `UNSUBSCRIBE`, `OPT OUT` to:

```text
POST /api/preferences
```

Route `START`, `SUBSCRIBE`, `OPT IN` to the same endpoint.

All other messages go to:

```text
POST /api/whatsapp-webhook
```

Set `x-webhook-secret` on every request.

## 2. Transactional outbound

A scheduled Zap calls:

```json
{"action":"dispatch"}
```

to `/api/whatsapp-webhook`.

Loop over returned `messages`. For each message:

1. Send `text` to `to` using the connected Meta WhatsApp Business action.
2. POST to `/api/outbound-ack`:

```json
{"id":123,"status":"sent","provider_message_id":"META_ID"}
```

On failure:

```json
{"id":123,"status":"failed","error":"provider error"}
```

## 3. Deadline automation

Create a daily Zap, preferably after the NOUN operational day begins, calling:

```text
POST /api/automation
{"action":"deadline-dispatch"}
```

It queues 3-day and 1-day reminders and records each reminder on the deadline so the same reminder is not repeatedly generated.

## 4. Campaign automation

Admin creates and targets the campaign through the bot commands, then launches it.

A scheduled Zap calls:

```text
POST /api/automation
{"action":"campaign-dispatch"}
```

The endpoint converts eligible campaign messages into the outbound queue. A normal outbound dispatcher then sends them through WhatsApp Business.

## 5. Campaign safety

Campaigns only target `whatsapp_opt_in=true` students.

Use these variables:

```text
{{name}}
{{level}}
{{course}}
```

Recommended first campaign:

```text
NOUN Student Bot 2026 — Welcome & Activation
```

Purpose: explain what the bot does and get existing students to complete onboarding, add courses, and try `examcheck` or a study question.

## 6. Production verification

Test all of these before opening access beyond the Meta test recipient list:

- new WhatsApp number onboarding
- invalid level handling
- invalid course handling
- duplicate inbound message
- `help` / `menu`
- profile update
- email registration
- exam checklist
- human escalation
- Gemini answer with CIT301 grounding
- Gemini failure fallback
- deadline dispatch
- campaign targeting
- campaign launch
- WhatsApp STOP/START
- outbound success acknowledgement
- outbound failure acknowledgement
- dashboard loads without exposing phone/email/matric data

## 7. Security rotation

Any credential ever pasted into development chat, source files or logs must be treated as compromised.

Rotate:

- Supabase service/database credentials
- Gemini key
- Resend key
- Zapier/Meta secrets if exposed
- webhook secret

Never put any of these in GitHub source.
