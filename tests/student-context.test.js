const test = require('node:test');
const assert = require('node:assert/strict');
const { buildStudentContext } = require('../lib/student-context');

test('buildStudentContext preserves multiple programmes and derives a primary academic state', () => {
  const context = buildStudentContext(
    {
      phone: '2340000000000',
      full_name: 'Student',
      study_level: 'masters',
      academic_status: 'active',
      faculty: 'Science',
      department: 'Computing',
      courses: ['CIT701']
    },
    [
      { study_level: 'undergraduate', programme_title: 'BSc Computing', academic_status: 'graduated', is_primary: false },
      { study_level: 'masters', programme_title: 'MSc Computing', academic_status: 'active', is_primary: true }
    ],
    [{ event_type: 'skill_interest', metadata: { skill: 'data analysis' } }],
    { campaign_opt_in: true, reminder_opt_in: true }
  );

  assert.equal(context.academic.primary.study_level, 'masters');
  assert.equal(context.academic.programmes.length, 2);
  assert.equal(context.interests.skills[0], 'data analysis');
  assert.equal(context.visibility.marketplace_public, false);
});
