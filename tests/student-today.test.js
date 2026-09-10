const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('api/student-today.js', 'utf8');

test('student today endpoint composes canonical intelligence into a next-action view', () => {
  assert.match(source, /buildStudentIntelligence/);
  assert.match(source, /buildTodayPlan/);
  assert.match(source, /What matters now/);
});
