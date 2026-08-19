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
  return res.status(ready ? 200 : 503).json({
    ok: ready,
    service: 'noun-student-bot',
    version: '2.0.6',
    environment: process.env.VERCEL_ENV || 'unknown',
    checks,
    timestamp: new Date().toISOString()
  });
};
