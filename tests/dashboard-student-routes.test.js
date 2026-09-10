const assert = require('node:assert/strict');
const fs = require('node:fs');

test('dashboard consolidates student context, exam readiness and support routes', () => {
  const source = fs.readFileSync('api/dashboard.js', 'utf8');
  assert.match(source, /normalizeStudentContext/);
  assert.match(source, /buildExamReadiness/);
  assert.match(source, /buildSupportCase/);
  assert.match(source, /student_support_cases/);
  assert.match(source, /req\.query\?\.route/);
});

test('student route consolidation removes the need for three extra Vercel functions', () => {
  const apiFiles = fs.readdirSync('api').filter(name => name.endsWith('.js'));
  assert.ok(apiFiles.length <= 12, `Vercel Hobby function budget exceeded: ${apiFiles.length}`);
});
