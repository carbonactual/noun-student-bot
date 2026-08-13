# Carbon Actual Core + NOUN Value Network Design

## Goal
Establish Carbon Actual Core as the canonical common-denominator architecture for NOUN and future ecosystem products, while keeping NOUN-specific behavior in the NOUN domain and Carbon Actual I/O financial execution outside this repository.

## Architecture

Carbon Actual Core owns reusable primitives: Entity, Role, Relationship, Product, Service, Offer, Request, Order, Listing, Marketplace, Trade, Asset, Opportunity, Contact, Event, Knowledge, Consent, Verification, Reputation, Case, Task, Workflow, Message, Notification, Campaign and Audit Event.

NOUN owns extensions and source-backed academic/institutional data. Carbon Actual I/O remains the separate execution boundary for regulated finance, wallets, ledgers, payments, P2P finance and settlement.

## Value-chain model

Student -> Learner -> Skill/Qualification -> Opportunity -> Service/Product Offer -> Match -> Order/Engagement -> Value Event -> Reputation/History -> Economic Access -> Future Carbon Actual services.

## Core principles

- One canonical primitive per ecosystem concept.
- Product-specific extensions reference Core primitives rather than redefine them.
- Every record is tenant-scoped where it belongs to a product/institutional domain.
- Identity, authorization, consent and audit are separate concerns.
- Source-backed institutional claims carry provenance and freshness.
- Marketplace matching prioritizes relevance, qualification, safety and availability before ecosystem preference.
- Financial discovery may occur in NOUN; regulated financial execution remains in I/O.
- WhatsApp is the primary NOUN student communication channel; Vercel is the operational/aggregate portal.
- No portal passwords or silent consequential institutional submissions.

## Capability domains

1. Academic: faculties, departments, programmes, qualifications, courses, courseware, prerequisites, progression, TMA, exams, timetable, calendar, graduation, research.
2. Institutional services: contacts, study centres, ID/matriculation, exam requirements, materials, certificates, gowns, procedures, complaints and human escalation.
3. Student life: activities, events, clubs, internships, SIWES, jobs, scholarships, grants, competitions and training.
4. Peer economy: student businesses, service providers, service requests, matching, reputation, disputes and referrals.
5. Commerce: catalogues, products, services, offers, requests, orders, listings, inventory and marketplace surfaces.
6. Trading: listings, quotes, bids, asks, matches, trades and settlement references without embedding payment execution.
7. Economic access: loans, grants, device funding, BNPL discovery, insurance and financial education with source verification and no approval claims.
8. ABBA intelligence: source monitoring, evidence, freshness, conflict detection, personalized insights, recommendations, matching, alerts and campaigns.
9. Communication: WhatsApp onboarding/support/alerts, email fallback where useful, human escalation and campaign controls.

## Capability authority

ABBA may read, analyze, classify, organize, monitor, recommend and report. Consequential actions such as publishing, deleting, submitting institutional actions, moving money, approving credit or executing trades require explicit authorized flows outside autonomous intelligence.

## Data flow

Source -> collector -> normalization -> fingerprint -> authority/freshness -> evidence -> claim -> conflict review -> retrieval -> ABBA -> WhatsApp/portal/campaign.

Request -> intent -> constraints -> candidate retrieval -> eligibility -> safety -> ranking -> user choice -> external contact/order/payment flow.

## Scaling

Use shared primitives, tenant partitions, indexed foreign keys, event-driven workers, idempotency keys, bounded outbound queues, source freshness schedules, hybrid retrieval, caching of public reference data and audit/event retention policies. Avoid per-product duplicate schemas.

## Security

Server-side Supabase service role only; browser receives aggregate/non-sensitive data; RLS on domain tables; webhook authentication; idempotency; rate limits; consent withdrawal; audit events; secret rotation; least privilege; human escalation.

## Success criteria

The NOUN application can consume Core primitives for products/services/offers/requests/orders/marketplace/trading references; academic and institutional records remain NOUN-specific; ABBA answers can cite internal evidence; WhatsApp and Vercel share the same domain services; and I/O can integrate later through explicit contracts without importing its financial execution model into NOUN.
