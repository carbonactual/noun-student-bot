const { db, tenantId } = require('../lib/knowledge');

async function dashboardQuery(label, query) {
  try {
    const result = await query;
    if (result && result.error) throw result.error;
    return result;
  } catch (error) {
    const details = {
      label,
      name: error && error.name,
      message: error && error.message,
      cause: error && error.cause ? String(error.cause.message || error.cause) : undefined,
      code: error && error.code
    };
    console.error('dashboard-query-failure', details);
    const wrapped = new Error(`dashboard query failed: ${label}`);
    wrapped.cause = error;
    wrapped.details = details;
    throw wrapped;
  }
}

module.exports = async function handler(req, res) {
  try {
    const tenant = await tenantId();
    const [{ count: students }, { count: active_students }, { count: checklists }, { count: open_help }, { count: upcoming_deadlines }, { count: study_questions }, { count: study_answered }, { count: study_fallback }, { count: human_help_requests }, levels, courses, deadlines, campaigns] = await Promise.all([
      dashboardQuery('students-count', db.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant)),
      dashboardQuery('active-students-count', db.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).eq('stage', 'active')),
      dashboardQuery('checklists-count', db.from('exam_checklists').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant)),
      dashboardQuery('open-help-count', db.from('help_requests').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).in('status', ['open', 'pending'])),
      dashboardQuery('deadlines-count', db.from('deadlines').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).gte('due_date', new Date().toISOString().slice(0, 10))),
      dashboardQuery('study-questions-count', db.from('student_activity').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).eq('event_type', 'study_question')),
      dashboardQuery('study-answered-count', db.from('student_activity').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).eq('event_type', 'study_answered')),
      dashboardQuery('study-fallback-count', db.from('student_activity').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).eq('event_type', 'study_fallback')),
      dashboardQuery('human-help-count', db.from('student_activity').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).eq('event_type', 'human_support_requested')),
      dashboardQuery('levels', db.from('students').select('level').eq('tenant_id', tenant).limit(5000)),
      dashboardQuery('courses', db.from('students').select('courses').eq('tenant_id', tenant).limit(5000)),
      dashboardQuery('deadlines', db.from('deadlines').select('level,course,title,due_date').eq('tenant_id', tenant).gte('due_date', new Date().toISOString().slice(0, 10)).order('due_date').limit(30)),
      dashboardQuery('campaigns', db.from('campaigns').select('name,status,created_at').eq('tenant_id', tenant).order('created_at', { ascending: false }).limit(30))
    ]);

    const by_level = {};
    for (const row of levels.data || []) if (row.level) by_level[row.level] = (by_level[row.level] || 0) + 1;
    const by_course = {};
    for (const row of courses.data || []) for (const course of row.courses || []) by_course[course] = (by_course[course] || 0) + 1;

    return res.status(200).json({
      stats: { students: students || 0, active_students: active_students || 0, upcoming_deadlines: upcoming_deadlines || 0, checklists: checklists || 0, open_help: open_help || 0 },
      intelligence: {
        study_questions: study_questions || 0,
        study_answered: study_answered || 0,
        study_fallback: study_fallback || 0,
        human_help_requests: human_help_requests || 0
      },
      by_level,
      by_course,
      deadlines: deadlines.data || [],
      campaigns: campaigns.data || [],
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('dashboard:', error.message);
    return res.status(503).json({ ok: false, error: 'Dashboard data source unavailable', debug: error && error.details ? error.details : undefined });
  }
};
