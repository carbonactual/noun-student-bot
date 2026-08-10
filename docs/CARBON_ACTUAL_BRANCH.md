# NOUN BOT — Carbon Actual Integration Contract v1.0

NOUN BOT is a Carbon Actual product branch.

## Inheritance

The product inherits the Carbon Actual Foundation/Floor concepts rather than creating parallel primitives:

- Human / # identity
- HAPI
- ABBA orchestration
- Seal / human approval
- Pulse / event evidence
- Value
- provenance / ledger
- contracts / commitments / duties / service
- security / privacy / recovery
- APIs / SDKs / adapters

## Product boundary

NOUN BOT remains a NOUN student support and education product. Its current WhatsApp-first production implementation is preserved. Carbon Actual integration must not silently change its existing operational behavior.

## Human-first academic rule

The student remains the final actor for consequential academic submissions. The AI may explain, summarize supplied course material, answer study questions and assist with study planning. It must not impersonate the student, take exams, or silently submit registration, examinations, payments or other consequential academic actions.

## Event and Pulse mapping

Existing message events, onboarding events, help requests, checklist completion, learning/support interactions and other validated activity may later map into canonical Pulse events through an explicit adapter. Existing operational event semantics remain authoritative until migration is tested.

## Identity mapping

NOUN BOT's current student registry is a product-domain representation. It should not become a second ecosystem identity system. A future adapter may map a student to a # / HAPI identity after identity, consent, privacy and migration rules are defined.

## Security

No secrets are moved into client-side code. No portal passwords are stored by the bot. Existing server-side credential and webhook-secret boundaries remain mandatory.

## Migration principle

Integration is additive and reversible. Do not rewrite production data or replace the existing application architecture merely to satisfy the Carbon Actual model. Introduce adapters at stable boundaries, validate, then migrate incrementally.
