const assert = require('node:assert/strict');
const test = require('node:test');
const { buildTodayPlan, classifyAlert, shouldNotify, normalizeMode } = require('../lib/learning-continuity');

test('today plan prioritizes the nearest verified deadline and course gaps', () => {
  const plan = buildTodayPlan({
    deadlines: [
      { title: 'ACC301 TMA', course_code: 'ACC301', due_date: '2026-09-12' },
      { title: 'ECO305 TMA', course_code: 'ECO305', due_date: '2026-09-20' }
    ],
    course_momentum: [
      { course_code: 'ACC301', label: 'Needs attention', activity_count: 0 },
      { course_code: 'ECO305', label: 'In progress', activity_count: 3 }
    ],
    now: '2026-09-10T12:00:00.000Z'
  });
  assert.equal(plan[0].course_code, 'ACC301');
  assert.equal(plan[0].type, 'deadline');
  assert.ok(plan.some(x => x.type === 'course' && x.course_code === 'ACC301'));
});

test('alert classification maps urgency to a stable product priority', () => {
  assert.equal(classifyAlert({ daysAway: 0 }), 'CRITICAL');
  assert.equal(classifyAlert({ daysAway: 2 }), 'URGENT');
  assert.equal(classifyAlert({ daysAway: 6 }), 'IMPORTANT');
  assert.equal(classifyAlert({ daysAway: 14 }), 'REMINDER');
  assert.equal(classifyAlert({ daysAway: 30 }), 'INFORMATION');
});

test('notification deduplication blocks an already acknowledged or sent alert', () => {
  assert.equal(shouldNotify({ status: 'sent', notificationKey: 'exam:ACC301:2026-09-12', existingKeys: ['exam:ACC301:2026-09-12'] }), false);
  assert.equal(shouldNotify({ status: 'pending', notificationKey: 'exam:ACC301:2026-09-12', existingKeys: [] }), true);
});

test('study mode normalization rejects arbitrary modes', () => {
  assert.equal(normalizeMode('quiz'), 'practice');
  assert.equal(normalizeMode('teach me'), 'tutorial');
  assert.equal(normalizeMode('unknown'), 'tutor');
});

test('today plan is deterministic for identical inputs', () => {
  const input = { deadlines: [{ title: 'LAW302 exam', course_code: 'LAW302', due_date: '2026-09-15' }], course_momentum: [], now: '2026-09-10T00:00:00.000Z' };
  assert.deepEqual(buildTodayPlan(input), buildTodayPlan(input));
});
