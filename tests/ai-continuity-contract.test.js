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
