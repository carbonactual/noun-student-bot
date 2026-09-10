const MODES = new Set(['tutor', 'tutorial', 'practice', 'revision']);

function normalizeMode(value) {
  const mode = String(value || '').trim().toLowerCase();
  if (mode === 'quiz' || mode === 'test') return 'practice';
  if (mode === 'teach' || mode === 'teach me') return 'tutorial';
  return MODES.has(mode) ? mode : 'tutor';
}

function daysAway(value, now = Date.now()) {
  const date = new Date(value).getTime();
  if (!Number.isFinite(date)) return null;
  return Math.ceil((date - new Date(now).getTime()) / 86400000);
}

function classifyAlert({ daysAway: days, kind = 'deadline' } = {}) {
  if (kind === 'critical') return 'CRITICAL';
  if (days == null) return 'INFORMATION';
  if (days <= 0) return 'CRITICAL';
  if (days <= 2) return 'URGENT';
  if (days <= 7) return 'IMPORTANT';
  if (days <= 21) return 'REMINDER';
  return 'INFORMATION';
}

function shouldNotify({ status = 'pending', notificationKey, existingKeys = [] } = {}) {
  const blocked = new Set(['sent', 'acknowledged', 'cancelled', 'failed_permanently']);
  if (blocked.has(String(status).toLowerCase())) return false;
  return Boolean(notificationKey) && !new Set(existingKeys).has(notificationKey);
}

function buildTodayPlan({ deadlines = [], course_momentum = [], now = new Date().toISOString() } = {}) {
  const items = deadlines.map(row => ({
    ...row,
    type: 'deadline',
    days_away: daysAway(row.due_date || row.event_date || row.start_at, now),
    priority_score: priorityFor(daysAway(row.due_date || row.event_date || row.start_at))
  }));
  for (const course of course_momentum) {
    if (course.label !== 'Needs attention') continue;
    items.push({
      type: 'course',
      course_code: course.course_code,
      title: `Study ${course.course_code}`,
      description: course.last_topic ? `Continue with ${course.last_topic}.` : 'Start a focused study session.',
      priority_score: 45
    });
  }
  return items.sort((a, b) => b.priority_score - a.priority_score).slice(0, 5);
}

function priorityFor(days) {
  if (days == null) return 10;
  if (days <= 0) return 120;
  if (days <= 2) return 100;
  if (days <= 7) return 80;
  if (days <= 21) return 60;
  return 30;
}

module.exports = { normalizeMode, daysAway, classifyAlert, shouldNotify, buildTodayPlan };
