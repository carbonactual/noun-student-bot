// CIBN BOT — ABBA chat engine (Gemini). Stateless: no student records.
// Serves the CIBN landing page cross-origin (https://mcp-bot-eight.vercel.app).

const ALLOWED_ORIGIN = process.env.CIBN_CHAT_ORIGIN || 'https://mcp-bot-eight.vercel.app';
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-flash-latest';

const SYSTEM_PROMPT = [
  'You are ABBA, the AI companion inside CIBN BOT — a product of Institute GPT.',
  'You help candidates preparing for CIBN (Chartered Institute of Bankers of Nigeria) examinations, starting with the MCP (Microfinance Certification Programme) October 2026 diet.',
  'Voice: warm, precise, encouraging, professional. Like a supportive senior colleague in banking.',
  'Format: short paragraphs or a compact numbered list. Max ~180 words. Plain text only — no markdown symbols like ** or ##.',
  '',
  'HARD RULES:',
  '1. NEVER write, complete or substantially draft a candidate\'s exam, TMA or assignment answer. Coach instead: explain the concept, outline how they should structure their own answer, offer to review their approach. You teach; they write.',
  '2. VERIFIED FACTS you may state: the MCP October 2026 diet holds on 6–7 October 2026; the exam runs on CIBN\'s remote online proctoring platform (candidate locks in a private room, shows ID, scans the environment before starting); the official CIBN exam fee for the full MCP diet is 32,500 NGN paid directly to CIBN; MCP covers 6 courses — Accreditation I (MF301, MF302, MF303) and Examination II (MF401 Risk Management, MF402 Ethics, plus one elective: MF403 Digital Finance or MF404 SME Management).',
  '3. NEVER invent CIBN facts. If asked about registration deadlines, exemptions, ACIB or Chartered Banker fees, membership dues or portal mechanics, say plainly that these must be confirmed with CIBN directly (0700-DIAL-CIBN or the CIBN portal) — do not guess dates, fees or procedures.',
  '4. You do not process payments, registration or exemptions. For those, direct the candidate to CIBN officially. For our services (coaching, mocks, concierge, Pass Package), point them to the packages on this page and the WhatsApp line.',
  '5. For proctoring prep, offer practical help: tech and lighting check, backup power plan, room-scan rehearsal, exam-day protocol. That is our Exam-Day Command service.',
  '6. Never ask for passwords, pins or payment details. Never claim to be human.'
].join('\n');

function withTimeout(ms = 11000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function cleanText(raw) {
  return String(raw || '').replace(/\*\*/g, '').replace(/^#+\s*/gm, '').trim();
}

async function geminiAttempt(model, apiKey, promptText, timeoutMs) {
  const { signal, clear } = withTimeout(timeoutMs);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 700, topP: 0.9 }
        })
      }
    );
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const err = new Error(`Gemini returned ${response.status}`);
      err.status = response.status;
      throw err;
    }
    const text = cleanText(
      data && data.candidates && data.candidates[0] && data.candidates[0].content
      && Array.isArray(data.candidates[0].content.parts)
        ? data.candidates[0].content.parts.map(p => p.text || '').join('')
        : ''
    );
    if (!text) throw new Error('empty answer');
    return text;
  } finally {
    clear();
  }
}

async function cibnChat(req, res) {
  const origin = req.headers && req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ ok: false, error: 'engine unavailable' });

  const message = String(req.body && req.body.message || '').trim().slice(0, 2000);
  const course = String(req.body && req.body.course || '').trim().slice(0, 80);
  const mode = ['study', 'practice'].includes(req.body && req.body.mode) ? req.body.mode : 'study';
  if (!message) return res.status(400).json({ error: 'message required' });

  const promptText = [
    `COURSE FOCUS: ${course || 'general MCP / banking studies'}`,
    `MODE: ${mode}`,
    '',
    `CANDIDATE QUESTION: ${message}`,
    '',
    'Answer following the hard rules.'
  ].join('\n');

  const attemptMs = 11000;
  let lastError;
  for (let i = 0; i < 2; i++) {
    try {
      const answer = await geminiAttempt(PRIMARY_MODEL, apiKey, promptText, attemptMs);
      return res.status(200).json({ ok: true, answer, mode });
    } catch (error) {
      lastError = error;
      if (error.status === 503 || error.status === 429) {
        await new Promise(r => setTimeout(r, 1200));
        continue;
      }
      break;
    }
  }
  try {
    const answer = await geminiAttempt(FALLBACK_MODEL, apiKey, promptText, attemptMs);
    return res.status(200).json({ ok: true, answer, mode });
  } catch (error) {
    console.error('cibn-chat:', String(lastError && lastError.message || error.message));
    return res.status(503).json({ ok: false, error: 'engine temporarily unavailable' });
  }
};

module.exports = { cibnChat };
