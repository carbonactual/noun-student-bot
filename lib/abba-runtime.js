const { buildAbbaResult } = require('./abba-contract');

function withTimeout(ms = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

// ---------------------------------------------------------------------------
// Gemini engine — student-facing ABBA intelligence when no external runtime is
// configured. Uses GEMINI_API_KEY (Google AI Studio). Free tier; model pinned.
// ---------------------------------------------------------------------------

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const GEMINI_SYSTEM_PROMPT = [
  'You are ABBA, the study companion inside NOUN BOT — a product of Institute GPT.',
  'You help students of the National Open University of Nigeria learn, revise and stay ahead.',
  'Voice: warm, precise, encouraging. Like a patient senior colleague, not a corporate bot.',
  'Format: short paragraphs or a compact list. Max ~180 words. End with one helpful next step.',
  '',
  'HARD RULES:',
  '1. NEVER write, complete or substantially draft a student\'s TMA, assignment or exam answer for them. If asked, decline gently and coach instead: explain the concept, outline how to structure their own answer, and offer to review their approach. You teach; they write.',
  '2. Use the VERIFIED FACTS provided in the prompt when they are relevant. Never invent NOUN procedures, dates, fees or portal details. If you are not sure about a NOUN-specific fact, say so and point them to the NOUN portal or their study centre.',
  '3. Never ask for passwords, pins or personal financial details. Study topics only — if the question is far outside studying, redirect kindly to their studies or to WhatsApp support.',
  '4. In practice mode, quiz the student: ask a focused question or two about their topic, then react to their attempt with gentle corrections and a model answer AFTER they try.',
  '5. Never claim to be human. You are ABBA, an AI companion.'
].join('\n');

function geminiUserPrompt(request) {
  const question = String(request.message || request.utterance || '').slice(0, 2000);
  const course = String(request.course || '').slice(0, 80);
  const mode = request.context && request.context.learningMode ? String(request.context.learningMode) : 'study';
  const facts = Array.isArray(request.evidence && request.evidence.normalized)
    ? request.evidence.normalized.slice(0, 8).map(f => `- ${f.title || f.claim || ''}: ${String(f.claim || f.content || f.summary || '').slice(0, 300)}`).filter(x => x.length > 4)
    : [];
  const studentCtx = request.context && request.context.student
    ? String(request.context.student).slice(0, 1500)
    : '';

  return [
    `COURSE: ${course || 'not specified'}`,
    `MODE: ${mode}`,
    '',
    `VERIFIED FACTS (knowledge base):\n${facts.length ? facts.join('\n') : 'none — rely on general academic knowledge and be honest about NOUN-specific uncertainty'}`,
    '',
    `STUDENT CONTEXT:\n${studentCtx || 'none'}`,
    '',
    `STUDENT QUESTION: ${question}`,
    '',
    'Answer the student now, following the hard rules.'
  ].join('\n');
}

async function invokeGemini(request, dependencies = {}) {
  const apiKey = dependencies.geminiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini engine unavailable: no GEMINI_API_KEY');

  const fetchImpl = dependencies.fetchImpl || global.fetch;
  if (typeof fetchImpl !== 'function') throw new Error('fetch unavailable');

  const { signal, clear } = withTimeout(Number(dependencies.timeoutMs || process.env.ABBA_TIMEOUT_MS || 15000));
  try {
    const response = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: GEMINI_SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: geminiUserPrompt(request) }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1024, topP: 0.9 }
        })
      }
    );
    if (!response.ok) throw new Error(`Gemini engine returned ${response.status}`);
    const data = await response.json().catch(() => null);
    const text = data && data.candidates && data.candidates[0] && data.candidates[0].content
      && Array.isArray(data.candidates[0].content.parts)
      ? data.candidates[0].content.parts.map(p => p.text || '').join('').trim()
      : '';
    if (!text) throw new Error('Gemini engine returned an empty answer');

    return buildAbbaResult({
      requestId: request.requestId,
      capability: request.capability,
      answer: text,
      evidence: Array.isArray(request.evidence && request.evidence.normalized) ? request.evidence.normalized : [],
      context: request.context || null,
      escalation: request.context && request.context.escalation ? request.context.escalation : null,
      status: 'complete'
    });
  } finally {
    clear();
  }
}

// ---------------------------------------------------------------------------
// Engine chain: configured ABBA runtime first, then Gemini, then fail upward
// (the orchestrator handles the unavailable state and WhatsApp escalation).
// ---------------------------------------------------------------------------

async function invokeAbba(request, dependencies = {}) {
  const fetchImpl = dependencies.fetchImpl || global.fetch;
  const runtimeUrl = dependencies.runtimeUrl || process.env.ABBA_RUNTIME_URL;
  const runtimeKey = dependencies.runtimeKey || process.env.ABBA_RUNTIME_KEY;

  if (runtimeUrl && typeof fetchImpl === 'function') {
    const { signal, clear } = withTimeout(Number(dependencies.timeoutMs || process.env.ABBA_TIMEOUT_MS || 15000));
    try {
      const response = await fetchImpl(runtimeUrl, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          ...(runtimeKey ? { Authorization: `Bearer ${runtimeKey}` } : {})
        },
        body: JSON.stringify(request)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(`ABBA runtime returned ${response.status}`);
      if (!data || typeof data !== 'object' || !data.answer) throw new Error('ABBA runtime returned an invalid result');
      return buildAbbaResult(data);
    } catch (runtimeError) {
      try {
        return await invokeGemini(request, dependencies);
      } catch (geminiError) {
        throw runtimeError;
      }
    } finally {
      clear();
    }
  }

  // No external runtime configured — Gemini is the engine.
  return invokeGemini(request, dependencies);
}

module.exports = { invokeAbba };
