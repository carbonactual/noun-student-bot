# Phase 2 Implementation Matrix

| Domain | Data | Intelligence | Delivery |
|---|---|---|---|
| Academic | faculties/departments/programmes/courses | progression/prerequisites | WhatsApp + portal |
| Assessment | TMA/exams/timetable | eligibility/reminders | WhatsApp |
| Knowledge | courseware/policies/notices | evidence/freshness/conflicts | ABBA |
| Student life | centres/services/events | contextual discovery | WhatsApp + portal |
| Opportunities | jobs/internships/grants/scholarships | matching | WhatsApp + portal |
| Peer economy | providers/offers/requests | service matching | WhatsApp + portal |
| Economic access | finance/devices/BNPL/grants | eligibility explanation | WhatsApp + portal |
| Human layer | verified contacts/escalation | confidence-based routing | WhatsApp/email |

## Required source lifecycle

`discover -> fetch -> normalize -> fingerprint -> classify -> validate -> evidence -> claims -> conflict detection -> publish -> monitor`

## Required ABBA answer contract

Every consequential factual answer should carry enough internal evidence to identify:

- source
- authority
- retrieval time
- effective date where known
- confidence
- whether human review was required

The student-facing response need not expose all metadata, but the portal/audit layer must retain it.

## Phase 2 completion criteria

Phase 2 is complete only when each domain has at least one authoritative source, persisted records, validation rules, retrieval integration, WhatsApp delivery where applicable, portal visibility where applicable, and a human fallback.

No domain may be marked complete solely because its table exists.
