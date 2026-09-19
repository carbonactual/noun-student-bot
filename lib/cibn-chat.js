// CIBN BOT — ABBA intelligence endpoint.
// Source order: official CIBN > owner portal evidence > owner commercial configuration.
// Gemini Search is used for current/missing facts; it is not treated as a substitute
// for CIBN's own authoritative pages or portal.

const { contextForQuery, findInterest, conflicts, sameSession, publicationsFor, officialFee, OFFICIAL_EXAM_FEES } = require('./cibn-catalog');
const { queueHumanAbba } = require('./human-abba');
const { safeSessionId, ensureCibnSession, recordCibnEvent, getCibnContext, compactContext } = require('./cibn-continuity');

const ALLOWED_ORIGINS = (process.env.CIBN_CHAT_ORIGINS ||
  'https://mcp-bot-eight.vercel.app,https://mcp-bot-abduhabu99-9693s-projects.vercel.app')
  .split(',')
  .map(x => x.trim())
  .filter(Boolean);

const PRIMARY_MODEL = process.env.CIBN_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const FALLBACK_MODEL = process.env.CIBN_GEMINI_FALLBACK_MODEL || process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.7-flash';

const OFFICIAL_KNOWLEDGE = [
  'CIBN MCP is a two-stage programme leading to the Microfinance Certificate.',
  'Microfinance I: MF301 The Evolution Management and Regulation of Microfinancing; MF302 Financial Analysis and Performance Monitoring in Microfinance Institutions; MF303 Product Development and Marketing Management.',
  'Microfinance II: MF401 Risk Management and Internal Control in Microfinance Institutions; MF402 Ethics and Corporate Governance; MF403 Digital Finance in Microfinance Institution (elective); MF404 Small and Medium Enterprises Management and Development (elective).',
  'CIBN current MCP exam fees: 1 subject ₦8,750; 2 ₦13,500; 3 ₦18,250; 4 ₦23,000; 5 ₦27,750; 6 ₦32,500.',
  'CIBN says examinations are conducted via a Remote Online Proctoring Platform.',
  'CIBN says the Institute uses four annual examination diets from 2026: February, April, July and October.',
  'The CIBN October 2026 timetable is the controlling source for specific paper dates, durations and session combinations. Its rule is that candidates cannot combine courses exceeding three hours at a particular session.',
  'The October 2026 MCP timetable shows MF301 + MF302 Tuesday morning, MF303 + MF402 Tuesday afternoon, MF401 + MF403 Wednesday morning, and MF404 Wednesday afternoon. Each listed MCP paper is 1.5 hours, so each two-paper session is within the 3-hour cap; MF403 and MF404 are the alternative elective branches.',
  'CIBN provides examiner reports containing questions, suggested solutions and examiners’ comments; candidates access their copies through the CIBN portal.',
  'CIBN provides a Book Shop / Book Search, Downloads, Digital Library, Examination Guidelines, Examination Rules, Examination Timetable and an Exemption Application Portal.',
  'CIBN Certificate in Banking has three stages (CIB I, II and III). The current public portal lists a ₦2,500 examination registration fee and ₦2,000 per course for the nine CIB courses.',
  'CIBN’s current certification ecosystem also includes ACIB examinations, certification programmes, exemptions, Agency Banking, professional e-payment, specialist banking/finance tracks and its resource hub.'
].join('\n');

const SERVICE_KNOWLEDGE = [
  'Institute GPT / CIBN BOT commercial services: Level One ₦22,500 for the first three MCP courses; Pass Package ₦36,000 for all six; Coaching ₦5,000/course; Mock Season ₦15,000 full diet or ₦3,500 one course; Registration & Materials Concierge ₦5,000; Exam-Day Command ₦19,250; Rescue Resit ₦6,750/course; B2B staff bundle ₦25,000/staff with 20% off for 5+.',
  'These are CIBN BOT / Institute GPT service prices. They are not CIBN institutional fees.',
  'Do not call the Pass Package a CIBN fee. Candidates still pay CIBN institutional fees directly to CIBN.'
].join('\n');

const PROVISIONAL_OWNER_EVIDENCE = [
  'Owner-supplied deployment evidence says the October 2026 registration closing date is Wednesday 23 September 2026.',
  'Treat that deadline as owner/portal evidence until a current official CIBN notice confirms it.'
].join('\n');

