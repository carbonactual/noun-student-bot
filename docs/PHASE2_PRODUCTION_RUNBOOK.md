# Phase 2 Production Runbook

## Runtime

WhatsApp -> webhook -> student context -> intent router -> domain retrieval -> ABBA policy -> response -> audit event.

Scheduled intelligence runs independently:

source scheduler -> fetch -> normalize -> fingerprint -> validate -> claims -> conflict/staleness checks -> publish -> retrieval index -> alerts/insights -> WhatsApp/Vercel.

## Event classes

- source.changed
- source.failed
- deadline.created
- deadline.changed
- timetable.changed
- announcement.created
- policy.changed
- opportunity.created
- opportunity.expiring
- service.requested
- service.match.created
- financial_product.changed
- human.escalation
- campaign.draft.created

## Automation policy

Automatic: monitoring, classification, deduplication, freshness scoring, personalized reminders for consented students, evidence-backed answers, internal insight generation, admin alerts for failures/conflicts.

Approval required: mass campaigns, institutional publication, financial execution, trade execution, deletion, consent changes, irreversible external actions.

## Insight engine

ABBA should aggregate only validated events and student-consented profile/context signals. Generate periodic insight candidates such as:

- upcoming academic deadlines
- changed timetable/policy
- new verified opportunity
- relevant student-service opportunity
- verified economic-access opportunity
- repeated student friction needing institutional attention

Insight candidates become campaigns only after the campaign approval gate.

## Failure handling

Source failure does not erase prior verified data. Mark source stale/degraded, retain last known evidence, alert operators, and suppress claims that require fresher evidence.

Provider/service failures are isolated from the WhatsApp response path. A failed enrichment must degrade gracefully to the base answer.

## Security

Never store WhatsApp login credentials or portal passwords. Secrets belong in deployment secret stores. Student academic data remains tenant-scoped and RLS-protected. Provider discovery requires consent. Financial execution stays outside this repository.
