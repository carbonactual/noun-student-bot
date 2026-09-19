# NOUN BOT UI/UX benchmark — 19 September 2026

This release treats the public homepage as a product introduction, not a catalogue of every capability.

## Benchmark observations

- Current AI landing-page benchmarks emphasize concrete product output in the first viewport, visible workflow proof, trust signals, and a low-friction entry point rather than abstract AI claims.
- Contemporary product design guidance repeatedly favors hierarchy and pruning: not every interface element should carry equal visual weight.
- Modern motion guidance uses animation to establish order, confirm interaction, and explain change; reduced-motion preferences must be respected.
- Current SaaS onboarding guidance favors progressive disclosure and a fast path to first value rather than exposing every setup field at once.
- Current Vercel deployment practice separates preview/QA from production and supports deployment checks before promotion.

## Applied to NOUN BOT

1. The landing page now has one primary story: understand the product quickly, see it working, then enter the student space.
2. Product imagery is part of the narrative: the hero and supporting cards use existing audited NOUN BOT creative assets locally from `/assets/promo/`.
3. The previous overlapping feature/journey/evidence layers have been collapsed into a smaller set of visual sections.
4. ABBA is presented as the intelligence underneath the journey, not as another competing feature category.
5. Account creation uses progressive disclosure: account basics first, NOUN identity details second.
6. Password recovery is subordinate to sign-in instead of competing with account creation as a third primary mode.
7. Motion is purposeful and has a reduced-motion path.
8. The backend/auth contract is preserved; this release changes the experience layer rather than introducing a second identity or account system.

## References

- Web Anatomy, Best AI Website Examples, updated September 2026: https://www.webanatomy.ai/best-landing-pages/ai
- Studio Maydit, Best AI Startup Websites in 2026: https://studiomaydit.com/blog/best-ai-startup-websites-2026
- Linear, A calmer interface for a product in motion: https://linear.app/now/behind-the-latest-design-refresh
- Framer, Bringing websites to life with animation: https://www.framer.com/academy/lessons/bringing-websites-to-life-with-animation
- Framer, Reduced motion settings: https://www.framer.com/help/articles/reduced-motion-settings/
- Vercel, Preview Deployments: https://vercel.com/academy/svelte-on-vercel/preview-deployments
- NOUN, Policy on Format for Presentation of Information on NOUN Website: https://dqa.nou.edu.ng/wp-content/uploads/2025/01/Edited_Policy-on-Format-for-Presentation-of-Information-on-NOUN-Website.pdf

This is a design benchmark, not a claim that NOUN BOT should imitate any one reference site.
