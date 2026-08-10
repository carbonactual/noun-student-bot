const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uxsvclrpiiiyxrzteuzf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_B7otzzB4q1SwuchyqIFN1g_vuclTyBF';
const ADMIN_NUMBERS = ['2347046481828', '2349029591932'];
const ADMIN_EMAIL = 'abduhabu99@gmail.com';
const RESEND_API_KEY = 're_HuL6yc88_CAcwNoibKPYxPi3xpH5nfKVXI';
const RESEND_FROM = 'onboarding@resend.dev';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = GEMINI_API_KEY
  ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`
  : null;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sendEmail(to, subject, text) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, text }),
    });
  } catch (err) { console.error('Email send failed:', err.message); }
}

async function getRelevantCourseContent(studentText, courses) {
  if (!courses || !courses.length) return null;
  const { data } = await supabase.from('course_content').select('*').in('course_code', courses);
  if (!data || !data.length) return null;
  const words = studentText.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const scored = data.map((chunk) => {
    const text = (chunk.module_title + ' ' + chunk.content).toLowerCase();
    const score = words.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0);
    return { chunk, score };
  }).sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, 2);
  if (!top.length) return null;
  return top.map((t) => `[${t.chunk.course_code} - ${t.chunk.module_title}]\n${t.chunk.content}`).join('\n\n');
}

async function askGemini(studentText, student) {
  if (!GEMINI_URL) return null;
  const courseContent = student ? await getRelevantCourseContent(studentText, student.courses) : null;
  const context = student
    ? `The student is ${student.level}L, registered for: ${(student.courses || []).join(', ') || 'no courses yet'}.`
    : `This student hasn't finished registering yet.`;
  const groundingBlock = courseContent
    ? `\n\nRelevant official NOUN course material (use this to answer if it's relevant to their question, and mention it's from their course material when you use it):\n\n${courseContent}`
    : '';
  const systemPrompt = `You are a helpful assistant inside a WhatsApp bot for NOUN (National Open University of Nigeria) students. ${context}${groundingBlock}

Rules:
- Keep replies short and WhatsApp-friendly (a few sentences, plain text, no markdown headers).
- You do NOT have access to their live portal, real registration status, or official records.
- If they ask about official NOUN actions (registering courses/exams, fee payments, official results), tell them to check the NOUN portal or reply "human" to reach a real person.
- You CAN help with: explaining concepts, study tips, general academic questions, and using this bot's commands.
- Never claim to submit anything on their behalf or take any exam/assignment for them.
- If course material was provided above, prefer it over general knowledge when it's relevant, but don't force it in if the question isn't actually about that course.

Student's message: "${studentText}"`;
  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] }),
    });
    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply ? reply.trim() : null;
  } catch (err) { console.error('Gemini call failed:', err.message); return null; }
}

const EXAM_STEPS = [
  { key: 'stamp1', label: 'Stamp/sign-off #1 (e.g. HOD)' },
  { key: 'stamp2', label: 'Stamp/sign-off #2 (e.g. Exam Officer)' },
  { key: 'stamp3', label: 'Stamp/sign-off #3 (e.g. Bursary)' },
  { key: 'laminated', label: 'Laminated + all 4 sheets ready to bring' },
];

const PROFILE_FIELDS = {
  matric: 'matric_number', faculty: 'faculty', dept: 'department', department: 'department',
  waec: 'waec_result', neco: 'neco_result', cert: 'primary_cert', direntry: 'direct_entry_qualification', state: 'state_of_origin',
};

const MENU_TEXT = `📚 NOUN Student Bot — Menu\n\n1️⃣ *mycourses* — see your registered level/courses\n2️⃣ *examcheck [course]* — start/view your exam-hall checklist for a course\n3️⃣ *done [course] [number]* — check off a checklist item\n4️⃣ *email [address]* — register a personal email for backup deadline alerts\n5️⃣ *profile* — see or update your full student profile\n6️⃣ *human* — talk to a real person instead of the bot\n7️⃣ *help* — show this menu again\n\nOr just ask me anything in your own words — I'll do my best to help, using your real course material where I can.`;

function renderExamChecklist(course, checklist) {
  let out = `📋 Exam Hall Checklist — ${course}\n\n`;
  EXAM_STEPS.forEach((step, i) => { const done = checklist && checklist[step.key]; out += `${done ? '✅' : '⬜'} ${i + 1}. ${step.label}\n`; });
  const doneCount = EXAM_STEPS.filter((s) => checklist && checklist[s.key]).length;
  out += `\n${doneCount}/${EXAM_STEPS.length} complete.`;
  if (doneCount < EXAM_STEPS.length) { out += `\n\nReply "done ${course} [number]" to check off an item, e.g. "done ${course} 1"`; }
  else { out += `\n\n🎉 You're fully ready for the exam hall!`; }
  return out;
}

