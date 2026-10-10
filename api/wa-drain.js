// Cron-friendly queue drain for the WhatsApp Cloud API path.
// Auth: x-webhook-secret header, ?secret=, or Authorization: Bearer CRON_SECRET
// (Vercel cron sends the Bearer header automatically when CRON_SECRET is set).
const { drainOutbound, isConfigured } = require('../lib/wa-cloud');
module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const q = (req.query || {});
  const provided = req.headers['x-webhook-secret'] || q.secret || String(req.headers.authorization || '').replace('Bearer ', '');
  const ok = (process.env.WEBHOOK_SECRET && provided === process.env.WEBHOOK_SECRET)
    || (process.env.CRON_SECRET && provided === process.env.CRON_SECRET);
  if (!ok) return res.status(401).json({ error: 'Unauthorized' });
  if (!isConfigured()) return res.status(200).json({ ok: true, configured: false, note: 'WA_CLOUD_TOKEN / WA_PHONE_NUMBER_ID not set yet' });
  try {
    const limit = Math.min(Number(q.limit) || 25, 50);
    const r = await drainOutbound(limit);
    return res.status(200).json({ ok: true, configured: true, ...r });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
