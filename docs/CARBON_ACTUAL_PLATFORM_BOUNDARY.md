# Carbon Actual Platform Boundary

## Purpose

The NOUN deployment is the first institutional tenant of a reusable Carbon Actual platform. It is not a one-off bot and is not the Carbon Actual platform itself.

## Ownership model

### Carbon Actual core

Carbon Actual owns and operates the reusable platform capabilities:

- ABBA master intelligence and orchestration
- tenant/runtime architecture
- agent framework
- intelligence, recommendation and insight engines
- source-monitoring framework
- communication/campaign framework
- opportunity and marketplace engines
- provider network infrastructure
- security, governance and audit framework
- observability and platform analytics
- billing and commercial infrastructure
- integration/adaptor framework
- Carbon Actual control plane

These capabilities are licensed or delivered as services to institutional tenants rather than transferred as institutional property by default.

### Institutional tenant

An institution controls its institutional domain information and authorized operations, including:

- students and institutional records
- faculties, departments and programmes
- course catalogue
- policies and official rules
- academic calendar and examination information
- official announcements
- verified institutional contacts
- authorized administrators
- institutional workflows and branding

The platform processes this information under an appropriate contractual/data-governance arrangement.

### Student

Student personal data, preferences, communications and consent are subject to applicable law, institutional obligations and platform terms. Student-specific data must not be repurposed for unrelated commercial intelligence without an appropriate lawful basis/consent.

## Tenant model

All future institutional deployments should be tenant-aware from the beginning:

`Carbon Actual Platform -> Tenant -> Domain Node -> Student Experience`

NOUN is the first tenant. Future institutions must not share institutional data accidentally.

## Deployment models

1. **Managed SaaS:** Carbon Actual operates the platform and NOUN consumes the service.
2. **Dedicated/private deployment:** Carbon Actual provides a dedicated environment with stronger institutional isolation.
3. **Enterprise/licensed handoff:** institutional operational control can be expanded under a negotiated agreement. Carbon Actual core IP remains separately licensed unless explicitly transferred by contract.

## Vercel portal boundary

The Vercel application is both the serverless backend and viewing/operations portal. It is not a second system of record. Supabase remains the tenant data system of record. The Carbon Actual control plane and institutional command center are separate permissioned views over the same platform architecture.

## ABBA boundary

ABBA is the Carbon Actual master AI. A tenant receives a bounded domain intelligence node (for example, NOUN Intelligence) operating with tenant-specific knowledge, policies and permissions. A domain node must not be treated as an unrestricted copy of ABBA or as an independent authority.

## Human layer

The platform must support verified human contacts, institutional support queues and escalation. ABBA may route a student to a human but must not fabricate contact information or silently impersonate an institution.

## Commercial layer

Student services, opportunities, providers, campaigns and marketplace functionality remain Carbon Actual platform capabilities, subject to institutional rules, student consent and applicable law. Institutional endorsement must never be inferred from platform availability alone.

## Design rule

Build reusable capabilities once in Carbon Actual Core; configure institutional knowledge and workflows in the tenant. Do not fork the core for each institution unless a deliberate enterprise boundary requires it.
