# Phase 2 — NOUN Domain Intelligence Contract

## Objective

Turn the NOUN tenant into a verified, living education and economic-access knowledge domain without coupling it to Carbon Actual I/O finance execution.

## Domains

1. Academic ontology: faculties, departments, programmes, qualifications, levels, courses, course versions, offerings and requirements.
2. Academic operations: registration, TMA, assessments, examinations, timetables, calendars, progression and graduation readiness.
3. Knowledge: official courseware, policies, notices, announcements, FAQs and source evidence.
4. Student life: study centres, ID/matriculation, materials, textbooks, graduation/gowns, internships, SIWES, activities, clubs and events.
5. Human contact: verified departments, faculty, centre, support and escalation contacts with provenance and freshness.
6. Opportunities: scholarships, grants, jobs, internships, competitions, training, entrepreneurship and institutional opportunities.
7. Peer economy: student services, provider profiles, matching, availability, verification, reputation and disputes.
8. Economic access: student/staff finance, business finance, grants, device funding, laptop/phone programmes, BNPL discovery, insurance and financial literacy.
9. Financial routing: discovery and explanation only in this tenant; regulated lending, payment, wallet, P2P finance and settlement remain Carbon Actual I/O capabilities.

## ABBA intelligence rules

- Every externally sourced claim carries source, authority class, retrieved_at, effective_at when known, freshness, and verification status.
- Conflicting authoritative claims are not silently merged; they create a review item.
- Stale material is downgraded or withheld according to source policy.
- Financial products are presented with provider, terms, fees, eligibility, total cost where available, source and verification date.
- ABBA never guarantees approval for a financial product.
- Student academic data is not exposed to marketplace customers unless the student intentionally publishes the relevant provider information.
- Student providers are prioritized only when they meet the actual service requirements; student status never overrides qualification, safety, availability or legality.
- Human escalation remains available whenever confidence is inadequate or the action is consequential.

## Event model

Every source change, student interaction, opportunity match, provider interaction, financial-access discovery and human escalation should be represented as a timestamped tenant-scoped event where appropriate.

## Source pipeline

`discover -> fetch -> normalize -> fingerprint -> classify -> validate -> store evidence -> detect change -> review if needed -> publish to retrieval index -> ABBA`

## Matching pipeline

`request -> intent -> constraints -> candidate retrieval -> eligibility -> ranking -> safety checks -> explain match -> user chooses -> contact/transaction outside intelligence layer`

## Financial-access pipeline

`need -> product discovery -> source verification -> eligibility explanation -> cost/terms explanation -> provider routing`

No money movement occurs in the NOUN intelligence layer.

## Completion gate

Phase 2 cannot be marked complete until production evidence demonstrates:

- complete current programme/course graph for the authoritative catalogue;
- authoritative source registry and freshness monitoring;
- verified contact directory;
- academic calendar/exam/TMA ingestion;
- service/opportunity ingestion;
- provider opt-in and profile controls;
- matching tests;
- financial-access source verification;
- contradiction/staleness handling;
- evidence-backed ABBA responses;
- tenant isolation preserved;
- WhatsApp, Vercel portal and scheduled workers all use the same tenant-aware domain services.

## Non-goals

- Do not embed Carbon Actual I/O wallet/ledger/payment code in this repository.
- Do not store portal passwords.
- Do not submit exams, assignments or institutional transactions without explicit user-controlled approval and supported institutional flow.
- Do not manufacture missing NOUN data.
