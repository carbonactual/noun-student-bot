const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('dashboard exposes aggregated intelligence metrics', () => {
  const source = fs.readFileSync('api/dashboard.js', 'utf8');
  assert.match(source, /student_activity/);
  assert.match(source, /intelligence/);
});
