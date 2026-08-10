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
  return { level: data.level, courses: cleanCourses(data.courses), stage: data.stage, created_at: data.created_at, updated_at: data.updated_at };
}

async function saveStudent(phone, { level = null, courses = [], stage = 'ask_level' }) {
  const { error } = await supabase.from('students').upsert({
    phone, level, courses: cleanCourses(courses), stage,
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

module.exports = { getStudent, saveStudent, getChecklist, saveChecklistStep, addDeadline, getAllDeadlines, markDeadlineReminded, getStudentsMatching };
