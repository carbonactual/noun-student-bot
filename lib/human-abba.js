// CIBN BOT — human ABBA handoff queue.
// Human contact is explicit. ABBA accepts the request, records the handoff,
// then returns a channel URL so the candidate can continue with a human.
// Never collect passwords, OTPs, PINs, card numbers or bank credentials.

const { randomUUID } = require('crypto');
const { db } = require('./knowledge');
const { ensureCibnSession, recordCibnEvent } = require('./cibn-continuity');

const CONTINUATION_URL = String(process.env.CIBN_CONTINUATION_URL || 'https://mcp-bot-eight.vercel.app/').replace(/\/$/, '');

const HUMAN_WHATSAPP = String(process.env.CIBN_HUMAN_WHATSAPP || '2347046481828').replace(/\D/g, '');

function clean(value, limit) {
  return String(value || '').trim().slice(0, limit);
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return '234' + digits.slice(1);
  return digits;
}

function handoffUrl({ requestId, sessionId, name, message, stage, area, course, service, continuationUrl }) {
  const lines = [
    'CIBN BOT human ABBA request',
    'Request: ' + requestId,
    'Session: ' + sessionId,
    name ? 'Name: ' + name : '',
    stage ? 'Stage: ' + stage : '',
    area ? 'Work area: ' + area : '',
    course ? 'Course/programme: ' + course : '',
    service ? 'Service: ' + service : '',
    '',
    message || 'Candidate requested human support.',
    '',
    'Resume in CIBN BOT: ' + continuationUrl
  ].filter(Boolean);
  return 'https://wa.me/' + HUMAN_WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n'));
}

async function queueHumanAbba(input = {}) {
  const requestId = 'cibn-human-' + randomUUID();
  const channel = clean(input.channel, 40) || 'web';
  const sessionId = await ensureCibnSession({
    sessionId: input.sessionId,
    channel,
    phone: input.phone,
    service: input.service
  });
  const name = clean(input.name, 140);
  const phone = normalizePhone(input.phone);
  const email = clean(input.email, 180);
  const message = clean(input.message, 3000);
  const stage = clean(input.stage, 100);
  const area = clean(input.area, 100);
  const course = clean(input.course, 120);

  if (!message) throw new Error('message required');

  const payload = {
    product: 'cibn_bot',
    route: 'service_request',
    status: 'queued',
    priority: clean(input.priority, 20) || 'normal',
    reason: clean(input.reason, 120) || 'user_requested_human',
    request_id: requestId,
    candidate: { name: name || null, phone: phone || null, email: email || null },
    context: { stage: stage || null, area: area || null, course: course || null, channel },
    session_id: sessionId,
    service: clean(input.service, 140) || null,
    message,
    destination: { channel: 'whatsapp', address: HUMAN_WHATSAPP },
    accepted_at: new Date().toISOString()
  };

  await recordCibnEvent({
    sessionId,
    eventType: 'cibn.service_request.accepted',
    channel,
    actorRef: 'abba',
    payload: {
      request_id: requestId,
      service: payload.service,
      reason: payload.reason,
      status: 'queued',
      message,
      channel,
      request: 'service'
    }
  });

  const { error } = await db.from('canonical_runtime_records').upsert({
    collection: 'cibn_service_requests',
    id: requestId,
    type: 'service_request',
    version: 1,
    payload,
    idempotency_key: requestId
  }, { onConflict: 'collection,id' });

  if (error) throw error;

  return {
    requestId,
    sessionId,
    status: 'queued',
    route: 'service_request',
    channel: 'whatsapp',
    resumeUrl: CONTINUATION_URL + '/?session=' + encodeURIComponent(sessionId),
    handoffUrl: handoffUrl({
      requestId,
      sessionId,
      name,
      message,
      stage,
      area,
      course,
      service: clean(input.service, 140),
      continuationUrl: CONTINUATION_URL + '/?session=' + encodeURIComponent(sessionId)
    })
  };
}

module.exports = { queueHumanAbba, normalizePhone };
