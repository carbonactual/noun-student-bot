const { db, tenantId } = require('./knowledge');

function cleanPhone(value) { return String(value || '').replace(/\D/g, ''); }
function scoreMatch(query, value) {
  const q = new Set(String(query || '').toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 2));
  const t = String(value || '').toLowerCase();
  let score = 0; for (const word of q) if (t.includes(word)) score += 1;
  return score;
}
async function safeRows(table, builder) {
  try { const result = await builder(db.from(table).select('*')); return result.data || []; } catch { return []; }
}
async function getStudent(phone) {
  const tid = await tenantId();
  const normalized = cleanPhone(phone);
  if (!normalized) return null;
  const { data } = await db.from('students').select('*').eq('tenant_id', tid).eq('phone', normalized).maybeSingle();
  return data || null;
}
async function buildStudentIntelligence(phone, question = '') {
  const tid = await tenantId();
  const normalized = cleanPhone(phone);
  if (!normalized) throw new Error('phone required');
  const student = await getStudent(normalized);
  if (!student) return { student: null, personalized: false, priorities: [], events: [], practice: [], services: [], recent_activity: [] };

  const courses = Array.isArray(student.courses) ? student.courses : [];
  const [deadlines, events, activity, assessments, services] = await Promise.all([
    safeRows('deadlines', q => q.eq('tenant_id', tid).gte('due_date', new Date().toISOString().slice(0,10)).order('due_date').limit(40)),
    safeRows('academic_events', q => q.eq('tenant_id', tid).limit(80)),
    safeRows('student_activity', q => q.eq('tenant_id', tid).eq('phone', normalized).order('created_at', { ascending:false }).limit(30)),
    safeRows('past_questions', q => q.eq('tenant_id', tid).limit(100)),
    safeRows('student_services', q => q.eq('tenant_id', tid).limit(50))
  ]);
  const relevant = row => {
    const blob = JSON.stringify(row);
    return !courses.length || courses.some(c => blob.toLowerCase().includes(String(c).toLowerCase()));
  };
  const priorities = deadlines.filter(relevant).slice(0,8).map(x => ({ type:'deadline', ...x }));
  const relevantEvents = events.filter(relevant).filter(x => ['verified','supplementary','active','published'].includes(String(x.status || '').toLowerCase()) || !x.status).slice(0,12);
  const practice = assessments
    .map(x => ({ ...x, _score: scoreMatch(question, JSON.stringify(x)) + (courses.some(c => JSON.stringify(x).toLowerCase().includes(String(c).toLowerCase())) ? 2 : 0) }))
    .sort((a,b) => b._score-a._score).slice(0,10)
    .map(({_score, ...x}) => x);
  const matchedServices = services.filter(relevant).slice(0,15);

  return {
    personalized: true,
    student: {
      phone: normalized,
      full_name: student.full_name || null,
      study_level: student.study_level || student.level || null,
      programme_title: student.programme_title || null,
      level: student.level || null,
      faculty: student.faculty || null,
      department: student.department || null,
      courses
    },
    priorities,
    events: relevantEvents,
    practice,
    services: matchedServices,
    recent_activity: activity.map(x => ({ event_type:x.event_type, course_code:x.course_code, topic:x.topic, created_at:x.created_at, metadata:x.metadata }))
  };
}
module.exports = { buildStudentIntelligence, cleanPhone, getStudent };
