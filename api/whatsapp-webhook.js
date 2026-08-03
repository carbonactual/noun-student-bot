const { createClient } = require('@supabase/supabase-js');

// Public-safe Supabase key — narrow RLS policies restrict what it can do.
const SUPABASE_URL = 'https://uxsvclrpiiiyxrzteuzf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_B7otzzB4q1SwuchyqIFN1g_vuclTyBF';
const ADMIN_NUMBERS = ['2347046481828', '2349029591932'];

// Resend sending-only API key — can only send emails, cannot manage the account.
const RESEND_API_KEY = 're_HuL6yc88_CAcwNoibKPYxPi3xpH5nfKVXI';
const RESEND_FROM = 'onboarding@resend.dev';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sendEmail(to, subject, text) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, text }),
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

const EXAM_STEPS = [
  { key: 'stamp1', label: 'Stamp/sign-off #1 (e.g. HOD)' },
  { key: 'stamp2', label: 'Stamp/sign-off #2 (e.g. Exam Officer)' },
  { key: 'stamp3', label: 'Stamp/sign-off #3 (e.g. Bursary)' },
  { key: 'laminated', label: 'Laminated + all 4 sheets ready to bring' },
];

const MENU_TEXT = `📚 NOUN Student Bot — Menu\n\n1️⃣ *mycourses* — see your registered level/courses\n2️⃣ *examcheck [course]* — start/view your exam-hall checklist for a course\n3️⃣ *done [course] [number]* — check off a checklist item\n4️⃣ *email [address]* — register a personal email for backup deadline alerts\n5️⃣ *help* — show this menu again\n\nDeadline reminders and study-group matching happen automatically once you're registered.`;

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
async function saveStudent(phone, fields) {
  await supabase.from('students').upsert({ phone, ...fields });
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
  const { data } = await supabase.from('students').select('phone, email').eq('level', level).contains('courses', [course]);
  return data || [];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    await saveStudent(from, { level, stage: 'ask_courses' });
    return res.status(200).json({
      reply: `Got it — ${level}L. Now send your course codes, comma-separated (e.g. CIT301, MTH281, CIT315).`,
      to: from,
    });
  }

  if (student.stage === 'ask_courses') {
    const courses = text.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
    await saveStudent(from, { courses, stage: 'active' });
    return res.status(200).json({
      reply: `✅ Registered: ${student.level}L — ${courses.join(', ')}\n\nYou'll get deadline reminders for these automatically.\n\n${MENU_TEXT}`,
      to: from,
    });
  }

  if (lower === 'help' || lower === 'menu') {
    return res.status(200).json({ reply: MENU_TEXT, to: from });
  }

  if (lower === 'mycourses') {
    return res.status(200).json({ reply: `You're registered as ${student.level}L — courses: ${student.courses.join(', ')}${student.email ? `\nBackup email: ${student.email}` : ''}`, to: from });
  }

  if (lower.startsWith('email ')) {
    const address = text.split(' ')[1]?.trim();
    if (!address || !EMAIL_REGEX.test(address)) {
      return res.status(200).json({ reply: 'Usage: email your@address.com — use a personal email, not your school email.', to: from });
    }
    await saveStudent(from, { email: address });
    await sendEmail(address, 'NOUN Student Bot — Email Connected', `This email is now linked to your NOUN Student Bot account (${student.level}L, ${student.courses.join(', ')}). You'll get deadline alerts here as a backup to WhatsApp.`);
    return res.status(200).json({ reply: `✅ Email registered: ${address}. A confirmation email is on its way.`, to: from });
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
    const L = level.toUpperCase();
    const C = course.toUpperCase();
    await addDeadline({ level: L, course: C, title, dueDate: dateStr });

    const matches = await getStudentsMatching(L, C);
    const withEmail = matches.filter((s) => s.email);
    for (const s of withEmail) {
      await sendEmail(s.email, `NOUN Deadline: ${C} — ${title}`, `New deadline for ${L}L ${C}:\n\n${title}\nDue: ${dateStr}\n\nCheck WhatsApp for full details and reminders.`);
    }

    return `✅ Deadline added: ${L} ${C} — "${title}" due ${dateStr}\n📧 Emailed ${withEmail.length}/${matches.length} matching students (rest have no email on file).`;
  }

  if (cmd === 'liststudents') {
    const level = parts[2]?.toUpperCase();
    const course = parts[3]?.toUpperCase();
    const matches = await getStudentsMatching(level, course);
    return `${matches.length} student(s) found for ${level}L ${course}, ${matches.filter((s) => s.email).length} with email on file.`;
  }

  return 'Admin commands:\n- admin adddeadline [level] [course] [title] | [YYYY-MM-DD]\n- admin liststudents [level] [course]';
}
