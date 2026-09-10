const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeStudentContext, buildOnboardingState } = require('../lib/student-onboarding-context');

test('normalizes canonical NOUN student context without inventing fields', () => {
  const out = normalizeStudentContext({ full_name: 'Ada Student', programme_title: 'B.Sc. Computer Science', level: '300', faculty: 'Computing', department: 'Computer Science', semester: '2', session: '2025/2026', study_centre: 'Abuja' });
  assert.equal(out.full_name, 'Ada Student');
  assert.equal(out.programme_title, 'B.Sc. Computer Science');
  assert.equal(out.level, '300');
  assert.equal(out.study_centre, 'Abuja');
  assert.equal(out.exam_status, null);
});

test('marks incomplete onboarding explicitly', () => {
  const state = buildOnboardingState({ programme_title: 'B.Sc. Computer Science', level: '300' });
  assert.equal(state.complete, false);
  assert.deepEqual(state.missing, ['semester', 'session']);
});

test('accepts configured onboarding context as complete', () => {
  const state = buildOnboardingState({ programme_title: 'B.Sc. Computer Science', level: '300', semester: '2', session: '2025/2026' });
  assert.equal(state.complete, true);
  assert.deepEqual(state.missing, []);
});
