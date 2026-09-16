const { buildStudentContext } = require('./student-context');

function sortTimeline(activity = []) {
  return [...activity]
    .filter(Boolean)
    .sort((a, b) => new Date(b.created_at || b.occurred_at || 0) - new Date(a.created_at || a.occurred_at || 0))
    .slice(0, 50)
    .map((event) => ({
      event_type: event.event_type || event.event_name || 'unknown',
      course_code: event.course_code || null,
      topic: event.topic || null,
      occurred_at: event.occurred_at || event.created_at || null,
      metadata: event.metadata || {}
    }));
}

function buildNounStudentContext({ student = {}, programmes = [], activity = [], preferences = {}, goals = [], needs = [], risks = [] } = {}) {
  const base = buildStudentContext(student, programmes, activity, preferences);
  return {
    ...base,
    identity: {
      ...base.identity,
      learner_id: String(student.phone || student.id || '')
    },
    goals: [...new Set([...(base.oei?.goals || []), ...goals].filter(Boolean))],
    needs: [...new Set(needs.filter(Boolean))],
    risks: [...new Set(risks.filter(Boolean))],
    consent: {
      reminder_opt_in: base.preferences.reminder_opt_in,
      campaign_opt_in: base.preferences.campaign_opt_in,
      insight_opt_in: base.preferences.insight_opt_in,
      marketplace_public: base.visibility.marketplace_public
    },
    timeline: sortTimeline(activity),
    context_version: '1.0',
    context_policy: 'verified-context-only'
  };
}

module.exports = { buildNounStudentContext, sortTimeline };
