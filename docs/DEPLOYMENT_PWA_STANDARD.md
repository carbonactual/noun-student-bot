# Deployment PWA Standard

Every user-facing web deployment in the ecosystem should be treated as an installable app surface.

Required baseline:
- Web App Manifest with name, short name, start URL, scope, standalone display, theme/background and 192px/512px icons.
- Service worker with an explicit cache version, offline navigation fallback and no caching of API endpoints as authoritative state.
- Mobile viewport and safe-area support.
- Install affordance where the browser exposes an install prompt; iOS must remain usable through the browser's Add to Home Screen flow.
- Deep links must preserve the user's route and recoverable application state.
- Authentication/session state stays server-governed; the service worker never becomes the source of truth.
- Channel handoffs (including WhatsApp) carry the canonical session/request identity so a person can continue rather than restart.
- Deployments must remain usable without an app-store installation.

This standard applies to CIBN BOT, NOUN BOT and future user-facing ecosystem deployments.
