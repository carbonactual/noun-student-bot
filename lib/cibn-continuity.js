const crypto = require('crypto');
const { db } = require('./knowledge');

const SESSION_PREFIX = 'cibn-session-';
const MAX_CONTEXT_EVENTS = 16;

function clean(value, limit = 200) {
  return String(value || '').trim().slice(0, limit);
}

function safeSessionId(value) {
  const raw = clean(value, 120);
  return /^cibn-session-[a-f0-9-]{20,100}$/.test(raw) ? raw : null;
}

function newSessionId() {
  return SESSION_PREFIX + crypto.randomUUID();
}

function subjectRef(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? 'cibn:candidate:' + crypto.createHash('sha256').update(digits).digest('hex') : null;
}

async function ensureCibnSession({ sessionId = null, channel = 'web', phone = null, service = null } = {}) {
  const id = safeSessionId(sessionId) || newSessionId();
  const now = new Date().toISOString();
  const row = {
    id,
    version: '1',
    lifecycle: 'active',
    subject_ref: subjectRef(phone),
    operating_context_id: 'cibn',
    authority_ref: 'cibn_bot_abba',
    objective: { product: 'cibn_bot', service: clean(service, 140) || null },
    constraints: {
      channel_continuity: true,
      human_authority_preserved: true,
      financial_execution_in_app: false
    },
    memory_scope: { domain: 'cibn', retention: 'canonical_runtime' },
    provenance: { source: 'cibn_bot', channel: clean(channel, 40) || 'web' },
    updated_at: now
  };
  const { error } = await db.from('omnii_abba_sessions').upsert(row, { onConflict: 'id' });
  if (error) throw error;
  return id;
}

async function recordCibnEvent({
  sessionId,
  eventType,
  channel = 'web',
  actorRef = 'candidate',
  subjectRefValue = null,
  payload = {},
  causationId = null,
  source = 'cibn_bot'
} = {}) {
  const id = clean(sessionId, 120);
  if (!id) throw new Error('session_id required');
  const occurred = new Date().toISOString();
  const eventId = 'cibn-event-' + crypto.randomUUID();
  const canonicalPayload = {
    product: 'cibn_bot',
    session_id: id,
    channel: clean(channel, 40) || 'web',
    ...payload
  };
  const digest = crypto.createHash('sha256').update(JSON.stringify(canonicalPayload)).digest('hex');
  const { error } = await db.from('omnii_events').insert({
    id: eventId,
    version: '1',
    lifecycle: 'active',
    authority: { kind: 'ecosystem_runtime' },
    provenance: { source },
    payload: canonicalPayload,
    correlation_id: id,
    event_type: clean(eventType, 120),
    event_version: '1',
    schema_version: '1',
    occurred_at: occurred,
    recorded_at: occurred,
    actor_ref: clean(actorRef, 120) || null,
    subject_ref: subjectRefValue || null,
    causation_id: clean(causationId, 120) || null,
    reality_state: 'ACTUAL',
    source,
    evidence_refs: [],
    metadata: { channel: clean(channel, 40) || 'web' },
    status: 'accepted',
    event_hash: digest
  });
  if (error) throw error;
  return eventId;
}

async function getCibnContext(sessionId, limit = MAX_CONTEXT_EVENTS) {
  const id = safeSessionId(sessionId);
  if (!id) return [];
  const capped = Math.max(1, Math.min(Number(limit) || MAX_CONTEXT_EVENTS, MAX_CONTEXT_EVENTS));
  const { data, error } = await db.from('omnii_events')
    .select('id,event_type,occurred_at,actor_ref,payload,causation_id')
    .eq('correlation_id', id)
    .order('occurred_at', { ascending: false })
    .limit(capped);
  if (error) throw error;
  return (data || []).reverse();
}

function compactContext(events = []) {
  return events.map(event => ({
    event_type: event.event_type,
    occurred_at: event.occurred_at,
    actor: event.actor_ref,
    payload: {
      question: event.payload?.question || null,
      answer: event.payload?.answer || null,
      service: event.payload?.service || null,
      reason: event.payload?.reason || null,
      status: event.payload?.status || null,
      channel: event.payload?.channel || null,
      request_id: event.payload?.request_id || null
    }
  }));
}

module.exports = {
  safeSessionId,
  newSessionId,
  ensureCibnSession,
  recordCibnEvent,
  getCibnContext,
  compactContext,
  subjectRef
};