function renderProfile(student) {
  const lines = [
    `Level: ${student.level || 'not set'}`,
    `Courses: ${(student.courses || []).join(', ') || 'none'}`,
    `Matric number: ${student.matric_number || 'not set'}`,
    `Faculty: ${student.faculty || 'not set'}`,
    `Department: ${student.department || 'not set'}`,
    `WAEC: ${student.waec_result || 'not set'}`,
    `NECO: ${student.neco_result || 'not set'}`,
    `Certificate: ${student.primary_cert || 'not set'}`,
    `Direct entry qualification: ${student.direct_entry_qualification || 'not set'}`,
    `State of origin: ${student.state_of_origin || 'not set'}`,
    `Email: ${student.email || 'not set'}`,
  ];
  return `📇 Your Profile\n\n${lines.join('\n')}\n\nTo update, reply like:\nprofile matric=NOU123456, faculty=Computing, dept=Computer Science, waec=5 credits, state=Kano\n(only include the fields you want to change)`;
}

function parseProfileUpdate(text) {
  const rest = text.replace(/^profile\s*/i, '').trim();
  if (!rest) return null;
  const updates = {};
  rest.split(',').forEach((pair) => {
    const match = pair.split(/[:=]/);
    if (match.length < 2) return;
    const key = match[0].trim().toLowerCase();
    const value = match.slice(1).join('=').trim();
    const column = PROFILE_FIELDS[key];
    if (column && value) updates[column] = value;
  });
  return Object.keys(updates).length ? updates : null;
}

