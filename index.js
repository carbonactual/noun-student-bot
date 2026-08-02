/**
 * NOUN Student Bot - v1 (Supabase-backed)
 * WhatsApp bot for NOUN students: onboarding, exam-hall checklist,
 * deadline reminders, and level+course group organizing.
 *
 * Runs on YOUR WhatsApp number via QR code login (whatsapp-web.js).
 * No Meta Business API approval needed for this v1.
 *
 * Data lives in Supabase (see supabase-schema.sql) so the live admin
 * dashboard (deployed on Vercel) shows the same data in real time.
 *
 * SETUP: see README.md
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const { notifyAdmin } = require('./telegram');
const db = require('./db-supabase');

// ---------- CONFIG ----------
const ADMIN_NUMBERS = [
  '234XXXXXXXXXX', // <-- REPLACE with your real number
];

// ---------- WHATSAPP CLIENT ----------
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
});

client.on('qr', (qr) => {
  console.log('Scan this QR code with WhatsApp > Linked Devices:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ NOUN Student Bot is online and connected to WhatsApp.');
});

// ---------- HELPERS ----------
function isAdmin(number) {
  return ADMIN_NUMBERS.includes(number);
}

const EXAM_STEPS = [
  { key: 'stamp1', label: 'Stamp/sign-off #1 (e.g. HOD)' },
  { key: 'stamp2', label: 'Stamp/sign-off #2 (e.g. Exam Officer)' },
  { key: 'stamp3', label: 'Stamp/sign-off #3 (e.g. Bursary)' },
  { key: 'laminated', label: 'Laminated + all 4 sheets ready to bring' },
];

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

const MENU_TEXT = `📚 NOUN Student Bot — Menu

1️⃣ *mycourses* — see your registered level/courses
2️⃣ *examcheck [course]* — start/view your exam-hall checklist for a course
3️⃣ *done [course] [number]* — check off a checklist item
4️⃣ *help* — show this menu again

Deadline reminders and study-group matching happen automatically once you're registered.`;

// ---------- MESSAGE HANDLER ----------
client.on('message', async (msg) => {
  const number = msg.from.replace('@c.us', '');
  const text = msg.body.trim();
  const lower = text.toLowerCase();

  // ---- Admin commands ----
  if (isAdmin(number) && lower.startsWith('admin ')) {
    return handleAdminCommand(msg, number, text);
  }

  let student = await db.getStudent(number);

  // ---- New student onboarding ----
  if (!student) {
    await db.saveStudent(number, { stage: 'ask_level', level: null, courses: [] });
    return msg.reply(
      `👋 Welcome to the NOUN Student Bot!\n\nLet's get you set up. What level are you? (Reply with 100, 200, 300, or 400)`
    );
  }

  if (student.stage === 'ask_level') {
    const level = text.replace(/\D/g, '');
    if (!['100', '200', '300', '400'].includes(level)) {
      return msg.reply('Please reply with just your level: 100, 200, 300, or 400.');
    }
    await db.saveStudent(number, { ...student, level, stage: 'ask_courses' });
    return msg.reply(
      `Got it — ${level}L. Now send your course codes, comma-separated (e.g. CIT301, MTH281, CIT315).`
    );
  }

  if (student.stage === 'ask_courses') {
    const courses = text
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
    await db.saveStudent(number, { ...student, courses, stage: 'active' });
    notifyAdmin(`🆕 New student onboarded: ${student.level}L — ${courses.join(', ')}`);
    return msg.reply(
      `✅ Registered: ${student.level}L — ${courses.join(', ')}\n\nYou'll get deadline reminders for these automatically. I'll also try to connect you with others in your level+course.\n\n${MENU_TEXT}`
    );
  }

  // ---- Active student commands ----
  if (lower === 'help' || lower === 'menu') {
    return msg.reply(MENU_TEXT);
  }

  if (lower === 'mycourses') {
    return msg.reply(`You're registered as ${student.level}L — courses: ${student.courses.join(', ')}`);
  }

  if (lower.startsWith('examcheck')) {
    const course = text.split(' ')[1]?.toUpperCase();
    if (!course) return msg.reply('Usage: examcheck [course code], e.g. examcheck CIT301');
    const checklist = await db.getChecklist(number, course);
    return msg.reply(renderExamChecklist(course, checklist));
  }

  if (lower.startsWith('done ')) {
    const parts = text.split(' ');
    const course = parts[1]?.toUpperCase();
    const stepNum = parseInt(parts[2], 10);
    if (!course || !stepNum || stepNum < 1 || stepNum > EXAM_STEPS.length) {
      return msg.reply('Usage: done [course] [number], e.g. done CIT301 1');
    }
    const checklist = await db.saveChecklistStep(number, course, EXAM_STEPS[stepNum - 1].key);
    const allDone = EXAM_STEPS.every((s) => checklist[s.key]);
    if (allDone) {
      notifyAdmin(`✅ ${student.level}L student fully completed exam checklist for ${course}`);
    }
    return msg.reply(renderExamChecklist(course, checklist));
  }

  // Fallback — flag to staff, since this is where students get stuck
  notifyAdmin(`⚠️ Student (${student.level}L, ${student.courses?.join(', ') || 'no courses'}) sent an unrecognized message: "${text}"`);
  return msg.reply(`Not sure what you mean. ${MENU_TEXT}`);
});

// ---------- ADMIN COMMANDS ----------
async function handleAdminCommand(msg, number, text) {
  const parts = text.split(' ');
  const cmd = parts[1]?.toLowerCase();

  // admin adddeadline [level] [course] [title...] | [YYYY-MM-DD]
  if (cmd === 'adddeadline') {
    const rest = text.split('adddeadline ')[1];
    const [meta, dateStr] = rest.split('|').map((s) => s.trim());
    const [level, course, ...titleParts] = meta.split(' ');
    const title = titleParts.join(' ');
    await db.addDeadline({ level: level.toUpperCase(), course: course.toUpperCase(), title, dueDate: dateStr });
    return msg.reply(`✅ Deadline added: ${level.toUpperCase()} ${course.toUpperCase()} — "${title}" due ${dateStr}`);
  }

  // admin creategroup [level] [course]
  if (cmd === 'creategroup') {
    const level = parts[2]?.toUpperCase();
    const course = parts[3]?.toUpperCase();
    const matchingPhones = await db.getStudentsMatching(level, course);
    if (matchingPhones.length === 0) {
      return msg.reply(`No students found for ${level}L ${course} yet.`);
    }
    const participantIds = matchingPhones.map((num) => `${num}@c.us`);
    await client.createGroup(`NOUN ${level}L ${course}`, participantIds);
    notifyAdmin(`👥 New group created: NOUN ${level}L ${course} — ${participantIds.length} students added`);
    return msg.reply(`✅ Created group "NOUN ${level}L ${course}" with ${participantIds.length} students.`);
  }

  // admin broadcast [level] [course] [message...]
  if (cmd === 'broadcast') {
    const rest = text.split('broadcast ')[1];
    const [level, course, ...msgParts] = rest.split(' ');
    const message = msgParts.join(' ');
    const matchingPhones = await db.getStudentsMatching(level.toUpperCase(), course.toUpperCase());
    for (const num of matchingPhones) {
      await client.sendMessage(`${num}@c.us`, `📢 ${message}`);
    }
    return msg.reply(`Sent to ${matchingPhones.length} students.`);
  }

  return msg.reply(
    'Admin commands:\n- admin adddeadline [level] [course] [title] | [YYYY-MM-DD]\n- admin creategroup [level] [course]\n- admin broadcast [level] [course] [message]'
  );
}

// ---------- DAILY DEADLINE REMINDER CRON (runs every day at 8am server time) ----------
cron.schedule('0 8 * * *', async () => {
  const deadlines = await db.getAllDeadlines();
  const now = new Date();

  for (const deadline of deadlines) {
    const due = new Date(deadline.due_date);
    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    const remindedAt = deadline.reminded_at || [];

    if ([3, 1].includes(daysLeft) && !remindedAt.includes(daysLeft)) {
      const matchingPhones = await db.getStudentsMatching(deadline.level, deadline.course);
      for (const num of matchingPhones) {
        await client.sendMessage(
          `${num}@c.us`,
          `⏰ Reminder: "${deadline.title}" for ${deadline.course} is due in ${daysLeft} day(s) (${deadline.due_date}).`
        );
      }
      await db.markDeadlineReminded(deadline.id, [...remindedAt, daysLeft]);
    }
  }
  console.log('Daily deadline check complete.');
  notifyAdmin(`📊 Daily deadline check complete — ${deadlines.length} tracked deadline(s) reviewed.`);
});

client.initialize();
