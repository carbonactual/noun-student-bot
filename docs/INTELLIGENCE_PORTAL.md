# Vercel Intelligence Portal

Vercel is the backend/API and viewing portal for the NOUN Student Intelligence system. It is not the primary student database.

## Role

Vercel exposes serverless APIs that aggregate the live Supabase state for authorized operators. The portal is an operational window into the system.

## `/api/intelligence-portal`

Returns a single aggregated view covering:

- system health
- student graph counts
- academic events
- intelligence changes
- demand signals
- verified student services
- insights
- campaigns
- help requests
- monitored sources

## Architecture

`WhatsApp / Meta / Zapier -> Vercel APIs -> Supabase -> ABBA intelligence -> Vercel portal`

External source monitors and GitHub scheduled workers feed the same backend. Vercel does not hold persistent processes.

## Missing domains explicitly reserved

The portal must eventually expose:

1. Source health and freshness
2. Knowledge graph coverage and reconciliation gaps
3. Student onboarding funnel and retention
4. WhatsApp delivery/response health
5. AI usage, grounding and refusal metrics
6. Academic-risk signals
7. Service supply/demand and provider verification
8. Opportunity pipeline
9. Insight-to-campaign pipeline
10. Consent/privacy/audit events
11. Cost and infrastructure usage
12. Human escalation/SLA
13. Data quality and stale-record queues
14. Security events and secret/config health

Student PII must not be included in aggregate portal responses unless an explicitly authorized operational view requires it. The aggregate endpoint is intended for system intelligence, not unrestricted student record browsing.
