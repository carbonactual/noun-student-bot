const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('AI study route instructs model to use live evidence without claiming portal access', () => {
  const source = fs.readFileSync('api/ai-study.js', 'utf8');
  assert.match(source, /LIVE WEB EVIDENCE/);
  assert.match(source, /private NOUN portal/);
  assert.match(source, /mode/);
});
