# ABBA × NOUN System Map

ABBA is the master Carbon Actual intelligence/orchestration layer. NOUN Student Intelligence is a bounded education-domain node. Vercel is the serverless backend and operator viewing portal; Supabase is the persistent system-of-record.

## Existing domains

- Identity/onboarding
- Student profile
- Course/programme knowledge graph
- Courseware
- Academic events/timetables
- Assessment/past-question repository
- Policy/source intelligence
- Real-time source monitoring
- Gemini study intelligence
- WhatsApp interaction
- Student services
- Service-demand intelligence
- Insights
- Campaign control
- Human escalation

## Missing domains fitted into the structure

### 1. Opportunity intelligence
Internships, SIWES, scholarships, grants, competitions, jobs, fellowships, volunteering, events and professional development.

### 2. Student lifecycle
Onboarding -> active study -> exams -> progression -> graduation -> alumni. Each transition can produce relevant tasks, alerts and opportunities.

### 3. Academic risk
Missed deadlines, repeated help requests, low engagement signals, unresolved clearance, timetable conflicts and other explainable signals. No consequential decision should be made solely by AI inference.

### 4. Communication intelligence
WhatsApp delivery, inbound/outbound message status, template usage, opt-in/opt-out, failed deliveries, response latency and escalation.

### 5. AI observability
Model requests, grounding source IDs, confidence, refusal/defer reasons, errors, latency and cost. Store minimal content and avoid unnecessary student PII.

### 6. Data quality
Missing mappings, duplicates, stale sources, conflicting official sources, failed parsers and records awaiting verification.

### 7. Source health
Last successful fetch, freshness, HTTP/parser failures, content hash, source authority and stale threshold.

### 8. Provider/marketplace intelligence
Provider verification, service prices, expiry, demand, supply, complaints/reviews and conflict-of-interest controls. Commercial data must remain distinct from official NOUN information.

### 9. Consent and governance
Communication consent, data-purpose records, audit events, human approvals, campaign approvals, retention and deletion workflows.

### 10. Operations and cost
Vercel execution errors, Supabase health, scheduled-worker runs, Gemini usage, WhatsApp usage, automation failures and infrastructure cost signals.

### 11. Human operations
Help queue, SLA, assignment, resolution and escalation analytics.

### 12. Campaign intelligence
Insight -> candidate -> review -> approved -> scheduled -> delivered -> engagement -> outcome. Commercial and institutional campaigns must be distinguishable.

## Vercel portal views

The viewing portal should aggregate these domains into:

1. Command Center
2. Students
3. Academic Intelligence
4. News & Sources
5. Opportunities
6. Student Services
7. Demand & Trends
8. Insights
9. Campaigns
10. WhatsApp Operations
11. AI/Knowledge Quality
12. Human Support
13. Data Quality
14. Governance/Audit
15. Infrastructure/Costs

The portal is an operator window, not a replacement for Supabase, Meta, Zapier or source systems.
