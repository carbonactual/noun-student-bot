const test = require('node:test');
const assert = require('node:assert/strict');
const { buildExamReadiness } = require('../lib/exam-readiness');

test('builds course-by-course readiness from exam dates and practice', () => {
  const result = buildExamReadiness({
    now: '2026-09-10T12:00:00Z',
    courses: ['CIT301', 'GST303'],
    exams: [{ course_code: 'CIT301', starts_at: '2026-09-20T09:00:00Z' }, { course_code: 'GST303', starts_at: '2026-10-20T09:00:00Z' }],
    practice: [{ course_code: 'CIT301', score: 42 }, { course_code: 'CIT301', score: 68 }, { course_code: 'GST303', score: 81 }]
  });
  assert.equal(result.courses[0].course_code, 'CIT301');
  assert.equal(result.courses[0].days_to_exam, 10);
  assert.equal(result.courses[0].readiness, 'needs-attention');
  assert.equal(result.courses[1].readiness, 'on-track');
});

test('never fabricates a countdown when an exam date is absent', () => {
  const result = buildExamReadiness({ now: '2026-09-10T12:00:00Z', courses: ['GST303'], exams: [], practice: [] });
  assert.equal(result.courses[0].days_to_exam, null);
  assert.equal(result.courses[0].readiness, 'unknown');
});
