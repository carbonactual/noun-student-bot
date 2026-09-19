const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const source = fs.readFileSync('api/ai-study.js', 'utf8');

test('AI study endpoint persists canonical learning continuity records', () => {
  assert.match(source, /student_study_questions/);
  assert.match(source, /student_learning_sessions/);
  assert.match(source, /answered_at/);
  assert.match(source, /question_count/);
});


test('CIBN chat keeps a multi-model fallback chain for provider throttling and aborts', () => {
  assert.match(source, /CIBN_GEMINI_LAST_FALLBACK_MODEL/);
  assert.match(source, /gemini-3\.6-flash/);
  assert.match(source, /error\.status === 429/);
  assert.match(source, /backoffMs/);
});
