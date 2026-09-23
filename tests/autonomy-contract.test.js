const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('autonomous health workflow covers push, scheduled probes and recovery issues', () => {
  const source = fs.readFileSync('.github/workflows/autonomous-health.yml', 'utf8');
  assert.match(source, /push:/);
  assert.match(source, /schedule:/);
  assert.match(source, /BASE_URL: https:\/\/noun\.vercel\.app/);
  assert.match(source, /HEALTH_BASE_URL: https:\/\/noun-student-bot-dashboard\.vercel\.app/);
  assert.match(source, /npm test/);
  assert.match(source, /issues: write/);
  assert.match(source, /gh issue create/);
});

test('intelligence automation no longer fails solely because optional secrets are absent', () => {
  const source = fs.readFileSync('.github/workflows/intelligence-monitor.yml', 'utf8');
  assert.match(source, /noun\.vercel\.app/);
  assert.match(source, /safely skipped/);
  assert.match(source, /--retry-all-errors/);
});
