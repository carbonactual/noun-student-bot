# Phase 2 — NOUN Domain + Financial Access Scope

## Purpose

Phase 2 expands the NOUN tenant into a comprehensive institutional intelligence graph while keeping Carbon Actual I/O financially isolated.

## Academic domain

The tenant model covers:

- faculties
- departments
- programmes
- qualifications
- levels/stages
- courses and modules
- programme/course relationships
- course offerings
- academic calendar
- examinations
- TMA/assessments
- timetables
- policies and regulations
- admission requirements
- progression/prerequisite information
- study centres
- official contacts
- academic announcements
- student support
- activities and events
- internships/SIWES and opportunities
- graduation/matriculation and student services
- verified providers for student needs

## Financial Access domain

Financial information is part of Phase 2 as an **access/discovery/intelligence layer**, not as a banking or lending implementation inside the NOUN bot.

ABBA may:

- identify a stated financial need
- explain financial products in plain language
- surface official programmes and verified providers
- compare disclosed eligibility/terms without making an approval decision
- route students/staff/business owners to providers
- surface grants, education finance, MSME support and institutional finance opportunities
- maintain consented financial-interest preferences
- produce aggregate, non-identifying demand insights where lawful

ABBA must not independently:

- approve or reject loans
- underwrite credit
- set interest rates
- make binding credit decisions
- hold customer deposits
- operate a lending pool
- move money
- act as a bank/payment provider
- solicit investments as an unregistered intermediary
- expose private financial information to other students

## Carbon Actual I/O boundary

The eventual execution layer remains separate:

`NOUN Intelligence -> Financial Opportunity/Access -> Carbon Actual I/O`

I/O owns/implements wallets, ledgers, settlement, payments, nano-banking and any P2P financial execution only when the required regulatory, partner and operational controls exist.

## Peer-to-peer nano-banking

P2P is modeled first as a future capability and matching concept, not activated money movement. The domain model may represent interest, eligibility, consent and verified counterparties, while financial execution remains outside the NOUN tenant application.

Any investment/crowdfunding function requires the appropriate Nigerian regulatory analysis and licensed/registered partners before activation. SEC rules govern investment crowdfunding and require registered intermediaries; CBN regulates payment systems and financial-service activities. See the regulatory register maintained with this project before enabling execution.

## User/business identity

A student can have multiple roles:

- student
- employee/staff
- entrepreneur/business owner
- freelancer
- service provider
- opportunity seeker

These roles are additive and must not overwrite the academic identity.

## Data minimization

Financial interest should be collected progressively and only when useful. Do not collect bank credentials, passwords, PINs or unnecessary sensitive financial data in the student bot.

## Campaign boundary

Insights can become campaigns only through the consent/approval pipeline. Educational or service insights must not be silently converted into financial promotion.
