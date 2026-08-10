# Student Services & Activities Intelligence

The bot covers more than courses and examinations. It should help students discover verified school-related activities and practical services while separating official NOUN information from third-party offers.

## Categories
- Academic materials: textbooks, course packs and study supplies
- Matriculation: gowns/regalia and related logistics
- Graduation: gowns/regalia and related logistics
- Student identity: ID-card information and support
- Examination clearance: signatures, clearance and documented requirements
- Career: internships, SIWES and practical opportunities
- Activities: academic, career, association and student events
- Student services: lower-cost, verified practical services

## Trust rules
1. Official NOUN requirements are authoritative.
2. Third-party providers are never represented as NOUN providers unless an official source confirms it.
3. Prices are snapshots, not guarantees; price and availability must be verified before payment.
4. Student requests are logged without exposing private student data in public listings.
5. Providers and offers have verification states: pending, verified, rejected, expired.
6. Potentially sensitive or regulated transactions require human review.

## Intelligence loop
Source -> activity/service record -> verification -> relevance matching -> student discovery -> feedback -> aggregate insight -> optional campaign candidate.

## Campaign boundary
ABBA may identify that students need a service or activity. It must not automatically endorse, rank, or mass-promote a commercial provider without an explicit verification/approval gate.
