# NOUN ABBA Backend Orchestration

## Principle

NOUN's Vercel/WhatsApp layer is a thin interaction surface. It accepts a student intent, forwards it to backend orchestration, and renders the result. It does not contain general intelligence, domain orchestration, policy routing or execution logic.

**ABBA is the intelligence layer.**

NOUN provides the institutional context, verified evidence, capabilities and boundaries that ABBA reasons over.

## Runtime flow

```text
Student
  ↓
WhatsApp / Vercel
  ↓
/api/abba or /api/ai-study
  ↓
NOUN orchestrator
  ├─ identity normalization
  ├─ intent detection
  ├─ capability resolution
  ├─ student context
  ├─ evidence retrieval
  ├─ boundary checks
  └─ event recording
  ↓
ABBA runtime
  ↓
Normalized result
  ↓
Vercel / WhatsApp
```

## Environment contract

- `ABBA_RUNTIME_URL` — server-side URL of the canonical ABBA runtime.
- `ABBA_RUNTIME_KEY` — server-side credential used to authenticate requests to ABBA.
- `ABBA_TIMEOUT_MS` — optional request timeout; defaults to 15000ms.
- `WEBHOOK_SECRET` — existing NOUN transport authentication secret.

No ABBA credential belongs in browser code.

## Capability model

The capability registry is the backend routing vocabulary. Current NOUN capabilities include learning, research, institutional forms/requests, services, opportunities, skills, marketplace, finance discovery, governance, representation and human escalation.

Capabilities describe what NOUN can expose. They do not replace ABBA's reasoning capability.

## Failure behavior

The ABBA adapter fails closed when `ABBA_RUNTIME_URL` is not configured or the runtime cannot return a valid result. NOUN does not silently instantiate a separate production intelligence path in a Vercel handler.

The request can still be recorded as an unavailable orchestration event so that continuity is preserved.

## Boundaries

NOUN does not autonomously:

- take examinations or perform graded work;
- impersonate students;
- bypass institutional verification;
- submit consequential requests without explicit authority;
- approve or originate credit;
- move money, operate wallets or settle transactions;
- execute investments;
- enable gambling or betting.

These constraints are evaluated before ABBA is allowed to reason toward an execution path.
