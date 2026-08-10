const assert = require('node:assert/strict');
const test = require('node:test');
const { createEvent, classify } = require('../lib/event-router');

test('normalizes WhatsApp event fields', () => {
  const result = createEvent({ message_id: 'wamid-1', from: '+234 800 123 4567', text: '  What is polymorphism?  ' });
  assert.equal(result.ok, true);
  assert.equal(result.event.id, 'wamid-1');
  assert.equal(result.event.phone, '2348001234567');
  assert.equal(result.event.text, 'What is polymorphism?');
});

test('classifies deterministic commands before study fallback', () => {
  assert.equal(classify('menu'), 'menu');
  assert.equal(classify('examcheck CIT301'), 'exam_check');
  assert.equal(classify('done CIT301 1'), 'exam_check_update');
  assert.equal(classify('Explain inheritance'), 'study_or_unknown');
});
