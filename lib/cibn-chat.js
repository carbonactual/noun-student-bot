// CIBN BOT — ABBA intelligence endpoint.
// Thin delivery adapter: current CIBN facts are grounded in official sources when possible,
// while Institute GPT service offers are clearly separated from CIBN institutional facts.

const { contextForQuery, findInterest, conflicts, publicationsFor } = require('./cibn-catalog');

const ALLOWED_ORIGINS = (process.env.CIBN_CHAT_ORIGINS ||
  'https://mcp-bot-eight.vercel.app,https://mcp-bot-abduhabu99-9693s-projects.vercel.app')
  .split(',')
  .map(x => x.trim())
  .filter(Boolean);

const PRIMARY_MODEL = process.env.CIBN_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const FALLBACK_MODEL = process.env.CIBN_GEMINI_FALLBACK_MODEL || process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.7-flash';
const LAST_FALLBACK_MODEL = process.env.CIBN_GEMINI_LAST_FALLBACK_MODEL || process.env.GEMINI_LAST_FALLBACK_MODEL || 'gemini-3.6-flash';

const OFFICIAL_KNOWLEDGE = [
  'CIBN official MCP page currently lists the New Syllabus Microfinance I courses: MF301 The Evolution Management and Regulation of Microfinancing; MF302 Financial Analysis and Performance Monitoring in Microfinance Institutions; MF303 Product Development and Marketing Management.',
  'CIBN official MCP page currently lists the Microfinance II courses: MF401 Risk Management and Internal Control in Microfinance Institutions; MF402 Ethics and Corporate Governance; MF403 Digital Finance in Microfinance Institution (elective); MF404 Small and Medium Enterprises Management and Development (elective).',
  'CIBN official MCP information currently lists an exam fee of ₦32,500 for six subjects.',
  'CIBN states that examinations are conducted via a Remote Online Proctoring Platform.',
  'CIBN states that its examinations are administered through four annual diets: February, April, July and October, with full implementation of the four-diet structure in 2026.'
].join('\n');

const SERVICE_KNOWLEDGE = [
  'Institute GPT / CIBN BOT service offers shown by the current product: Pass Package ₦36,000 for all six courses; Level One ₦22,500 for the first three courses; Coaching ₦5,000 per course; Mock Season ₦15,000 for the full diet or ₦3,500 for one course; Registration & Materials Concierge ₦5,000; Exam-Day Command ₦19,250; Rescue Resit ₦6,750 per course; B2B staff bundle ₦25,000 per staff member.',
  'These service prices belong to CIBN BOT / Institute GPT, not to CIBN. Never describe them as CIBN institutional fees.'
].join('\n');

const PROVISIONAL_OWNER_EVIDENCE = [
  'The current CIBN BOT product page displays a provisional owner-supplied claim that registration for the October 2026 diet closes on 23 September 2026.',
  'Treat that deadline as deployment evidence, not as an official CIBN fact, until a current official CIBN source confirms it. When asked, search the web and prefer CIBN.'
].join('\n');

const SYSTEM_PROMPT = [
  'You are ABBA, the intelligence inside CIBN BOT — an Institute GPT product for candidates preparing for CIBN certification and Microfinance examinations.',
  'Your job is to understand the candidate, answer the actual question, use trustworthy evidence and help with the next useful step. Do not behave like a link router or a generic scripted chatbot.',
  'Use the official knowledge below as a starting point, then use Google Search grounding when enabled whenever a current, changing, disputed or missing fact matters. Prefer official CIBN pages and portal material.',
  'Clearly separate CIBN institutional facts from Institute GPT / CIBN BOT service information.',
  'If a fact is not verified, say so plainly. Never invent a date, fee, portal step, exemption rule or eligibility requirement.',
  'Voice: warm, precise, professional and practical. Notice worry, confusion, frustration, embarrassment, urgency and sarcasm.',
  'Treat sarcasm and terse wording as context signals, not hostility. Never mirror sarcasm.',
  'When a candidate sounds worried, acknowledge it briefly, identify what is actually at risk, and give the simplest useful next step.',
  'When the question is unclear, ask one focused clarification rather than presenting a long list.',
  'For exam preparation, teach and coach. Never complete a live exam, TMA or graded assignment for the candidate.',
  'Never ask for passwords, PINs, card numbers or payment credentials.',
  'When the candidate explicitly asks for a human, you may give the approved WhatsApp route. Do not offer WhatsApp merely because an AI request failed.',
  '',
  'OFFICIAL CIBN STARTING KNOWLEDGE:',
  OFFICIAL_KNOWLEDGE,
  '',
  'INSTITUTE GPT / CIBN BOT SERVICE KNOWLEDGE:',
  SERVICE_KNOWLEDGE,
  '',
  'PROVISIONAL OWNER-SUPPLIED DEPLOYMENT EVIDENCE:',
  PROVISIONAL_OWNER_EVIDENCE,
  '',
  'Never claim that service pricing or provisional deployment evidence is an official CIBN policy.'
].join('\n');

