const { db, tenantId } = require('../lib/knowledge');
const { buildOnboardingState, normalizeStudentContext } = require('../lib/student-onboarding-context');
const SECRET = process.env.WEBHOOK_SECRET;
const cleanPhone = v => String(v || '').replace(/\D/g, '');

module.exports = async (req, res) => {
  if (!['GET','POST'].includes(req.method)) return res.status(405).json({ error: 'GET or POST only' });
  if (SECRET && req.headers['x-webhook-secret'] !== SECRET) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const phone = cleanPhone(req.query?.phone || req.body?.phone);
    if (!phone) return res.status(400).json({ error: 'phone required' });
    const tid = await tenantId();
    const { data: student, error } = await db.from('students').select('*').eq('tenant_id', tid).eq('phone', phone).maybeSingle();
    if (error) throw error;
    if (!student) return res.status(404).json({ ok:false, error:'Student profile not found' });

    if (req.method === 'POST') {
      const incoming = normalizeStudentContext(req.body || {});
      const patch = { ...incoming, updated_at: new Date().toISOString(), onboarding_source: 'noun-bot' };
      delete patch.full_name;
      const { data: updated, error: updateError } = await db.from('students').update(patch).eq('tenant_id', tid).eq('phone', phone).select('*').single();
      if (updateError) throw updateError;
      const context = normalizeStudentContext(updated);
      return res.status(200).json({ ok:true, context, onboarding: buildOnboardingState(context) });
    }

    const context = normalizeStudentContext(student);
    const onboarding = buildOnboardingState(context);
    return res.status(200).json({ ok:true, context, onboarding });
  } catch (e) {
    console.error('student-context:', e);
    return res.status(503).json({ ok:false, error:'Student context unavailable' });
  }
};
