# NOUN Academic Coverage — Full Learner Ladder

NOUN Student Bot is a **multi-level academic support system**, not an undergraduate-only bot.

## Canonical learner ladder

The bot must recognize and route students across these academic pathways:

1. **Certificate** — certificate and professional/short-cycle certificate pathways.
2. **Undergraduate** — diploma/bachelor-level study, including the existing 100–400 level workflows where applicable.
3. **Postgraduate Diploma** — postgraduate diploma pathways.
4. **Master's** — all supported master's programmes and their course/academic workflows.
5. **PhD / Doctoral** — doctoral programmes, research-stage support and postgraduate academic workflows.

## Identity model

A person may have more than one academic relationship over time. Therefore `students.level` remains as a backward-compatible field for existing undergraduate operations, while the canonical profile uses:

- `students.study_level`
- `students.programme_id`
- `students.programme_title`
- `students.award_title`
- `students.academic_status`
- `students.admission_session`
- `students.expected_completion_date`
- `student_programmes` for multiple/current/historical programme relationships

This prevents a master's or PhD learner from being forced into an undergraduate-shaped record and allows alumni, graduates and returning students to remain part of the same identity graph.

## Programme discovery

The academic knowledge graph must cover faculties, departments, programmes, programme level/award type, courses, programme-course relationships, course offerings, admission requirements/routes, academic events, assessments, and official policies/verified knowledge sources.

Programme and admission data must be source-backed and versionable. The bot must distinguish official, verified-secondary, conflicting, stale and unknown information rather than presenting uncertain data as official.

## Experience by level

### Certificate

Support discovery, eligibility, programme information, course/content support, scheduling, deadlines, assessments and completion-oriented reminders where source data supports them.

### Undergraduate

Retain the existing WhatsApp-first experience: onboarding, level/course selection, `mycourses`, exam checklist, deadlines, study support and human escalation.

### Postgraduate Diploma

Use programme-first onboarding rather than assuming numbered undergraduate levels. Support programme, department, course, academic events, deadlines, assessment and study support.

### Master's

Use programme/research-aware onboarding. Support taught-course and research-oriented contexts where relevant, with official-source verification for admissions, policies, deadlines and programme requirements.

### PhD / Doctoral

Use programme/research-stage identity rather than undergraduate level. Support doctoral programme information, research-stage context, academic events, policy/requirement retrieval, source-backed study/research assistance and human escalation.

The bot must never impersonate NOUN staff, submit consequential official actions without an authorised human confirmation flow, or claim access to private university systems it does not actually have.

## Campaign and operations targeting

Campaigns and operator dashboards should segment by `study_level` in addition to the existing undergraduate `level`, course, faculty and stage filters.

Recommended labels: `certificate`, `undergraduate`, `postgraduate_diploma`, `masters`, `doctoral`.

## Data principle

The same human can move from certificate → undergraduate → postgraduate → master's → PhD without creating a new identity. Academic progression is a relationship/history change attached to the same person, not a replacement of the person record.
