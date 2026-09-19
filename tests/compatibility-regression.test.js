const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('dashboard keeps legacy students-schema compatibility fallback', () => {
  const source = fs.readFileSync('api/dashboard.js', 'utf8');
  assert.match(source, /function isSchemaDrift/);
  assert.match(source, /schema cache/);
  assert.match(source, /delete legacyPayload\.study_level/);
  assert.match(source, /delete legacyPatch\.study_level/);
});

test('AI study normalizes confidence before numeric persistence', () => {
  const source = fs.readFileSync('api/ai-study.js', 'utf8');
  assert.match(source, /function normalizeNumericConfidence/);
  assert.match(source, /verified: 0\.95/);
  assert.match(source, /knowledge_confidence: normalizeNumericConfidence/);
});
