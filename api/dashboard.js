const { db, tenantId } = require('../lib/knowledge');
const { buildOnboardingState, normalizeStudentContext } = require('../lib/student-onboarding-context');
const { buildStudentIntelligence } = require('../lib/student-intelligence');
const { buildExamReadiness } = require('../lib/exam-readiness');
const { buildSupportCase } = require('../lib/support-escalation');

function clean(value, max = 500) { return String(value || '').trim().slice(0, max); }
function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return `234${digits.slice(1)}`;
  return digits;
}
const secretOk = req => !process.env.WEBHOOK_SECRET || req.headers['x-webhook-secret'] === process.env.WEBHOOK_SECRET;

async function onboard(req, res, tenant) {
  const body = req.body || {};
  const full_name = clean(body.full_name, 120), email = clean(body.email, 180).toLowerCase();
  const phone = normalizePhone(body.phone), study_level = clean(body.study_level, 40) || 'undergraduate';
  const programme_title = clean(body.programme_title, 180), level = clean(body.level, 80), help_need = clean(body.help_need, 800);
  if (!full_name || !email || !phone || !programme_title) return res.status(400).json({ error: 'full_name, email, phone, programme_title and study_level are required' });
  const now = new Date().toISOString();
  const payload = { tenant_id: tenant, phone, full_name, email, study_level, programme_title, level: level || null, updated_at: now, onboarding_source: 'web', whatsapp_opt_in: true, last_seen_at: now };
  const { data: existing, error: lookupError } = await db.from('students').select('phone').eq('tenant_id', tenant).eq('phone', phone).maybeSingle();
  if (lookupError) throw lookupError;
  const result = existing
    ? await db.from('students').update(payload).eq('tenant_id', tenant).eq('phone', phone).select('phone,full_name,email,study_level,programme_title,level').single()
    : await db.from('students').insert(payload).select('phone,full_name,email,study_level,programme_title,level').single();
  if (result.error) throw result.error;
  await db.from('student_activity').insert({ tenant_id: tenant, phone, event_type: 'web_onboarding', topic: help_need || 'joined NOUN BOT', metadata: { source: 'web', help_need } });
  return res.status(200).json({ ok: true, student: result.data, message: 'Your NOUN BOT profile is ready.' });
}

async function studentContext(req, res, tenant) {
  const phone = normalizePhone(req.query?.phone || req.body?.phone);
  if (!phone) return res.status(400).json({ error: 'phone required' });
  const { data: student, error } = await db.from('students').select('*').eq('tenant_id', tenant).eq('phone', phone).maybeSingle();
  if (error) throw error;
  if (!student) return res.status(404).json({ ok: false, error: 'Student profile not found' });
  if (req.method === 'POST') {
    const incoming = normalizeStudentContext(req.body || {}), patch = { ...incoming, updated_at: new Date().toISOString(), onboarding_source: 'noun-bot' };
    delete patch.full_name;
    const updated = await db.from('students').update(patch).eq('tenant_id', tenant).eq('phone', phone).select('*').single();
    if (updated.error) throw updated.error;
    const context = normalizeStudentContext(updated.data);
    return res.status(200).json({ ok: true, context, onboarding: buildOnboardingState(context) });
  }
  const context = normalizeStudentContext(student);
  return res.status(200).json({ ok: true, context, onboarding: buildOnboardingState(context) });
}

async function examReadiness(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  const phone = normalizePhone(req.query?.phone);
  if (!phone) return res.status(400).json({ error: 'phone required' });
  const tid = await tenantId();
  const intelligence = await buildStudentIntelligence(phone);
  const examResult = await db.from('exams').select('*').eq('tenant_id', tid).limit(500);
  const practiceResult = await db.from('practice_attempts').select('*').eq('tenant_id', tid).limit(500);
  if (examResult.error) throw examResult.error;
  if (practiceResult.error) throw practiceResult.error;
  const courses = intelligence.course_workspace.map(x => x.course_code).filter(Boolean);
  const readiness = buildExamReadiness({ courses, exams: examResult.data || [], practice: practiceResult.data || [] });
  return res.status(200).json({ ok: true, readiness, source_state: { courses: courses.length, exams: (examResult.data || []).length, practice_attempts: (practiceResult.data || []).length } });
}

async function supportCase(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const c = buildSupportCase(req.body || {});
  if (!c.student_phone || !c.description) return res.status(400).json({ error: 'phone and description required' });
  const tid = await tenantId();
  const result = await db.from('student_support_cases').insert({ tenant_id: tid, ...c }).select('id,student_phone,category,description,course_code,urgency,status,created_at').single();
  if (result.error) throw result.error;
  return res.status(201).json({ ok: true, case: result.data, message: 'Your request has been recorded for human follow-up.' });
}

module.exports = async function handler(req, res) {
  try {
    if (!secretOk(req)) return res.status(401).json({ error: 'Unauthorized' });
    const route = String(req.query?.route || '').toLowerCase();
    const tenant = await tenantId();
    if (route === 'student-context') return studentContext(req, res, tenant);
    if (route === 'exam-readiness') return examReadiness(req, res);
    if (route === 'support-case') return supportCase(req, res);
    if (req.method === 'POST') return onboard(req, res, tenant);
    if (req.method !== 'GET') return res.status(405).json({ error: 'GET or POST only' });
    const today = new Date().toISOString().slice(0, 10);
    const [{ count: students }, { count: active_students }, { count: checklists }, { count: open_help }, { count: upcoming_deadlines }, { count: study_questions }, { count: study_answered }, { count: study_fallback }, { count: human_help_requests }, levels, courses, deadlines, campaigns] = await Promise.all([
      db.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant), db.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).eq('stage', 'active'),
      db.from('exam_checklists').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant), db.from('help_requests').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).in('status', ['open', 'pending']),
      db.from('deadlines').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).gte('due_date', today), db.from('student_activity').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).eq('event_type', 'study_question'),
      db.from('student_activity').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).eq('event_type', 'study_answered'), db.from('student_activity').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).eq('event_type', 'study_fallback'),
      db.from('student_activity').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant).eq('event_type', 'human_support_requested'), db.from('students').select('level').eq('tenant_id', tenant).limit(5000),
      db.from('students').select('courses').eq('tenant_id', tenant).limit(5000), db.from('deadlines').select('level,course,title,due_date').eq('tenant_id', tenant).gte('due_date', today).order('due_date').limit(30), db.from('campaigns').select('name,status,created_at').eq('tenant_id', tenant).order('created_at', { ascending: false }).limit(30)
    ]);
    for (const result of [levels, courses, deadlines, campaigns]) if (result.error) throw result.error;
    const by_level = {}, by_course = {};
    for (const row of levels.data || []) if (row.level) by_level[row.level] = (by_level[row.level] || 0) + 1;
    for (const row of courses.data || []) for (const course of row.courses || []) by_course[course] = (by_course[course] || 0) + 1;
    return res.status(200).json({ stats: { students: students || 0, active_students: active_students || 0, upcoming_deadlines: upcoming_deadlines || 0, checklists: checklists || 0, open_help: open_help || 0 }, intelligence: { study_questions: study_questions || 0, study_answered: study_answered || 0, study_fallback: study_fallback || 0, human_help_requests: human_help_requests || 0 }, by_level, by_course, deadlines: deadlines.data || [], campaigns: campaigns.data || [], generated_at: new Date().toISOString() });
  } catch (error) {
    console.error('dashboard:', error.message);
    return res.status(503).json({ ok: false, error: 'Dashboard data source unavailable' });
  }
};