async function getStudent(phone) { const { data } = await supabase.from('students').select('*').eq('phone', phone).maybeSingle(); return data; }
async function saveStudent(phone, fields) { await supabase.from('students').upsert({ phone, ...fields }); }
async function getChecklist(phone, course) { const { data } = await supabase.from('exam_checklists').select('*').eq('phone', phone).eq('course', course).maybeSingle(); return data || {}; }
async function saveChecklistStep(phone, course, stepKey) {
  const existing = await getChecklist(phone, course);
  const updated = { ...existing, [stepKey]: true, phone, course, updated_at: new Date().toISOString() };
  await supabase.from('exam_checklists').upsert(updated, { onConflict: 'phone,course' });
  return updated;
}
async function addDeadline({ level, course, title, dueDate }) { await supabase.from('deadlines').insert({ level, course, title, due_date: dueDate, reminded_at: [] }); }
async function getStudentsMatching(level, course) { const { data } = await supabase.from('students').select('phone, email').eq('level', level).contains('courses', [course]); return data || []; }
async function logHelpRequest(phone, student, note) {
  try { await supabase.from('help_requests').insert({ phone, level: student?.level || null, courses: student?.courses || [], note: note || null }); }
  catch (err) { console.error('logHelpRequest failed:', err.message); }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).json({ reply: null, note: 'Send a POST with { from, text }' });

  const body = req.body || {};
  const from = (body.from || body.From || body.sender || body.wa_id || '').replace(/\D/g, '');
  const text = (body.text || body.Body || body.message || body.message_text || '').trim();
  if (!from || !text) return res.status(400).json({ reply: null, error: 'Missing from/text in request body' });

  const lower = text.toLowerCase();

  if (ADMIN_NUMBERS.includes(from) && lower.startsWith('admin ')) {
    const reply = await handleAdminCommand(text);
    return res.status(200).json({ reply, to: from });
  }

  let student = await getStudent(from);

  if (lower === 'human' || lower === 'help me' || lower === 'talk to someone' || lower === 'agent') {
    await logHelpRequest(from, student, text);
    await sendEmail(ADMIN_EMAIL, `NOUN Bot: student needs a human (${from})`,
      `Phone: ${from}\nLevel/courses: ${student ? `${student.level || 'not set'}L, ${(student.courses || []).join(', ') || 'none'}` : 'not registered'}\n\nMessage: "${text}"\n\nReply to them on WhatsApp.`);
    return res.status(200).json({ reply: `🙋 I've flagged this for a real person — you'll hear back here on WhatsApp. Reply "menu" to see what I can help with in the meantime.`, to: from });
  }

  if (!student) {
    await saveStudent(from, { stage: 'ask_level', level: null, courses: [] });
    return res.status(200).json({ reply: `👋 Welcome to the NOUN Student Bot!\n\nWhat level are you? (Reply with 100, 200, 300, or 400)\n\nReply "human" anytime to talk to a real person instead.`, to: from });
  }

  if (student.stage === 'ask_level') {
    const level = text.replace(/\D/g, '');
    if (!['100', '200', '300', '400'].includes(level)) return res.status(200).json({ reply: 'Please reply with just your level: 100, 200, 300, or 400.', to: from });
    await saveStudent(from, { level, stage: 'ask_courses' });
    return res.status(200).json({ reply: `Got it — ${level}L. Now send your course codes, comma-separated (e.g. CIT301, MTH281, CIT315).`, to: from });
  }

  if (student.stage === 'ask_courses') {
    const courses = text.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
    await saveStudent(from, { courses, stage: 'active' });
    return res.status(200).json({ reply: `✅ Registered: ${student.level}L — ${courses.join(', ')}\n\n${MENU_TEXT}`, to: from });
  }

  if (lower === 'help' || lower === 'menu') return res.status(200).json({ reply: MENU_TEXT, to: from });
  if (lower === 'mycourses') return res.status(200).json({ reply: `You're registered as ${student.level}L — courses: ${student.courses.join(', ')}${student.email ? `\nEmail: ${student.email}` : ''}`, to: from });

  if (lower === 'profile') {
    return res.status(200).json({ reply: renderProfile(student), to: from });
  }

  if (lower.startsWith('profile ')) {
    const updates = parseProfileUpdate(text);
    if (!updates) {
      return res.status(200).json({ reply: `Couldn't read that format. Try:\nprofile matric=NOU123456, faculty=Computing, state=Kano`, to: from });
    }
    await saveStudent(from, updates);
    const updated = await getStudent(from);
    return res.status(200).json({ reply: `✅ Profile updated.\n\n${renderProfile(updated)}`, to: from });
  }

  if (lower.startsWith('email ')) {
    const address = text.split(' ')[1]?.trim();
    if (!address || !EMAIL_REGEX.test(address)) return res.status(200).json({ reply: 'Usage: email your@address.com — use a personal email, not your school email.', to: from });
    await saveStudent(from, { email: address });
    await sendEmail(address, 'NOUN Student Bot — Email Connected', `Email linked to your bot account (${student.level}L, ${student.courses.join(', ')}). You'll get deadline alerts here too.`);
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
    if (!course || !stepNum || stepNum < 1 || stepNum > EXAM_STEPS.length) return res.status(200).json({ reply: 'Usage: done [course] [number], e.g. done CIT301 1', to: from });
    const checklist = await saveChecklistStep(from, course, EXAM_STEPS[stepNum - 1].key);
    return res.status(200).json({ reply: renderExamChecklist(course, checklist), to: from });
  }

  const aiReply = await askGemini(text, student);
  if (aiReply) return res.status(200).json({ reply: aiReply, to: from });

  return res.status(200).json({ reply: `Not sure what you mean. Reply "human" to talk to a real person.\n\n${MENU_TEXT}`, to: from });
};

async function handleAdminCommand(text) {
  const parts = text.split(' ');
  const cmd = parts[1]?.toLowerCase();
  if (cmd === 'adddeadline') {
    const rest = text.split('adddeadline ')[1];
    const [meta, dateStr] = rest.split('|').map((s) => s.trim());
    const [level, course, ...titleParts] = meta.split(' ');
    const title = titleParts.join(' ');
    const L = level.toUpperCase(), C = course.toUpperCase();
    await addDeadline({ level: L, course: C, title, dueDate: dateStr });
    const matches = await getStudentsMatching(L, C);
    const withEmail = matches.filter((s) => s.email);
    for (const s of withEmail) await sendEmail(s.email, `NOUN Deadline: ${C} — ${title}`, `New deadline for ${L}L ${C}:\n\n${title}\nDue: ${dateStr}\n\nCheck WhatsApp for reminders.`);
    return `✅ Deadline added: ${L} ${C} — "${title}" due ${dateStr}\n📧 Emailed ${withEmail.length}/${matches.length} students.`;
  }
  if (cmd === 'liststudents') {
    const level = parts[2]?.toUpperCase(), course = parts[3]?.toUpperCase();
    const matches = await getStudentsMatching(level, course);
    return `${matches.length} student(s) for ${level}L ${course}, ${matches.filter((s) => s.email).length} with email.`;
  }
  return 'Admin commands:\n- admin adddeadline [level] [course] [title] | [YYYY-MM-DD]\n- admin liststudents [level] [course]';
}