const SYSTEM_PROMPT = [
  'You are ABBA, the intelligence inside CIBN BOT, an Institute GPT service for the CIBN learner and professional journey.',
  'CIBN BOT is not MCP-only. Understand the whole journey: not-yet-registered prospects, Student Members, candidates choosing an ACIB/CIB/MCP/certification route, people mid-programme, exemption cases, candidates preparing for a diet, resitters, and professionals exploring a field.',
  'Start from the person’s stage, programme, course mix and pace. Ask one useful clarification when that context is needed, but do not turn the chat into a long form.',
  'Answer the actual question first. Do not merely route people to WhatsApp. Human support is a separate escalation path for matters that genuinely require a person.',
  'Use official CIBN evidence first. When a current fact is missing, stale or changing, use Google Search grounding and prefer CIBN pages. Clearly label owner portal observations and commercial pricing.',
  'Never invent dates, fees, eligibility, portal actions, exemption rules, proctoring vendor rules, refund rules or regulatory requirements.',
  'When the candidate asks about a course combination, check the October timetable/session rule. Same session does NOT automatically mean clash: CIBN permits combinations up to a 3-hour total at a session. Only call it a clash when the selected durations exceed that cap or the official portal explicitly rejects the combination.',
  'For handouts/publications: provide exact title and observed portal price when available; explain that CIBN’s publication viewer carries a reproduction restriction. Teach and summarize; do not reproduce paid copyrighted material verbatim.',
  'For CIBN portal actions: explain what the candidate should do, but never claim you have submitted, paid, changed or completed a CIBN transaction unless a connected capability returned a confirmed result.',
  'For exam preparation: teach, quiz and coach. Never complete a live exam, TMA or graded assignment for the candidate.',
  'Never ask for passwords, PINs, OTPs, card numbers or bank credentials.',
  'If the candidate explicitly asks for a human, provide the approved WhatsApp route. Do not use WhatsApp as the failure fallback for AI.',
  '',
  'OFFICIAL CIBN KNOWLEDGE:',
  OFFICIAL_KNOWLEDGE,
  '',
  'INSTITUTE GPT / CIBN BOT SERVICE KNOWLEDGE:',
  SERVICE_KNOWLEDGE,
  '',
  'OWNER-SUPPLIED DEPLOYMENT EVIDENCE:',
  PROVISIONAL_OWNER_EVIDENCE
].join('\n');

