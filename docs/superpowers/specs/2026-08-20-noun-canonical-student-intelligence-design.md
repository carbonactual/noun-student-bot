# NOUN Canonical Student Intelligence Design

## Goal
Extend NOUN Student Bot from a working Gemini-backed backend into a canonical Carbon Actual student-intelligence branch: one knowledge hierarchy, one identity-aware interaction model, one auditable event stream, and one outbound delivery path.

## Approved architecture

`WhatsApp → tenant-scoped identity → canonical NOUN knowledge → Gemini → response → activity/audit → outbound queue → provider acknowledgement`

The bot remains stateless at the application layer and uses Supabase as the system of record. Vercel remains the execution layer. Gemini remains the study-support model. WhatsApp/Zapier remains the transport boundary. No second database, second AI orchestration layer, or parallel knowledge hierarchy is introduced.

## Canonical knowledge

All conversational study requests must use the existing `lib/knowledge.js` hierarchy and its authority tiers:
- Tier 1: official NOUN
- Tier 2: official courseware
- Tier 3: official news
- Tier 4: student/verified secondary
- Tier 5: external

The WhatsApp path may additionally retrieve matched course content, but it must feed that material into the same canonical grounding model rather than inventing a separate ranking system.

## Identity and tenancy

Every read/write must be scoped to the active NOUN tenant. Student lookup, activity, help requests, campaigns, queues, and analytics must never cross tenant boundaries.

## Student intelligence

Record structured events for study questions, successful AI answers, AI fallbacks, help requests, onboarding transitions, checklist events, and delivery outcomes. Avoid storing unnecessary sensitive content in derived analytics; retain the canonical message event where required by the existing schema.

## Outbound delivery

All outbound messages must have an auditable queue lifecycle: queued → processing → sent/failed. Provider message IDs, errors, timestamps, attempts, and locking must be preserved. Duplicate inbound events must remain idempotent.

## WhatsApp AI

WhatsApp study questions use Gemini 3.6 Flash and the canonical NOUN knowledge hierarchy. The assistant acts as a tutor, must not claim access to live official records, must not fabricate NOUN administrative facts, and must refuse/redirect live-exam or academic-misconduct requests.

## Dashboard

The dashboard API must return tenant-scoped operational statistics, deadlines, campaigns, and demand indicators without exposing raw student-sensitive fields unnecessarily. Empty datasets are valid states, not errors.

## Security

- Require the configured webhook secret for protected mutation routes.
- Keep Gemini and Supabase service credentials server-side only.
- Maintain tenant scoping on every data mutation/read.
- Preserve audit events for privileged operations.
- Keep duplicate-event protection deterministic.
- Do not expose diagnostic endpoints that can probe provider credentials in production.

## Operational constraints

- Remain within the current Vercel serverless-function limit.
- Prefer modifying existing functions/modules over adding new functions when an existing boundary is suitable.
- Keep production diagnostics non-sensitive.
- Verify production deployment health after every production-affecting change.
