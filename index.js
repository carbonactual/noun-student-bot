/**
 * NOUN Student Bot — production-hardened v2
 * Persistent WhatsApp worker + Supabase shared state.
 * The Vercel dashboard remains a separate read-only surface.
 */
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const { notifyAdmin } = require('./telegram');
const db = require('./db-supabase');

const ADMIN_NUMBERS = (process.env.ADMIN_NUMBERS || '').split(',').map((n) => n.replace(/\D/g, '')).filter(Boolean);
const MAX_COURSES = 12;
const client = new Client({ authStrategy: new LocalAuth(), puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] } });
client.on('qr', (qr) => { console.log('Scan this QR code with WhatsApp > Linked Devices:'); qrcode.generate(qr, { small: true }); });
client.on('ready', () => console.log('✅ NOUN Student Bot is online and connected to WhatsApp.'));
client.on('auth_failure', (message) => console.error('WhatsApp auth failure:', message));
client.on('disconnected', (reason) => console.error('WhatsApp disconnected:', reason));
client.on('error', (error) => console.error('WhatsApp client error:', error));

function isAdmin(number) { return ADMIN_NUMBERS.includes(number); }
function safeNotify(text) { Promise.resolve(notifyAdmin(text)).catch((error) => console.error('Admin notification failed:', error.message)); }
function normalizeCourse(value) { return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ''); }
function parseCourses(text) { return [...new Set(String(text || '').split(',').map(normalizeCourse).filter(Boolean))].slice(0, MAX_COURSES); }
function validLevel(value) { return ['100', '200', '300', '400'].includes(String(value)); }
function parseDate(value) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null; const date = new Date(`${value}T00:00:00Z`); return Number.isNaN(date.getTime()) ? null : value; }

const EXAM_STEPS = [
  { key: 'stamp1', label: 'Stamp/sign-off #1 (e.g. HOD)' },
  { key: 'stamp2', label: 'Stamp/sign-off #2 (e.g. Exam Officer)' },
  { key: 'stamp3', label: 'Stamp/sign-off #3 (e.g. Bursary)' },
  { key: 'laminated', label: 'Laminated + all 4 sheets ready to bring' },
];
function renderExamChecklist(course, checklist) {
  let out = `📋 Exam Hall Checklist — ${course}\n\n`;
  EXAM_STEPS.forEach((step, i) => { out += `${checklist?.[step.key] ? '✅' : '⬜'} ${i + 1}. ${step.label}\n`; });
  const doneCount = EXAM_STEPS.filter((s) => checklist?.[s.key]).length;
  out += `\n${doneCount}/${EXAM_STEPS.length} complete.`;
  out += doneCount < EXAM_STEPS.length ? `\n\nReply "done ${course} [number]" to check off an item, e.g. "done ${course} 1"` : '\n\n🎉 You\'re fully ready for the exam hall!';
  return out;
}
const MENU_TEXT = `📚 NOUN Student Bot — Menu\n\n1️⃣ *mycourses* — see your registered level/courses\n2️⃣ *examcheck [course]* — start/view your exam-hall checklist\n3️⃣ *done [course] [number]* — check off a checklist item\n4️⃣ *help* — show this menu again\n\nDeadline reminders and study-group matching happen automatically.`;

client.on('message', async (msg) => {
  try {
    if (msg.fromMe || !msg.from.endsWith('@c.us')) return;
    const number = msg.from.replace('@c.us', '').replace(/\D/g, '');
    const text = msg.body.trim();
    const lower = text.toLowerCase();
    if (!text) return;
    if (isAdmin(number) && lower.startsWith('admin ')) return handleAdminCommand(msg, number, text);

    let student = await db.getStudent(number);
    if (!student) {
      await db.saveStudent(number, { stage: 'ask_level', level: null, courses: [] });
      return msg.reply('👋 Welcome to the NOUN Student Bot!\n\nWhat level are you? Reply with 100, 200, 300, or 400.');
    }
    if (student.stage === 'ask_level') {
      const level = text.replace(/\D/g, '');
      if (!validLevel(level)) return msg.reply('Please reply with just your level: 100, 200, 300, or 400.');
      await db.saveStudent(number, { ...student, level, stage: 'ask_courses' });
      return msg.reply(`Got it — ${level}L. Now send your course codes, comma-separated (e.g. CIT301, MTH281, CIT315).`);
    }
    if (student.stage === 'ask_courses') {
      const courses = parseCourses(text);
      if (!courses.length) return msg.reply('Please send at least one course code, e.g. CIT301, MTH281.');
      await db.saveStudent(number, { ...student, courses, stage: 'active' });
      safeNotify(`🆕 New student onboarded: ${student.level}L — ${courses.join(', ')}`);
      return msg.reply(`✅ Registered: ${student.level}L — ${courses.join(', ')}\n\nYou'll get deadline reminders automatically.\n\n${MENU_TEXT}`);
    }
    if (lower === 'help' || lower === 'menu') return msg.reply(MENU_TEXT);
    if (lower === 'mycourses') return msg.reply(`You're registered as ${student.level}L — courses: ${student.courses.join(', ')}`);
    if (lower.startsWith('examcheck')) {
      const course = normalizeCourse(text.split(/\s+/)[1]);
      if (!course) return msg.reply('Usage: examcheck [course code], e.g. examcheck CIT301');
      if (!student.courses.includes(course)) return msg.reply(`You're not registered for ${course}. Try *mycourses* to see your courses.`);
      return msg.reply(renderExamChecklist(course, await db.getChecklist(number, course)));
    }
    if (lower.startsWith('done ')) {
      const parts = text.split(/\s+/); const course = normalizeCourse(parts[1]); const stepNum = Number.parseInt(parts[2], 10);
      if (!student.courses.includes(course)) return msg.reply(`You're not registered for ${course}. Try *mycourses* first.`);
      if (!Number.isInteger(stepNum) || stepNum < 1 || stepNum > EXAM_STEPS.length) return msg.reply(`Usage: done [course] [1-${EXAM_STEPS.length}], e.g. done CIT301 1`);
      const checklist = await db.saveChecklistStep(number, course, EXAM_STEPS[stepNum - 1].key);
      if (EXAM_STEPS.every((s) => checklist[s.key])) safeNotify(`✅ ${student.level}L student fully completed exam checklist for ${course}`);
      return msg.reply(renderExamChecklist(course, checklist));
    }
    safeNotify(`⚠️ Student (${student.level}L, ${student.courses?.join(', ') || 'no courses'}) sent an unrecognized message: "${text.slice(0, 300)}"`);
    return msg.reply(`Not sure what you mean. ${MENU_TEXT}`);
  } catch (error) {
    console.error('Message handler error:', error);
    try { return msg.reply('Sorry — something went wrong processing that. Please try again in a moment.'); } catch (_) {}
  }
});

