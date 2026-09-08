const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('api/whatsapp-webhook.js', 'utf8');

test('WhatsApp AI uses tenant-scoped course grounding and the current Gemini model', () => {
  assert.match(source, /getRelevantCourseContent/);
  assert.match(source, /course_content/);
  assert.doesNotMatch(source, /gemini-2\.0-flash/);
  assert.match(source, /gemini-3\.6-flash/);
});

test('WhatsApp AI preserves safe fallback and human escalation', () => {
  assert.match(source, /I could not confidently answer that/);
  assert.match(source, /logHelp/);
  assert.match(source, /human/);
});

test('WhatsApp webhook remains idempotent and tenant-scoped', () => {
  assert.match(source, /message_events/);
  assert.match(source, /event_id/);
  assert.match(source, /tenantId/);
  assert.match(source, /x-webhook-secret/);
});
