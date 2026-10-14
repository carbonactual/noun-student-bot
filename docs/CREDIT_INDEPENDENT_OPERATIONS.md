# Credit-Independent Operations Runbook (Oct 15, 2026)

Owner directive: the ecosystem must keep running even when Superagent/LLM credits are exhausted or unavailable. This runbook separates the two rails.

## RAIL 1 — CREDIT-FREE (runs with zero Superagent credits)

These run on pure infrastructure: Vercel cron + Supabase + Meta Graph API + Gemini engine. They never consume Superagent message credits.

| System | How it runs | When |
|---|---|---|
| Student deadline alerts | Vercel cron -> /api/wa-drain?pipeline=1 -> deadline-dispatch -> outbound_queue | Daily 07:30 |
| Campaign delivery | Same tick -> campaign-dispatch -> outbound_queue | Daily 07:30 |
| WhatsApp send/drain | wa-drain -> lib/wa-cloud.js -> Meta Graph API (24h-window-safe) | Daily 07:30 + on every inbound message |
| WhatsApp inbound (once Cloud API live) | Meta webhook -> /api/whatsapp-webhook -> ABBA brain (Gemini) -> Graph API reply | Real time |
| CIBN + NOUN web chat | Gemini engine on Vercel (ai-study endpoint), no ABBA turn needed | Real time |
| Checkout | Flutterwave rail (activates with FLW_SECRET_KEY), WhatsApp fallback message | Real time |
| Gmail security patterns | (scan itself needs ABBA — see Rail 2) | — |

## RAIL 2 — NEEDS ABBA CREDITS (keep minimal while on leave)

| Task | Cadence | Notes |
|---|---|---|
| Weekly Gmail security scan | Weekly | Workflow active. SECURITY PRIORITY — keep. |
| New content authoring (FB posts, emails) | On demand | Batch-author while credits exist; Meta API supports scheduled publishing (published=false + scheduled_time) so posts publish with ZERO credits. |
| B2B email outreach blasts | Batch | Gmail connector + ABBA turn. Do in batches; each blast is one turn, not N. |
| Strategy / analysis / reporting | On demand | Weekly at most during leave. |

## CREDIT PROTECTION (already enforced)
- Tumi Toys Content Engine: DEACTIVATED Oct 15 (was burning a credit every run while failing on the Facebook blocker). Reactivate after FB re-auth.
- Exam Season engine: inactive (season complete).
- Content publishing while Facebook is blocked is impossible; do NOT leave posting workflows active during the block — each run wastes credits.

## SCHEDULED FACEBOOK POSTS (zero-credit publishing)
When the Facebook connection is re-authorized, batch-author posts and create them with scheduled_time via Graph API. Meta publishes them on schedule with no runtime credits. Queue lives in docs/FB_POST_QUEUE/ (to be filled post-re-auth).

## ACTIVATION SEQUENCE (owner unlock)
1. Facebook re-auth (pages + business_management scopes) -> publishing + scheduled posts + Tumi engine back on.
2. Meta WhatsApp setup (SIM or test number + payment method) -> WA_CLOUD_TOKEN + WA_PHONE_NUMBER_ID -> webhook subscribe -> queues (already filling) start delivering.
3. FLW_SECRET_KEY -> checkout goes live on CIBN BOT.
