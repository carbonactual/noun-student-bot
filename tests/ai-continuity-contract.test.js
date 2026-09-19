const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');

const study = fs.readFileSync('api/ai-study.js', 'utf8');
const cibn = fs.readFileSync('lib/cibn-chat.js', 'utf8');

test('AI study endpoint persists canonical learning continuity records', () => {
  assert.match(study, /student_study_questions/);
  assert.match(study, /student_learning_sessions/);
  assert.match(study, /answered_at/);
  assert.match(study, /question_count/);
});

test('CIBN chat keeps its multi-model fallback chain for provider throttling and aborts', () => {
  assert.match(cibn, /CIBN_GEMINI_LAST_FALLBACK_MODEL/);
  assert.match(cibn, /gemini-3\.6-flash/);
  assert.match(cibn, /error\.status === 429/);
  assert.match(cibn, /backoffMs/);
});
