const { buildStudentIntelligence } = require('../lib/student-intelligence');
const { buildTodayPlan } = require('../lib/learning-continuity');
const SECRET = process.env.WEBHOOK_SECRET;

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  if (SECRET && req.headers['x-webhook-secret'] !== SECRET) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const phone = String(req.query?.phone || '').replace(/\D/g, '');
    if (!phone) return res.status(400).json({ error: 'phone required' });
    const intelligence = await buildStudentIntelligence(phone);
    const plan = buildTodayPlan({ deadlines: intelligence.deadlines, course_momentum: intelligence.course_momentum });
    return res.status(200).json({
      ok: true,
      title: 'What matters now',
      student: intelligence.student,
      plan,
      priorities: intelligence.priorities,
      deadlines: intelligence.deadlines,
      events: intelligence.events,
      course_momentum: intelligence.course_momentum,
      support: intelligence.support_recommendations,
      updated_at: intelligence.updated_at
    });
  } catch (e) {
    console.error('student-today:', e);
    return res.status(503).json({ ok: false, error: 'Student command centre unavailable' });
  }
};
