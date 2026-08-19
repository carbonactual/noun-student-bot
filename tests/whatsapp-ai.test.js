const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('WhatsApp AI uses canonical NOUN grounding and the current Gemini model', () => {
  const source = fs.readFileSync('api/whatsapp-webhook.js', 'utf8');
  assert.match(source, /searchKnowledge/);
  assert.match(source, /buildStudentGrounding/);
  assert.doesNotMatch(source, /gemini-2\.0-flash/);
  assert.match(source, /gemini-3\.6-flash/);
});

test('WhatsApp AI records study answer/fallback outcomes', () => {
  const source = fs.readFileSync('api/whatsapp-webhook.js', 'utf8');
  assert.match(source, /study_answered/);
  assert.match(source, /study_fallback/);
});
