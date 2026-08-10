/**
 * Deterministic event boundary for WhatsApp/Zapier integrations.
 * This module owns transport normalization only; business state remains in the bot/db layer.
 */

const MAX_TEXT_LENGTH = 4000;

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeText(value) {
  return String(value || '').trim().slice(0, MAX_TEXT_LENGTH);
}

function createEvent(input = {}) {
  const phone = normalizePhone(input.from || input.sender || input.wa_id || input.phone);
  const text = normalizeText(input.text || input.body || input.message || input.message_text);
  if (!phone || !text) return { ok: false, error: 'INVALID_EVENT' };

  const eventId = String(input.event_id || input.message_id || `${phone}:${Date.now()}:${Buffer.from(text).toString('base64url').slice(0, 24)}`);
  return {
    ok: true,
    event: {
      id: eventId,
      source: String(input.source || 'whatsapp').toLowerCase(),
      phone,
      text,
      receivedAt: input.received_at || new Date().toISOString(),
      rawType: input.type || 'message',
    },
  };
}

function classify(text) {
  const value = String(text || '').trim().toLowerCase();
  if (!value) return 'empty';
  if (/^(help|menu)$/.test(value)) return 'menu';
  if (/^human$|^agent$|talk to (someone|a person)/.test(value)) return 'human';
  if (/^mycourses$/.test(value)) return 'student_courses';
  if (/^profile(?:\s|$)/.test(value)) return 'profile';
  if (/^examcheck(?:\s|$)/.test(value)) return 'exam_check';
  if (/^done\s+/.test(value)) return 'exam_check_update';
  if (/^email\s+/.test(value)) return 'email';
  if (/^admin\s+/.test(value)) return 'admin';
  return 'study_or_unknown';
}

module.exports = { createEvent, classify, normalizePhone, normalizeText };
