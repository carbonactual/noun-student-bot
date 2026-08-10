/** Supabase data layer for the NOUN Student Bot. */
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function fail(operation, error) { if (error) { console.error(`${operation} error:`, error.message); return true; } return false; }
function cleanCourses(courses) { return [...new Set((courses || []).map((c) => String(c).trim().toUpperCase()).filter(Boolean))]; }

async function getStudent(phone) {
  const { data, error } = await supabase.from('students').select('*').eq('phone', phone).maybeSingle();
  if (fail('getStudent', error) || !data) return null;
  return { ...data, courses: cleanCourses(data.courses) };
}

async function saveStudent(phone, { level = null, courses = [], stage = 'ask_level', ...extra }) {
  const { error } = await supabase.from('students').upsert({
    phone, level, courses: cleanCourses(courses), stage,
    ...extra,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'phone' });
  fail('saveStudent', error);
}

async function getChecklist(phone, course) {
  const { data, error } = await supabase.from('exam_checklists').select('*').eq('phone', phone).eq('course', course).maybeSingle();
  if (fail('getChecklist', error)) return {};
  return data || {};
}

async function saveChecklistStep(phone, course, stepKey) {
  const existing = await getChecklist(phone, course);
  const updated = { ...existing, phone, course, [stepKey]: true, updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from('exam_checklists').upsert(updated, { onConflict: 'phone,course' }).select('*').single();
  if (fail('saveChecklistStep', error)) return updated;
  return data || updated;
}

async function addDeadline({ level, course, title, dueDate }) {
  const { error } = await supabase.from('deadlines').insert({ level, course, title, due_date: dueDate, reminded_at: [] });
  fail('addDeadline', error);
}

async function getAllDeadlines() {
  const { data, error } = await supabase.from('deadlines').select('*').order('due_date', { ascending: true });
  if (fail('getAllDeadlines', error)) return [];
  return data || [];
}

async function markDeadlineReminded(id, remindedAt) {
  const { error } = await supabase.from('deadlines').update({ reminded_at: remindedAt }).eq('id', id);
  fail('markDeadlineReminded', error);
}

async function getStudentsMatching(level, course) {
  const { data, error } = await supabase.from('students').select('phone').eq('level', level).contains('courses', [course]);
  if (fail('getStudentsMatching', error)) return [];
  return [...new Set((data || []).map((s) => s.phone).filter(Boolean))];
}

/** Read-only retrieval. This never writes to academic state. */
async function getCourseContent(courseCodes, query, limit = 4) {
  const courses = cleanCourses(courseCodes);
  if (!courses.length) return [];
  const { data, error } = await supabase.from('course_content').select('id,course_code,module_title,content').in('course_code', courses);
  if (fail('getCourseContent', error) || !data?.length) return [];
  const words = String(query || '').toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  return data.map((chunk) => {
    const haystack = `${chunk.module_title || ''} ${chunk.content || ''}`.toLowerCase();
    const score = words.reduce((n, word) => n + (haystack.includes(word) ? 1 : 0), 0);
    return { ...chunk, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Best-effort durable idempotency. Missing table is non-fatal during rollout. */
async function claimEvent(eventId, channel = 'whatsapp') {
  if (!eventId) return true;
  const { error } = await supabase.from('integration_events').insert({ event_id: eventId, channel, received_at: new Date().toISOString() });
  if (!error) return true;
  if (String(error.code) === '23505') return false;
  console.error('claimEvent error:', error.message);
  return true;
}

module.exports = {
  getStudent, saveStudent, getChecklist, saveChecklistStep, addDeadline,
  getAllDeadlines, markDeadlineReminded, getStudentsMatching,
  getCourseContent, claimEvent,
};
