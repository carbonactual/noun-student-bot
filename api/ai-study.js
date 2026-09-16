const { db, tenantId } = require('../lib/knowledge');
const { normalizeMode } = require('../lib/learning-continuity');
const { orchestrateNounRequest } = require('../lib/noun-orchestrator');

const SECRET = process.env.WEBHOOK_SECRET;

function safe(value, limit = 3500) { return String(value || '').slice(0, limit); }

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

async function persistStudyQuestion(tid, phone, course, mode, question, answer, confidence, sessionId) {
  const { data, error } = await db.from('student_study_questions').insert({
    tenant_id: tid,
    student_phone: phone,
    course_code: course || null,
    question,
    mode,
    status: 'answered',
    answer_summary: safe(answer, 1200),
    knowledge_confidence: confidence,
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

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (SECRET && req.headers['x-webhook-secret'] !== SECRET) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const phone = String(req.body?.phone || '').replace(/\D/g, '');
    const question = safe(req.body?.question);
    const mode = normalizeMode(req.body?.mode);
    const course = safe(req.body?.course, 80);
    if (!phone || !question) return res.status(400).json({ error: 'phone and question required' });

    const tid = await tenantId();
    const sessionId = await startLearningSession(tid, phone, course, mode);
    const result = await orchestrateNounRequest({
      phone,
      message: question,
      course,
      channel: req.body?.channel || 'web',
      requestedCapability: mode === 'practice' ? 'learning.practice' : 'learning.study',
      context: { learningMode: mode, sessionId }
    });

    const knowledgeConfidence = result.evidence?.length ? 'verified' : 'unknown';
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
