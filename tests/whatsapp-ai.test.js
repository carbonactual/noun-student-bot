const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('api/whatsapp-webhook.js', 'utf8');

test('WhatsApp study requests use the canonical ABBA orchestration path', () => {
  assert.match(source, /orchestrateNounRequest/);
  assert.match(source, /channel:'whatsapp'/);
  assert.match(source, /requestedCapability:mode==='practice'\?'learning\.practice':'learning\.study'/);
  assert.doesNotMatch(source, /generativelanguage.googleapis.com/);
  assert.doesNotMatch(source, /gemini-2\.0-flash/);
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

test('WhatsApp onboarding accepts undergraduate and postgraduate study stages', () => {
  assert.match(source, /certificate/);
  assert.match(source, /undergraduate/);
  assert.match(source, /pgd/);
  assert.match(source, /masters/);
  assert.match(source, /phd/);
  assert.match(source, /\[1-8\]00/);
});
