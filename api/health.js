module.exports = async function handler(req, res) {
  const checks = {
    runtime: true,
    supabase_url: Boolean(process.env.SUPABASE_URL),
    supabase_service_role_key: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    webhook_secret: Boolean(process.env.WEBHOOK_SECRET),
    tenant: Boolean(process.env.DEFAULT_TENANT_SLUG || 'noun'),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    resend: Boolean(process.env.RESEND_API_KEY)
  };

  const required = ['supabase_url', 'supabase_service_role_key', 'webhook_secret'];
  const ready = required.every((key) => checks[key]);

  if (req.method === 'GET' && req.query?.check === 'gemini') {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ ok: false, service: 'noun-student-bot', test: 'gemini', configured: false, error: 'GEMINI_API_KEY missing' });
    }
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Reply with exactly: NOUN GEMINI OK' }] }] })
      });
      const d = await r.json();
      const candidates = Array.isArray(d?.candidates) ? d.candidates : [];
      const first = candidates[0] || {};
      const parts = Array.isArray(first?.content?.parts) ? first.content.parts : [];
      const answer = parts.map(p => p?.text || '').join('').trim();
      const ok = r.ok && answer.length > 0;
      return res.status(ok ? 200 : 502).json({
        ok,
        service: 'noun-student-bot',
        test: 'gemini',
        model: 'gemini-3.6-flash',
        configured: true,
        upstream_status: r.status,
        candidate_count: candidates.length,
        parts_count: parts.length,
        finish_reason: first?.finishReason || null,
        prompt_feedback: d?.promptFeedback ? Object.keys(d.promptFeedback) : [],
        response: answer.slice(0, 80)
      });
    } catch (e) {
      console.error('gemini smoke test:', e?.message || e);
      return res.status(502).json({ ok: false, service: 'noun-student-bot', test: 'gemini', configured: true, error: 'Gemini smoke test failed' });
    }
  }

  return res.status(ready ? 200 : 503).json({
    ok: ready,
    service: 'noun-student-bot',
    version: '2.0.5',
    environment: process.env.VERCEL_ENV || 'unknown',
    checks,
    timestamp: new Date().toISOString()
  });
};
