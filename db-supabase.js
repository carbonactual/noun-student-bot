/**
 * Supabase data layer for the NOUN Student Bot.
 * Replaces a local db.json file so the bot and the Vercel admin
 * dashboard read/write the same live data.
 *
 * SETUP: create a Supabase project at supabase.com, run supabase-schema.sql
 * in the SQL Editor, then set these two values (env vars recommended):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Use the SERVICE ROLE key here (not the anon key) since the bot needs
 * write access — the anon key (read-only via RLS) is what the dashboard uses.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getStudent(phone) {
  const { data, error } = await supabase.from('students').select('*').eq('phone', phone).maybeSingle();
  if (error) console.error('getStudent error:', error.message);
  if (!data) return null;
  return { level: data.level, courses: data.courses, stage: data.stage };
}

async function saveStudent(phone, { level, courses, stage }) {
  const { error } = await supabase.from('students').upsert({ phone, level, courses: courses || [], stage });
  if (error) console.error('saveStudent error:', error.message);
}

async function getChecklist(phone, course) {
  const { data, error } = await supabase
    .from('exam_checklists')
    .select('*')
    .eq('phone', phone)
    .eq('course', course)
    .maybeSingle();
  if (error) console.error('getChecklist error:', error.message);
  return data || {};
}

async function saveChecklistStep(phone, course, stepKey) {
  const existing = await getChecklist(phone, course);
  const updated = { ...existing, [stepKey]: true, phone, course, updated_at: new Date().toISOString() };
  const { error } = await supabase.from('exam_checklists').upsert(updated, { onConflict: 'phone,course' });
  if (error) console.error('saveChecklistStep error:', error.message);
  return updated;
}

async function addDeadline({ level, course, title, dueDate }) {
  const { error } = await supabase
    .from('deadlines')
    .insert({ level, course, title, due_date: dueDate, reminded_at: [] });
  if (error) console.error('addDeadline error:', error.message);
}

async function getAllDeadlines() {
  const { data, error } = await supabase.from('deadlines').select('*');
  if (error) console.error('getAllDeadlines error:', error.message);
  return data || [];
}

async function markDeadlineReminded(id, remindedAt) {
  const { error } = await supabase.from('deadlines').update({ reminded_at: remindedAt }).eq('id', id);
  if (error) console.error('markDeadlineReminded error:', error.message);
}

async function getStudentsMatching(level, course) {
  const { data, error } = await supabase.from('students').select('phone').eq('level', level).contains('courses', [course]);
  if (error) console.error('getStudentsMatching error:', error.message);
  return (data || []).map((s) => s.phone);
}

module.exports = {
  getStudent,
  saveStudent,
  getChecklist,
  saveChecklistStep,
  addDeadline,
  getAllDeadlines,
  markDeadlineReminded,
  getStudentsMatching,
};