function withTimeout(ms = 6500) {
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

function feeAnswer(message) {
  const q = String(message || '').toLowerCase();
  const aliases = [
    ['acib diploma', 'ACIB Diploma'],
    ['diploma', 'ACIB Diploma'],
    ['intermediate', 'ACIB Intermediate Professional'],
    ['chartered banker', 'ACIB Chartered Banker'],
    ['microfinance', 'Microfinance Certification Programme'],
    ['mcp', 'Microfinance Certification Programme'],
    ['agency banking', 'Agency Banking Programme'],
    ['e-payment associate', 'Certified E-Payments Associate (CePA)'],
    ['cepa', 'Certified E-Payments Associate (CePA)'],
    ['e-payment professional', 'Certified E-Payments Professional (CePP)'],
    ['cepp', 'Certified E-Payments Professional (CePP)'],
    ['certification programme', 'Certification Programme'],
    ['fintech foundation', 'Fintech Foundation'],
    ['fintech intermediate', 'Fintech Intermediate'],
    ['fintech professional', 'Fintech Professional']
  ];
  const hit = aliases.find(([needle]) => q.includes(needle));
  if (!hit) return null;
  const rows = OFFICIAL_EXAM_FEES[hit[1]];
  if (!rows) return null;
  const count = q.match(/\b([1-9]|10)\b/);
  if (count) {
    const n = Number(count[1]);
    const amount = officialFee(hit[1], n);
    if (amount) return hit[1] + ': ' + n + ' course' + (n === 1 ? '' : 's') + ' = ₦' + amount.toLocaleString() + '. This is the current CIBN published examination fee.';
  }
  return hit[1] + ' current CIBN published exam fees: ' + rows.map((amount, i) => (i + 1) + ': ₦' + amount.toLocaleString()).join(' · ');
}

function timetableAnswer(message) {
  const q = String(message || '').toLowerCase();
  const codes = String(message || '').toUpperCase().match(/\b(?:60\d|70\d|80\d|MF30\d|MF40\d|EP\d{3}|CAB\d{3}|CNB\d{3}|CPS\d{3}|CLPD\d{3}|CFDIS\d{3}|CBO\d{3}|CDB\d{3}|CRC\d{3}|CSB\d{3})\b/g) || [];
  const unique = [...new Set(codes)];
  if (!(/clash|conflict|same time|timetable|schedule|combine|combination/i.test(q))) return null;
  if (unique.length) {
    const clashes = conflicts(unique);
    const same = sameSession(unique);
    if (clashes.length) {
      return clashes.map(group => 'Clash: ' + group.courses.map(x => x.code + ' ' + x.name).join(' + ') + ' — ' + group.slot.replace('|', ' ') + '. Total duration ' + group.totalDurationMinutes + ' minutes exceeds CIBN’s 3-hour session cap.').join('\n');
    }
    if (same.length) {
      return same.map(group => {
        const label = group.withinThreeHourCap ? 'same session, but within the 3-hour cap' : 'same session and needs checking';
        return label + ': ' + group.courses.map(x => x.code + ' (' + x.durationMinutes + ' min)').join(' + ') + ' — ' + group.slot.replace('|', ' ') + '.';
      }).join('\n');
    }
    return 'I do not see a same-session conflict among the course codes you supplied in the current CIBN BOT catalog.';
  }
  return [
    'For the October 2026 timetable, CIBN’s rule is that candidates cannot combine courses exceeding 3 hours at a particular session.',
    'MCP: Tue Oct 6 morning MF301 + MF302 (1.5h each); Tue Oct 6 afternoon MF303 + MF402 (1.5h each); Wed Oct 7 morning MF401 + MF403 (1.5h each); Wed Oct 7 afternoon MF404.',
    'So the paired MCP papers above are not automatically clashes simply because they share a session.'
  ].join('\n');
}

function fallbackAnswer(message) {
  const q = String(message || '').toLowerCase();
  const fee = feeAnswer(message);
  if (fee && /fee|price|cost|amount|pay|registration/i.test(q)) return fee;

  const timetable = timetableAnswer(message);
  if (timetable) return timetable;

  if (/\b(6|six)\b.*\bcours|mf301|mf302|mf303|mf401|mf402|mf403|mf404/.test(q)) {
    return [
      'The current CIBN MCP route is two stages: three Microfinance I courses plus two mandatory Microfinance II courses and one elective.',
      'Microfinance I: MF301, MF302, MF303.',
      'Microfinance II: MF401, MF402, plus either MF403 (Digital Finance, elective) or MF404 (SME Management and Development, elective).',
      'For October 2026, the published timetable shows MF401 + MF403 in the Wednesday morning session and MF404 in the Wednesday afternoon session. Confirm the elective actually selected in your CIBN portal before payment.'
    ].join('\n');
  }

  if (/\b(field|area|interest|speciali[sz]e|work in)\b|operations|credit|audit|risk|compliance|digital|agency|treasury|sme|agriculture|hr|public sector|non.?interest|deposit insurance|customer service|sustainable/i.test(q)) {
    const domains = findInterest(message);
    if (domains.length) {
      return domains.map(x => x.label + ': ' + x.courseCodes.join(', ') + '.').join('\n') +
        '\nTell me your current role or area and ABBA can narrow this to a practical CIBN route.';
    }
    return 'ABBA can map Operations, Credit/Lending, Audit, Risk, Compliance/Regulation, Digital/Fintech, Agency Banking, Treasury/Global Markets, SME, Agriculture/Rural Banking, Human Resources, Public Sector Finance, Non-Interest Banking, Deposit Insurance/Central Banking, Customer Service and Sustainable Banking to relevant CIBN courses.';
  }

  if (/handout|publication|study pack|syllabus|examiner|mcp manual|materials|book|download/i.test(q)) {
    const rows = publicationsFor(message);
    if (rows.length) {
      return rows.map(x => x.title + ' — observed portal price ₦' + x.priceNGN.toLocaleString()).join('\n') +
        '\nPrices above are portal observations from the owner’s September 17, 2026 evidence; confirm the current CIBN Book Shop listing before purchase.';
    }
    return 'CIBN has a Book Shop / Book Search, Downloads and Digital Library. I can find a publication by course code or title and return the observed portal price when the catalog contains it.';
  }

  if (/exemption|exempt|failed/i.test(q)) {
    return [
      'The owner portal evidence contains three important boundaries: a subject attempted and failed cannot be exempted; exemption processing is time-sensitive before the last examination paper; and the displayed evidence upload was one PDF not larger than 2MB.',
      'For a definitive exemption decision, ABBA should verify the current CIBN exemption policy and portal result for the candidate.'
    ].join('\n');
  }

  if (/mcp|microfinance|not registered|student member|register|which course|what should i take|where do i start/i.test(q)) {
    return [
      'Start with your stage: not yet a CIBN student member, already a Student Member, already enrolled on a programme, preparing for the next diet, or resitting a paper.',
      'Then tell ABBA the area you work in (for example operations, credit, audit, risk, compliance, digital, agency or SME). I can map that to the CIBN route and the next useful step.',
      'For MCP specifically, the current programme is two stages and the October diet is the immediate campaign window.'
    ].join('\n');
  }

  if (/proctor|exam day|remote.*exam|online.*exam|network|internet/i.test(q)) {
    return [
      'CIBN currently states that examinations are conducted via a Remote Online Proctoring Platform.',
      'ABBA can help you rehearse your device, camera, room and connectivity readiness, but it will not invent vendor-specific outage, disconnect, refund or misconduct thresholds that are not verified in CIBN’s current guidance.'
    ].join('\n');
  }

  if (/package|pricing|coach|mock|concierge|resit|b2b/i.test(q)) return SERVICE_KNOWLEDGE;

  if (/\b(human|person|whatsapp)\b/.test(q)) {
    return 'For a human conversation, use the CIBN BOT support line: 0704 648 1828.';
  }

  return [
    'ABBA is ready to work through the CIBN journey with you — not just MCP.',
    'Ask about a programme, course, timetable, fee, exemption, handout, exam preparation, your professional field, or what to do next.',
    'For a precise answer, include the course code or programme name when you have it.'
  ].join('\n');
}

async function geminiAttempt(model, apiKey, promptText, timeoutMs) {
  const { signal, clear } = withTimeout(timeoutMs);
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent',
      {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 700, topP: 0.9 }
        })
      }
    );
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error('Gemini returned ' + response.status);
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

