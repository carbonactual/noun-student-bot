const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('AI study route preserves live evidence, privacy boundaries and mode', () => {
  const source = fs.readFileSync('api/ai-study.js', 'utf8');
  assert.match(source, /result\.evidence/);
  assert.match(source, /sources: result\.evidence/);
  assert.doesNotMatch(source, /private NOUN portal/);
  assert.match(source, /mode/);
});
