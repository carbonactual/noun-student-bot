const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');

test('internal webhook/orchestration surfaces fail closed when secrets are absent', () => {
  const abba = fs.readFileSync('api/abba.js', 'utf8');
  const automation = fs.readFileSync('api/automation.js', 'utf8');
  const outbound = fs.readFileSync('api/outbound-ack.js', 'utf8');
  const past = fs.readFileSync('api/past-questions.js', 'utf8');

  assert.match(abba, /Boolean\(SECRET && req\.headers/);
  assert.match(automation, /!intelligenceAuthorized\(req\)/);
  assert.match(automation, /!SECRET \|\| req\.headers/);
  assert.match(outbound, /!process\.env\.WEBHOOK_SECRET/);
  assert.match(past, /Revision endpoint requires server authentication/);
});

test('private dashboard paths require authenticated account identity', () => {
  const dashboard = fs.readFileSync('api/dashboard.js', 'utf8');
  assert.match(dashboard, /async function authenticatedActor/);
  assert.match(dashboard, /Student account mismatch/);
  assert.match(dashboard, /Tenant administrator access required/);
  assert.match(dashboard, /That student profile already exists\. Sign in to continue\./);
});
