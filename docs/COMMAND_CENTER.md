# ABBA Command Center

The Vercel application is the operator viewing portal and serverless backend. Supabase remains the system of record.

## Command-center domains

1. System health — source, data and overall health.
2. Students — population and onboarding state.
3. Academic — verified events, deadlines and assessment intelligence.
4. Intelligence — changes, insights and service-demand signals.
5. Opportunities — internships, SIWES, scholarships, jobs, competitions and events.
6. Services — verified student-life providers and stale/expiring offers.
7. Communications — WhatsApp delivery/response/opt-in health.
8. Support — human escalation queue.
9. AI quality — grounding, confidence, deferrals, errors and usage/cost.
10. Data quality — missing mappings, duplicate records, stale sources and conflicts.
11. Campaigns — candidates, approvals, active campaigns and outcomes.
12. Governance — consent, audit, retention and human approvals.
13. Infrastructure — Vercel, Supabase, scheduled workers, Zapier and Gemini health.

## Operating principle

The portal is a window into the system, not a second system of record.

`Sources -> ingestion -> validation -> Supabase -> ABBA -> Vercel command center -> operator action -> WhatsApp/student -> outcomes -> intelligence`

## Decision states

- Observe: record only.
- Review: requires operator attention.
- Recommend: ABBA proposes an action.
- Escalate: human support or governance intervention.
- Campaign candidate: eligible for review, never automatically broadcast.
- Approved: explicit human approval exists.

## Safety

Student-specific data must remain access-controlled. Aggregate intelligence should be preferred for trend/campaign analysis. Third-party providers must not be represented as NOUN-endorsed without authoritative evidence. Prices and availability require verification timestamps and expiry handling.
