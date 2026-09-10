const { db, tenantId } = require('../lib/knowledge');
const { buildSupportCase } = require('../lib/support-escalation');
const SECRET = process.env.WEBHOOK_SECRET;
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error:'POST only' });
  if (SECRET && req.headers['x-webhook-secret'] !== SECRET) return res.status(401).json({ error:'Unauthorized' });
  try {
    const body = req.body || {};
    const c = buildSupportCase(body);
    if (!c.student_phone || !c.description) return res.status(400).json({ error:'phone and description required' });
    const tid = await tenantId();
    const { data, error } = await db.from('student_support_cases').insert({ tenant_id:tid, ...c }).select('id,student_phone,category,description,course_code,urgency,status,created_at').single();
    if (error) throw error;
    return res.status(201).json({ ok:true, case:data, message:'Your request has been recorded for human follow-up.' });
  } catch (e) {
    console.error('support-case:', e);
    return res.status(503).json({ ok:false, error:'Support request could not be recorded' });
  }
};
