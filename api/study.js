const { createClient } = require('@supabase/supabase-js');
const { retrieveCourseEvidence, buildGroundingContext } = require('../lib/study-retrieval');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = GEMINI_API_KEY
  ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`
  : null;

async function getStudent(phone) {
  if (!phone) return null;
  const { data, error } = await supabase.from('students').select('phone,level,courses,stage').eq('phone', phone).maybeSingle();
  if (error) throw error;
  return data;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).json({ ok: true, service: 'noun-study-readonly' });
  try {
    const { phone, question } = req.body || {};
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const cleanQuestion = String(question || '').trim().slice(0, 2000);
    if (!cleanPhone || !cleanQuestion) return res.status(400).json({ ok: false, error: 'phone and question are required' });

    const student = await getStudent(cleanPhone);
    const courses = student?.courses || [];
    const evidence = await retrieveCourseEvidence({ supabase, query: cleanQuestion, courses, limit: 4 });
    if (!evidence.length) {
      return res.status(200).json({ ok: true, grounded: false, answer: 'The available course material does not contain enough information to answer that question.', sources: [] });
    }
    if (!GEMINI_URL) return res.status(503).json({ ok: false, error: 'STUDY_MODEL_NOT_CONFIGURED' });

    const prompt = `You are a read-only NOUN study assistant. Answer the student's question using only the supplied course evidence. Do not invent facts or imply access to live university records. Do not perform registrations, submissions, payments, or other administrative actions. If the evidence is insufficient, explicitly say so. Keep the response concise and WhatsApp-friendly.\n\nEVIDENCE:\n${buildGroundingContext(evidence)}\n\nQUESTION:\n${cleanQuestion}`;
    const response = await fetch(GEMINI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
    const data = await response.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!answer) throw new Error('No study answer returned');

    return res.status(200).json({
      ok: true,
      grounded: true,
      answer,
      sources: evidence.map(({ id, course_code, module_title }) => ({ id, course_code, module_title })),
    });
  } catch (error) {
    console.error('Study endpoint error:', error);
    return res.status(500).json({ ok: false, error: 'STUDY_REQUEST_FAILED' });
  }
};
