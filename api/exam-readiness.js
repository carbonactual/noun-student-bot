const { db, tenantId } = require('../lib/knowledge');
const { buildStudentIntelligence } = require('../lib/student-intelligence');
const { buildExamReadiness } = require('../lib/exam-readiness');
const SECRET = process.env.WEBHOOK_SECRET;
const cleanPhone = v => String(v || '').replace(/\D/g, '');
async function rows(table, tid, phone) {
  let q = db.from(table).select('*').eq('tenant_id', tid).limit(500);
  if (phone && table === 'student_practice_attempts') q = q.eq('student_phone', phone);
  const { data, error } = await q;
  if (error) return [];
  return data || [];
}
module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error:'GET only' });
  if (SECRET && req.headers['x-webhook-secret'] !== SECRET) return res.status(401).json({ error:'Unauthorized' });
  try {
    const phone = cleanPhone(req.query?.phone);
    if (!phone) return res.status(400).json({ error:'phone required' });
    const tid = await tenantId();
    const intelligence = await buildStudentIntelligence(phone);
    const exams = await rows('exams', tid, phone);
    const practice = await rows('practice_attempts', tid, phone);
    const courses = intelligence.course_workspace.map(x => x.course_code).filter(Boolean);
    const readiness = buildExamReadiness({ courses, exams, practice });
    return res.status(200).json({ ok:true, readiness, source_state: { courses: courses.length, exams: exams.length, practice_attempts: practice.length } });
  } catch (e) {
    console.error('exam-readiness:', e);
    return res.status(503).json({ ok:false, error:'Exam readiness unavailable' });
  }
};
