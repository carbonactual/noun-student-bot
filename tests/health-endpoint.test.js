const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('production health endpoint exposes the ABBA Being Agent identity contract', () => {
  const source = fs.readFileSync('api/health.js', 'utf8');
  assert.match(source, /ABBA Being Agent/);
  assert.match(source, /status.*ok|ok.*status/);
  assert.match(source, /application\/json/);
});