async function handleAdminCommand(msg, number, text) {
  try {
    const parts = text.split(/\s+/); const cmd = parts[1]?.toLowerCase();
    if (cmd === 'adddeadline') {
      const rest = text.split(/adddeadline\s+/i)[1] || ''; const [meta, rawDate] = rest.split('|').map((s) => s.trim());
      const [level, rawCourse, ...titleParts] = meta.split(/\s+/); const course = normalizeCourse(rawCourse); const dueDate = parseDate(rawDate);
      if (!validLevel(level) || !course || !titleParts.length || !dueDate) return msg.reply('Usage: admin adddeadline [100|200|300|400] [COURSE] [title] | [YYYY-MM-DD]');
      await db.addDeadline({ level, course, title: titleParts.join(' ').slice(0, 200), dueDate });
      return msg.reply(`✅ Deadline added: ${level}L ${course} — "${titleParts.join(' ')}" due ${dueDate}`);
    }
    if (cmd === 'creategroup') {
      const level = parts[2]; const course = normalizeCourse(parts[3]);
      if (!validLevel(level) || !course) return msg.reply('Usage: admin creategroup [100|200|300|400] [COURSE]');
      const matchingPhones = await db.getStudentsMatching(level, course);
      if (!matchingPhones.length) return msg.reply(`No students found for ${level}L ${course} yet.`);
      const participantIds = matchingPhones.map((num) => `${num}@c.us`); const result = await client.createGroup(`NOUN ${level}L ${course}`, participantIds);
      safeNotify(`👥 New group created: NOUN ${level}L ${course} — ${participantIds.length} students targeted`);
      return msg.reply(`✅ Created group "${result?.title || `NOUN ${level}L ${course}`}" with ${participantIds.length} students targeted.`);
    }
    if (cmd === 'broadcast') {
      const level = parts[2]; const course = normalizeCourse(parts[3]); const message = parts.slice(4).join(' ').trim();
      if (!validLevel(level) || !course || !message) return msg.reply('Usage: admin broadcast [100|200|300|400] [COURSE] [message]');
      const matchingPhones = await db.getStudentsMatching(level, course); let sent = 0;
      for (const num of matchingPhones) { try { await client.sendMessage(`${num}@c.us`, `📢 ${message}`); sent += 1; } catch (error) { console.error(`Broadcast failed for ${num}:`, error.message); } }
      safeNotify(`📢 Broadcast complete: ${sent}/${matchingPhones.length} delivered to ${level}L ${course}`);
      return msg.reply(`Broadcast complete: ${sent}/${matchingPhones.length} delivered.`);
    }
    return msg.reply('Admin commands:\n- admin adddeadline [level] [course] [title] | [YYYY-MM-DD]\n- admin creategroup [level] [course]\n- admin broadcast [level] [course] [message]');
  } catch (error) { console.error('Admin command error:', error); return msg.reply('Admin command failed safely. Check the server logs.'); }
}

cron.schedule('0 8 * * *', async () => {
  try {
    const deadlines = await db.getAllDeadlines(); const now = new Date();
    for (const deadline of deadlines) {
      const due = new Date(`${deadline.due_date}T23:59:59Z`); const daysLeft = Math.ceil((due - now) / 86400000);
      const remindedAt = Array.isArray(deadline.reminded_at) ? deadline.reminded_at : [];
      if ([3, 1].includes(daysLeft) && !remindedAt.includes(daysLeft)) {
        const matchingPhones = await db.getStudentsMatching(deadline.level, deadline.course);
        for (const num of matchingPhones) { try { await client.sendMessage(`${num}@c.us`, `⏰ Reminder: "${deadline.title}" for ${deadline.course} is due in ${daysLeft} day(s) (${deadline.due_date}).`); } catch (error) { console.error(`Reminder failed for ${num}:`, error.message); } }
        await db.markDeadlineReminded(deadline.id, [...remindedAt, daysLeft]);
      }
    }
    console.log(`Daily deadline check complete — ${deadlines.length} deadline(s) reviewed.`); safeNotify(`📊 Daily deadline check complete — ${deadlines.length} tracked deadline(s) reviewed.`);
  } catch (error) { console.error('Deadline cron error:', error); safeNotify(`🚨 Deadline cron failed: ${error.message}`); }
}, { timezone: 'Africa/Lagos' });

client.initialize();
