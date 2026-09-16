function clean(value, max = 2000) {
  return String(value ?? '').trim().slice(0, max);
}

function createEvent(input = {}) {
  const now = new Date().toISOString();
  const eventId = clean(input.eventId, 120) || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    event_id: eventId,
    event_name: clean(input.eventName, 160) || 'noun.unknown',
    occurred_at: input.occurredAt || now,
    observed_at: input.observedAt || now,
    actor: clean(input.actor, 160) || 'noun-bot',
    principal: clean(input.principal, 160) || null,
    subject: clean(input.subject, 240) || null,
    source: clean(input.source, 160) || 'noun-bot',
    jurisdiction: clean(input.jurisdiction, 160) || 'NG',
    correlation_id: clean(input.correlationId, 160) || eventId,
    causation_id: clean(input.causationId, 160) || null,
    parent_event_id: clean(input.parentEventId, 160) || null,
    schema_version: '1.0',
    policy_version: clean(input.policyVersion, 80) || 'noun-1.0',
    trace_id: clean(input.traceId, 160) || null,
    evidence_ref: clean(input.evidenceRef, 240) || null,
    payload: input.payload && typeof input.payload === 'object' ? input.payload : {}
  };
}

function replayKey(event) {
  return `${clean(event?.correlation_id, 160)}:${clean(event?.event_id, 160)}`;
}

function classifyOutcome({ status, externalAcknowledged = false, verified = false } = {}) {
  if (status === 'blocked' || status === 'rejected') return 'blocked';
  if (status === 'failed' || (status === 'completed' && !verified && externalAcknowledged)) return 'failed';
  if (status === 'completed' || status === 'complete') return verified || !externalAcknowledged ? 'success' : 'pending-verification';
  return 'pending';
}

module.exports = { createEvent, replayKey, classifyOutcome };
