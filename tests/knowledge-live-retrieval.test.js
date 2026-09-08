const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('knowledge module exposes live retrieval fallback', () => {
  const source = fs.readFileSync('lib/knowledge.js', 'utf8');
  assert.match(source, /fetchLiveSources/);
  assert.match(source, /live_facts/);
});
