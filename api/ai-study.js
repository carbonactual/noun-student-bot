const { db, tenantId, searchKnowledge, buildGrounding } = require('../lib/knowledge');
const { normalizeMode } = require('../lib/learning-continuity');
const { orchestrateNounRequest } = require('../lib/noun-orchestrator');
const { cibnChat } = require('../lib/cibn-chat');
const { bearer, getUser } = require('../lib/auth');
const { cibnCatalogHandler } = require('../lib/cibn-catalog-api');

const SECRET = process.env.WEBHOOK_SECRET;

function safe(value, limit = 3500) { return String(value || '').slice(0, limit); }
const ALLOWED_MEDIA_MIME = new Set(['application/pdf','image/png','image/jpeg','image/webp','audio/mpeg','audio/wav','audio/ogg']);
function normalizeLearningMedia(body){
  const raw = body?.media;
  if (!raw || typeof raw !== 'object') return null;
  const mime = safe(raw.mime_type || raw.mimeType, 100).toLowerCase();
  const data = String(raw.data || '').replace(/\s+/g,'');
  if (!ALLOWED_MEDIA_MIME.has(mime) || !data) return null;
  if (data.length > 2200000) return null;
  return { mimeType: mime, data, name: safe(raw.name, 180) || null };
}
function normalizeNumericConfidence(value, fallback = 0.2) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return Math.max(0, Math.min(1, numeric));
  const label = String(value || '').trim().toLowerCase();
  const mapped = { official: 1, verified: 0.95, high: 0.9, medium: 0.65, low: 0.35, unverified: 0.1 }[label];
  return mapped ?? fallback;
}

async function startLearningSession(tid, phone, course, mode) {
  const { data, error } = await db.from('student_learning_sessions').insert({
    tenant_id: tid,
    student_phone: phone,
    course_code: course || null,
    mode,
    started_at: new Date().toISOString(),
    question_count: 0,
    metadata: { source: 'abba-orchestration' }
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

async function getLearningHistory(tid, phone, course, mode) {
  let query = db.from('student_study_questions')
    .select('question,answer_summary,mode,course_code,created_at')
    .eq('tenant_id', tid)
    .eq('student_phone', phone)
    .eq('mode', mode)
    .order('created_at', { ascending: false })
    .limit(6);
  if (course) query = query.eq('course_code', course);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).reverse().map(row => ({
    question: safe(row.question, 900),
    answer: safe(row.answer_summary, 1100),
    course_code: safe(row.course_code, 80) || null
  }));
}

async function persistStudyQuestion(tid, phone, course, mode, question, answer, confidence, sessionId) {
  const { data, error } = await db.from('student_study_questions').insert({
    tenant_id: tid,
    student_phone: phone,
    course_code: course || null,
    question,
    mode,
    status: 'answered',
    answer_summary: safe(answer, 1200),
    knowledge_confidence: normalizeNumericConfidence(confidence),
    answered_at: new Date().toISOString()
  }).select('id').single();
  if (error) throw error;
  if (sessionId) {
    await db.from('student_learning_sessions').update({
      ended_at: new Date().toISOString(),
      question_count: 1
    }).eq('id', sessionId).eq('tenant_id', tid);
  }
  return data.id;
}

async function knowledgeQuery(req, res) {
  const q = String(req.body?.query || '').trim();
  if (!q) return res.status(400).json({ error: 'query required' });
  const result = await searchKnowledge(q, { limit: 10 });
  return res.status(200).json({
    ok: true,
    query: q,
    confidence: result.confidence,
    grounding: buildGrounding(result),
    facts: result.facts.map(x => ({
      kind: x.kind,
      title: x.title || x.claim,
      authority_tier: x.authority_tier || x.source_tier,
      confidence: x.confidence || null,
      url: x.source_url || null,
      verification_status: x.verification_status || x.status || null
    }))
  });
}

module.exports = async (req, res) => {
  // Keep the public CIBN catalog route on the same serverless function to stay within
  // Vercel Hobby's function-count limit. The rewrite supplies ?cibn_catalog=1.
  if (req.query?.cibn_catalog === '1') return cibnCatalogHandler(req, res);

  // CORS preflight for the CIBN landing (cross-origin chat) — must precede the method gate.
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', process.env.CIBN_CHAT_ORIGIN || 'https://mcp-bot-eight.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  // CIBN BOT shares this deployment (Hobby plan caps function count) — branch by product flag.
  if (req.body && (req.body.product === 'cibn' || req.body.cibn === true)) return cibnChat(req, res);
  // Public chat endpoint: browser-facing by design; no shared-secret gate. Input is capped in safe().

  try {
    if (req.body?.query !== undefined && req.body?.question === undefined) {
      return await knowledgeQuery(req, res);
    }

    const token = bearer(req);
    if (!token) return res.status(401).json({ error: 'Sign in required' });
    const user = await getUser(token);
    const phone = String(user.user_metadata?.phone || '').replace(/\D/g, '');
    if (!phone) return res.status(400).json({ error: 'Account phone is missing' });
    const question = safe(req.body?.question);
    const sourceText = safe(req.body?.source_text, 18000);
    const learningMedia = normalizeLearningMedia(req.body);
    const mode = normalizeMode(req.body?.mode);
    const course = safe(req.body?.course, 80);
    if (!phone || !question) return res.status(400).json({ error: 'phone and question required' });

    const tid = await tenantId();
    const sessionId = await startLearningSession(tid, phone, course, mode);
    let learningHistory = [];
    try {
      learningHistory = await getLearningHistory(tid, phone, course, mode);
    } catch (historyError) {
      console.error('learning history retrieval:', historyError);
    }
    const result = await orchestrateNounRequest({
      phone,
      message: question,
      course,
      channel: req.body?.channel || 'web',
      requestedCapability: mode === 'practice' ? 'learning.practice' : 'learning.study',
      context: { learningMode: mode, sessionId, learningMaterial: sourceText || null, learningMedia, learningHistory }
    });

    const evidenceConfidences = (result.evidence || []).map(x => Number(x.confidence ?? x.score)).filter(Number.isFinite);
    const evidenceScore = evidenceConfidences.length ? Math.max(...evidenceConfidences) : null;
    const knowledgeConfidence = normalizeNumericConfidence(
      evidenceScore,
      result.evidence?.length ? 0.8 : 0.2
    );
    let questionId = null;
    if (result.status === 'complete' && result.answer) {
      try {
        questionId = await persistStudyQuestion(tid, phone, course, mode, question, result.answer, knowledgeConfidence, sessionId);
      } catch (persistError) {
        console.error('learning continuity persistence:', persistError);
      }
    }

    return res.status(result.status === 'unavailable' ? 503 : result.status === 'blocked' ? 403 : 200).json({
      ok: result.status === 'complete',
      answer: result.answer,
      confidence: knowledgeConfidence,
      sources: result.evidence,
      mode,
      continuity: { question_id: questionId, session_id: sessionId },
      abba: { request_id: result.requestId, capability: result.capability, status: result.status },
      boundaries: result.boundaries
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'AI study request failed' });
  }
};
