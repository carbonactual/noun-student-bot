/**
 * Vercel serverless webhook for the NOUN Student Bot.
 *
 * How it fits together:
 *   WhatsApp -> Zapier ("New Inbound Message" trigger) -> POST here -> we return { reply }
 *   -> Zapier's next step ("Send Freeform Message" action) sends `reply` back to the student
 *
 * This replaces the always-on whatsapp-web.js server entirely — no laptop or VPS
 * needs to stay running. This function only runs when a message actually arrives.
 *
 * SETUP (in Vercel Project Settings -> Environment Variables):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (the secret key — this is a server-side function, safe to use here)
 *   ADMIN_NUMBERS               (comma-separated, e.g. "2348031234567,2347046481828")
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_NUMBERS = (process.env.ADMIN_NUMBERS || '').split(',').map((n) => n.trim()).filter(Boolean);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const EXAM_STEPS = [
  { key: 'stamp1', label: 'Stamp/sign-off #1 (e.g. HOD)' },
  { key: 'stamp2', label: 'Stamp/sign-off #2 (e.g. Exam Officer)' },
  { key: 'stamp3', label: 'Stamp/sign-off #3 (e.g. Bursary)' },
  { key: 'laminated', label: 'Laminated + all 4 sheets ready to bring' },
];

const MENU_TEXT = `📚 NOUN Student Bot — Menu

1️⃣ *mycourses* — see your registered level/courses
2️⃣ *examcheck [course]* — start/view your exam-hall checklist for a course
3️⃣ *done [course] [number]* — check off a checklist item
4️⃣ *help* — show this menu again

Deadline reminders and study-group matching happen automatically once you're registered.`;

function renderExamChecklist(course, checklist) {
  let out = `📋 Exam Hall Checklist — ${course}\n\n`;
  EXAM_STEPS.forEach((step, i) => {
    const done = checklist && checklist[step.key];
    out += `${done ? '✅' : '⬜'} ${i + 1}. ${step.label}\n`;
  });
  const doneCount = EXAM_STEPS.filter((s) => checklist && checklist[s.key]).length;
  out += `\n${doneCount}/${EXAM_STEPS.length} complete.`;
  if (doneCount < EXAM_STEPS.length) {
    out += `\n\nReply "done ${course} [number]" to check off an item, e.g. "done ${course} 1"`;
  } else {
    out += `\n\n🎉 You're fully ready for the exam hall!`;
  }
  return out;
}

async function getStudent(phone) {
  const { data } = await supabase.from('students').select('*').eq('phone', phone).maybeSingle();
  return data;
}
async function saveStudent(phone, { level, courses, stage }) {
  await supabase.from('students').upsert({ phone, level, courses: courses || [], stage });
}
async function getChecklist(phone, course) {
  const { data } = await supabase.from('exam_checklists').select('*').eq('phone', phone).eq('course', course).maybeSingle();
  return data || {};
}
async function saveChecklistStep(phone, course, stepKey) {
  const existing = await getChecklist(phone, course);
  const updated = { ...existing, [stepKey]: true, phone, course, updated_at: new Date().toISOString() };
  await supabase.from('exam_checklists').upsert(updated, { onConflict: 'phone,course' });
  return updated;
}
async function addDeadline({ level, course, title, dueDate }) {
  await supabase.from('deadlines').insert({ level, course, title, due_date: dueDate, reminded_at: [] });
}
async function getStudentsMatching(level, course) {
  const { data } = await supabase.from('students').select('phone').eq('level', level).contains('courses', [course]);
  return (data || []).map((s) => s.phone);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).json({ reply: null, note: 'Send a POST with { from, text }' });
  }

  const body = req.body || {};
  const from = (body.from || body.From || body.sender || body.wa_id || '').replace(/\D/g, '');
  const text = (body.text || body.Body || body.message || body.message_text || '').trim();

  if (!from || !text) {
    return res.status(400).json({ reply: null, error: 'Missing from/text in request body' });
  }

  const lower = text.toLowerCase();

  if (ADMIN_NUMBERS.includes(from) && lower.startsWith('admin ')) {
    const reply = await handleAdminCommand(text);
    return res.status(200).json({ reply, to: from });
  }

  let student = await getStudent(from);

  if (!student) {
    await saveStudent(from, { stage: 'ask_level', level: null, courses: [] });
    return res.status(200).json({
      reply: `👋 Welcome to the NOUN Student Bot!\n\nLet's get you set up. What level are you? (Reply with 100, 200, 300, or 400)`,
      to: from,
    });
  }

  if (student.stage === 'ask_level') {
    const level = text.replace(/\D/g, '');
    if (!['100', '200', '300', '400'].includes(level)) {
      return res.status(200).json({ reply: 'Please reply with just your level: 100, 200, 300, or 400.', to: from });
    }
    await saveStudent(from, { ...student, level, stage: 'ask_courses' });
    return res.status(200).json({
      reply: `Got it — ${level}L. Now send your course codes, comma-separated (e.g. CIT301, MTH281, CIT315).`,
      to: from,
    });
  }

  if (student.stage === 'ask_courses') {
    const courses = text.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
    await saveStudent(from, { ...student, courses, stage: 'active' });
    return res.status(200).json({
      reply: `✅ Registered: ${student.level}L — ${courses.join(', ')}\n\nYou'll get deadline reminders for these automatically.\n\n${MENU_TEXT}`,
      to: from,
    });
  }

  if (lower === 'help' || lower === 'menu') {
    return res.status(200).json({ reply: MENU_TEXT, to: from });
  }

  if (lower === 'mycourses') {
    return res.status(200).json({ reply: `You're registered as ${student.level}L — courses: ${student.courses.join(', ')}`, to: from });
  }

  if (lower.startsWith('examcheck')) {
    const course = text.split(' ')[1]?.toUpperCase();
    if (!course) return res.status(200).json({ reply: 'Usage: examcheck [course code], e.g. examcheck CIT301', to: from });
    const checklist = await getChecklist(from, course);
    return res.status(200).json({ reply: renderExamChecklist(course, checklist), to: from });
  }

  if (lower.startsWith('done ')) {
    const parts = text.split(' ');
    const course = parts[1]?.toUpperCase();
    const stepNum = parseInt(parts[2], 10);
    if (!course || !stepNum || stepNum < 1 || stepNum > EXAM_STEPS.length) {
      return res.status(200).json({ reply: 'Usage: done [course] [number], e.g. done CIT301 1', to: from });
    }
    const checklist = await saveChecklistStep(from, course, EXAM_STEPS[stepNum - 1].key);
    return res.status(200).json({ reply: renderExamChecklist(course, checklist), to: from });
  }

  return res.status(200).json({ reply: `Not sure what you mean. ${MENU_TEXT}`, to: from });
};

async function handleAdminCommand(text) {
  const parts = text.split(' ');
  const cmd = parts[1]?.toLowerCase();

  if (cmd === 'adddeadline') {
    const rest = text.split('adddeadline ')[1];
    const [meta, dateStr] = rest.split('|').map((s) => s.trim());
    const [level, course, ...titleParts] = meta.split(' ');
    const title = titleParts.join(' ');
    await addDeadline({ level: level.toUpperCase(), course: course.toUpperCase(), title, dueDate: dateStr });
    return `✅ Deadline added: ${level.toUpperCase()} ${course.toUpperCase()} — "${title}" due ${dateStr}`;
  }

  if (cmd === 'liststudents') {
    const level = parts[2]?.toUpperCase();
    const course = parts[3]?.toUpperCase();
    const phones = await getStudentsMatching(level, course);
    return `${phones.length} student(s) found for ${level}L ${course}.`;
  }

  return 'Admin commands:\n- admin adddeadline [level] [course] [title] | [YYYY-MM-DD]\n- admin liststudents [level] [course]';
}
