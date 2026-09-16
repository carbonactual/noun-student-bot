const ABBA_PROTOCOL_VERSION = '1.0';

function clean(value, max = 4000) {
  return String(value || '').trim().slice(0, max);
}

function normalizeChannel(value) {
  const channel = String(value || '').toLowerCase();
  return ['web', 'whatsapp', 'api'].includes(channel) ? channel : 'api';
}

function normalizeAbbaRequest(input = {}) {
  const phone = String(input.phone || '').replace(/\D/g, '');
  const utterance = clean(input.message || input.question);
  if (!utterance) throw new Error('message required');
  if (!phone) throw new Error('phone required');

  return {
    protocolVersion: ABBA_PROTOCOL_VERSION,
    requestId: clean(input.requestId, 100) || `noun-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    channel: normalizeChannel(input.channel),
    identity: { phone },
    utterance,
    course: clean(input.course, 100) || null,
    requestedCapability: clean(input.requestedCapability, 120) || null,
    context: input.context && typeof input.context === 'object' ? input.context : {},
    authorization: input.authorization && typeof input.authorization === 'object' ? input.authorization : {}
  };
}

function buildAbbaResult(result = {}) {
  return {
    protocolVersion: ABBA_PROTOCOL_VERSION,
    requestId: clean(result.requestId, 100),
    answer: clean(result.answer, 12000),
    capability: clean(result.capability, 120) || null,
    actions: Array.isArray(result.actions) ? result.actions : [],
    evidence: Array.isArray(result.evidence) ? result.evidence : [],
    followUp: result.followUp || null,
    boundaries: result.boundaries && typeof result.boundaries === 'object' ? result.boundaries : {},
    status: result.status || 'complete'
  };
}

module.exports = { ABBA_PROTOCOL_VERSION, normalizeAbbaRequest, buildAbbaResult };
