const test = require('node:test');
const assert = require('node:assert/strict');
const { buildStudentContext, buildCourseWorkspace } = require('../lib/student-context');

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

test('buildCourseWorkspace joins enrolled course context to canonical course records', () => {
  const workspace = buildCourseWorkspace(
    [
      { course_code: 'CIT701', status: 'active', study_level: 'masters', semester: 2 },
      { course_code: 'GST801', status: 'completed', study_level: 'masters', semester: 1 }
    ],
    [
      { course_code: 'CIT701', title: 'Advanced Computing', credit_units: 3, verification_status: 'verified', source_url: 'https://example.test/cit701' },
      { course_code: 'GST801', title: 'Research Methods', credit_units: 2, verification_status: 'verified', source_url: 'https://example.test/gst801' }
    ]
  );
  assert.deepEqual(workspace, [{
    course_code: 'CIT701', title: 'Advanced Computing', credit_units: 3,
    study_level: 'masters', semester: 2, status: 'active',
    verification_status: 'verified', source_url: 'https://example.test/cit701'
  }]);
});

test('buildCourseWorkspace makes missing canonical course metadata explicit', () => {
  const workspace = buildCourseWorkspace([{ course_code: 'ABC999', status: 'active' }], []);
  assert.deepEqual(workspace[0], {
    course_code: 'ABC999', title: null, credit_units: null,
    study_level: null, semester: null, status: 'active',
    verification_status: null, source_url: null
  });
});