function withTimeout(ms = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function cleanText(raw) {
  return String(raw || '').replace(/\*\*/g, '').replace(/^#+\s*/gm, '').trim();
}

function extractGroundingSources(data) {
  const chunks = data && data.candidates && data.candidates[0]
    && data.candidates[0].groundingMetadata
    && Array.isArray(data.candidates[0].groundingMetadata.groundingChunks)
    ? data.candidates[0].groundingMetadata.groundingChunks
    : [];
  const seen = new Set();
  return chunks.map(chunk => chunk && chunk.web ? {
    title: String(chunk.web.title || 'Web source').slice(0, 300),
    url: chunk.web.uri || null,
    source_type: 'google_search',
    authority: /cibng\.org/i.test(String(chunk.web.uri || '')) ? 'official_cibn' : 'web'
  } : null).filter(item => item && item.url && !seen.has(item.url) && seen.add(item.url));
}

function fallbackAnswer(message) {
  const q = String(message || '').toLowerCase();

  if (/\b(6|six)\b.*\bcours|mf301|mf302|mf303|mf401|mf402|mf403|mf404/.test(q)) {
    return [
      'The current CIBN MCP new-syllabus structure has six courses across two stages:',
      'Microfinance I: MF301, MF302 and MF303.',
      'Microfinance II: MF401 and MF402, plus one elective — MF403 Digital Finance or MF404 SME Management and Development.',
      'For the latest official details, CIBN remains the authority.'
    ].join('\n');
  }

  if (/exam fee|\bfee\b|how much.*exam|cost.*exam/.test(q)) {
    return 'CIBN currently lists the MCP examination fee for six subjects as ₦32,500. That is the CIBN exam fee; CIBN BOT service prices are separate.';
  }

  if (/proctor|exam day|remote.*exam|online.*exam/.test(q)) {
    return 'CIBN states that its examinations are conducted through a Remote Online Proctoring Platform. I can also help you rehearse the room, camera, lighting, identification and backup-power checks before exam day.';
  }

  if (/package|pricing|price|coach|mock|concierge|resit/.test(q)) {
    return SERVICE_KNOWLEDGE;
  }

  if (/\b(human|person|agent|whatsapp)\b/.test(q)) {
    return 'Yes. For a human conversation, use the CIBN BOT WhatsApp line: 0704 648 1828.';
  }

  return null;
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
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 800, topP: 0.9 }
        })
      }
    );
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(`Gemini returned ${response.status}`);
      error.status = response.status;
      throw error;
    }
    const text = cleanText(
      data && data.candidates && data.candidates[0] && data.candidates[0].content
        && Array.isArray(data.candidates[0].content.parts)
        ? data.candidates[0].content.parts.map(p => p.text || '').join('')
        : ''
    );
    if (!text) throw new Error('empty answer');
    return { text, sources: extractGroundingSources(data) };
  } finally {
    clear();
  }
}

function cors(req, res) {
  const origin = req.headers && req.headers.origin;
  const allowed = origin && ALLOWED_ORIGINS.includes(origin);
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return allowed;
}

async function cibnChat(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  const message = String(req.body && req.body.message || '').trim().slice(0, 3000);
  const course = String(req.body && req.body.course || '').trim().slice(0, 120);
  const mode = ['study', 'practice'].includes(req.body && req.body.mode) ? req.body.mode : 'study';
  if (!message) return res.status(400).json({ ok: false, error: 'message required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ ok: false, error: 'ABBA engine unavailable' });

  const promptText = [
    `COURSE FOCUS: ${course || 'general CIBN / MCP studies'}`,
    `MODE: ${mode}`,
    '',
    'Answer the candidate now. Use the official evidence supplied in your instructions and Google Search when a current source is needed.',
    '',
    `CANDIDATE QUESTION: ${message}`
  ].join('\n');

  let lastError = null;
  const models = [PRIMARY_MODEL, FALLBACK_MODEL, LAST_FALLBACK_MODEL];

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await geminiAttempt(model, apiKey, promptText, 10000);
        return res.status(200).json({
          ok: true,
          answer: result.text,
          mode,
          sources: result.sources
        });
      } catch (error) {
        lastError = error;
        const retryable = error.status === 429 || error.status === 503 || error.name === 'AbortError';
        if (retryable && attempt === 0) {
          await new Promise(resolve => setTimeout(resolve, 1600));
          continue;
        }
        break;
      }
    }
  }

  const fallback = fallbackAnswer(message);
  if (fallback) {
    return res.status(200).json({
      ok: true,
      answer: fallback,
      mode,
      sources: [{
        title: 'CIBN BOT fallback knowledge',
        url: 'https://www.cibng.org/micro-finance-certification-program-mcp/',
        source_type: 'fallback',
        authority: 'official_cibn'
      }]
    });
  }

  console.error('cibn-chat:', String(lastError && lastError.message || 'engine unavailable'));
  return res.status(503).json({
    ok: false,
    error: 'ABBA is temporarily at capacity. Please try again.',
    retryable: true
  });
}

module.exports = { cibnChat, fallbackAnswer };
