# NOUN Academic Intelligence

## Authority model

1. Official NOUN sources — authoritative.
2. Official NOUN courseware — authoritative for educational content, subject to source terms.
3. Official NOUN announcements/news — authoritative for the published announcement.
4. Verified secondary/student material — supplementary evidence only.
5. Other external material — contextual only.

Secondary evidence must never silently override a conflicting official NOUN source.

## Student intelligence

Store structured academic state and event telemetry. Do not infer sensitive attributes or make consequential decisions from behavioural signals. Aggregate institutional insights to avoid exposing individual students.

## AI answer contract

The AI must:

- distinguish fact, policy, course content, inference and unknown;
- prefer current authoritative sources;
- surface conflicts;
- state uncertainty;
- never invent registration, results, eligibility, fees, deadlines or official decisions;
- never claim to have accessed a student's NOUN portal unless a verified integration actually exists;
- support learning and revision, not live examination assistance or misconduct.

## Live-source retrieval

The database is not required to contain a copy of every academic source. `lib/live-sources.js` can retrieve bounded, current HTTPS content from official NOUN pages plus approved registered/configured source URLs at answer time. `lib/knowledge.js` merges this live evidence with tenant-scoped cached knowledge, preserving authority tier, provenance, freshness and source URL.

Configured external domains may be constrained with `NOUN_ALLOWED_SOURCE_DOMAINS`. Additional source URLs may be supplied with `NOUN_SOURCE_URLS`, while active records in `knowledge_sources` can also participate in live retrieval without copying their full content into the database.

Live evidence is never treated as evidence of private NOUN portal access. Retrieval failures degrade back to available verified database evidence rather than inventing an answer.

## Timetable and alert contract

Only `verified` academic events generate automatic alerts. Student alerts require matching course/level context and WhatsApp opt-in. Duplicate alerts are suppressed by event/window key.

## Assessment contract

Past questions may be used for revision only. Each assessment record carries provenance and verification status. Student-submitted material is never presented as official without verification. Live-source discovery does not change that rule.

## Insight-to-campaign contract

`draft insight -> review -> approved insight -> draft campaign -> explicit launch`.

Approval never automatically sends a WhatsApp campaign. Campaigns require explicit launch and opt-in targeting.

## Product typography

Public and student-facing pages share `--font-display` for editorial headings and `--font-body` for interface text. The implementation intentionally uses local/system font stacks rather than adding a third-party font dependency.