function setCors(req, res) {
  const origin = req.headers && req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function cibnChat(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  const action = String(req.body && req.body.action || '').trim().toLowerCase();
  const channel = ['web', 'whatsapp', 'api'].includes(String(req.body && req.body.channel || '').toLowerCase())
    ? String(req.body.channel).toLowerCase()
    : 'web';
  const requestedSessionId = String(req.body && req.body.session_id || '').trim();

  if (action === 'resume') {
    const sessionId = safeSessionId(requestedSessionId);
    if (!sessionId) return res.status(400).json({ ok: false, error: 'valid session_id required' });
    try {
      await ensureCibnSession({ sessionId, channel });
      const events = await getCibnContext(sessionId);
      return res.status(200).json({
        ok: true,
        action: 'resume',
        session_id: sessionId,
        continuity: { events: compactContext(events), event_count: events.length }
      });
    } catch (error) {
      console.error('cibn-resume:', String(error && error.message || error));
      return res.status(503).json({ ok: false, action: 'resume', error: 'Session continuity is temporarily unavailable.' });
    }
  }

  const message = String(req.body && req.body.message || '').trim().slice(0, 3000);
  const course = String(req.body && req.body.course || '').trim().slice(0, 120);
  const mode = ['study', 'practice', 'service'].includes(req.body && req.body.mode) ? req.body.mode : 'study';
  if (!message) return res.status(400).json({ ok: false, error: 'message required' });

  let sessionId;
  try {
    sessionId = await ensureCibnSession({
      sessionId: requestedSessionId,
      channel,
      phone: req.body && req.body.phone,
      service: req.body && req.body.service
    });
  } catch (error) {
    console.error('cibn-session:', String(error && error.message || error));
    return res.status(503).json({ ok: false, error: 'Session continuity is temporarily unavailable.' });
  }

  if (mode === 'service') {
    try {
      const handoff = await queueHumanAbba({
        message,
        name: req.body && req.body.name,
        phone: req.body && req.body.phone,
        email: req.body && req.body.email,
        stage: req.body && req.body.stage,
        area: req.body && req.body.area,
        course,
        sessionId,
        channel,
        reason: req.body && req.body.reason,
        service: req.body && req.body.service
      });
      return res.status(200).json({
        ok: true,
        mode: 'service',
        answer: 'Your service request has been accepted by ABBA and queued for the human ABBA service team. Continue through the service handoff below.',
        handoff,
        session_id: handoff.sessionId || sessionId,
        continuity: { state: 'service_request_accepted' }
      });
    } catch (error) {
      console.error('cibn-human-handoff:', String(error && error.message || error));
      return res.status(503).json({
        ok: false,
        mode: 'service',
        error: 'The service queue is temporarily unavailable. Please try again shortly.'
      });
    }
  }

  const contextEvents = await getCibnContext(sessionId).catch(error => {
    console.error('cibn-context-read:', String(error && error.message || error));
    return [];
  });
  const context = compactContext(contextEvents);
  try {
    await recordCibnEvent({
      sessionId,
      eventType: 'cibn.conversation.message',
      channel,
      actorRef: 'candidate',
      payload: { mode, question: message, course: course || null }
    });
  } catch (error) {
    console.error('cibn-context-write:', String(error && error.message || error));
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const answer = fallbackAnswer(message);
    await recordCibnEvent({
      sessionId,
      eventType: 'cibn.conversation.answer',
      channel,
      actorRef: 'abba',
      payload: { mode, question: message, answer, course: course || null, degraded: true }
    }).catch(error => console.error('cibn-context-write:', String(error && error.message || error)));
    return res.status(200).json({
      ok: true,
      answer,
      mode,
      session_id: sessionId,
      continuity: { event_count: contextEvents.length + 2 },
      sources: [{title:'CIBN BOT local catalog fallback',url:'https://www.cibng.org/micro-finance-certification-program-mcp/',source_type:'catalog',authority:'official_cibn'}]
    });
  }

  const screenshotContext = contextForQuery(message, course);
  const promptText = [
    'COURSE FOCUS: ' + (course || 'general CIBN / professional studies'),
    'MODE: ' + mode,
    '',
    'Answer the candidate now. Use the official evidence supplied in your instructions and Google Search when a current source is needed.',
    '',
    'CATALOG / PORTAL CONTEXT:',
    screenshotContext.length ? JSON.stringify(screenshotContext).slice(0, 17000) : 'No specific catalog context matched.',
    '',
    'RECENT CANONICAL SESSION CONTEXT:',
    context.length ? JSON.stringify(context).slice(0, 9000) : 'No previous session events.',
    '',
    'CANDIDATE QUESTION: ' + message
  ].join('\n');

  let lastError = null;
  const attempts = [
    {model:PRIMARY_MODEL, timeout:6200},
    {model:FALLBACK_MODEL, timeout:2400}
  ];

  for (const item of attempts) {
    try {
      const result = await geminiAttempt(item.model, apiKey, promptText, item.timeout);
      await recordCibnEvent({
        sessionId,
        eventType: 'cibn.conversation.answer',
        channel,
        actorRef: 'abba',
        payload: { mode, question: message, answer: result.text, course: course || null, degraded: false }
      });
      return res.status(200).json({ok:true,answer:result.text,mode,sources:result.sources,session_id:sessionId,continuity:{event_count:contextEvents.length+2}});
    } catch (error) {
      lastError = error;
      if (!(error.status === 429 || error.status === 503 || error.name === 'AbortError')) break;
    }
  }

  // AI failure is never a WhatsApp redirect. The candidate still gets a useful deterministic answer.
  console.error('cibn-chat:', String(lastError && lastError.message || 'engine unavailable'));
  const answer = fallbackAnswer(message);
  await recordCibnEvent({
    sessionId,
    eventType: 'cibn.conversation.answer',
    channel,
    actorRef: 'abba',
    payload: { mode, question: message, answer, course: course || null, degraded: true }
  }).catch(error => console.error('cibn-context-write:', String(error && error.message || error)));
  return res.status(200).json({
    ok: true,
    answer,
    mode,
    session_id: sessionId,
    continuity: { event_count: contextEvents.length + 2 },
    degraded: true,
    sources: [{
      title: 'CIBN BOT local evidence fallback',
      url: 'https://www.cibng.org/micro-finance-certification-program-mcp/',
      source_type: 'fallback',
      authority: 'official_cibn'
    }]
  });
}

module.exports = { cibnChat, fallbackAnswer, timetableAnswer, feeAnswer };