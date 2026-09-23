# NOUN BOT Learning Product Benchmark — 2026

This is a non-binding product benchmark for regression prevention. It records capabilities that comparable learning products expose publicly and the NOUN-specific baseline we should preserve.

## Required learning surfaces

| Capability | NOUN BOT contract |
|---|---|
| Contextual tutoring | ABBA uses learner context, course, mode and verified evidence. |
| Guided learning | Tutor and tutorial modes should teach rather than merely return answers. |
| Active recall | Practice, quizzes and flashcards are first-class study actions. |
| Student material ingestion | Bounded student-supplied notes/text can enter the current learning session. |
| Study transformation | The Study Lab exposes study-guide, practice-test, flashcard, explanation and short-plan workflows. |
| Adaptive continuity | Student activity, priorities, learning sessions and questions are persisted where appropriate. |
| Evidence | Current institutional facts prefer official NOUN sources and are distinguishable from secondary evidence. |
| Human handoff | Consequential or low-confidence institutional matters have an explicit human path. |
| Accessibility | Responsive layout, keyboard focus, reduced-motion support and readable typography remain mandatory. |
| Recovery | Runtime fallbacks, outbound retries, idempotency and autonomous health probes must prevent a transient failure becoming a silent dead end. |

## Benchmark observations

Quizlet publicly exposes AI-generated practice tests, study guides, flashcards, PDF summarization and homework help, with uploaded notes/slides/documents feeding those workflows.

Google's education products publicly expose personalized practice, study guides, quizzes, source-grounded notebooks, citations, interactive creation, audio overviews and live multimodal learning.

NOUN's own public environment exposes the LMS, TMAs, course materials, video guides, eCourseware, academic calendar, notices, FAQs and student support.

## NOUN-specific design law

NOUN BOT must not copy competitor branding or interfaces. It should translate the useful capability patterns into the NOUN/ABBA operating model:

1. Institution truth first.
2. Student context travels with the learner.
3. One ABBA reasoning path across web and WhatsApp.
4. AI teaches and prepares; it does not impersonate the institution or complete graded assessment.
5. Human authority remains explicit.
6. Every autonomous workflow is retryable, observable and fail-safe.
7. Public pages stay calm; depth belongs inside the authenticated student space.
