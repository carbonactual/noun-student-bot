const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('the consolidated health route preserves the ABBA Being Agent contract', () => {
  const source = fs.readFileSync('api/dashboard.js', 'utf8');
  const routing = fs.readFileSync('vercel.json', 'utf8');
  assert.match(source, /health === '1'/);
  assert.match(source, /ABBA Being Agent/);
  assert.match(source, /status: 'ok'/);
  assert.match(source, /application\/json/);
  assert.match(routing, /\/api\/health/);
  assert.match(routing, /dashboard\?health=1/);
});
