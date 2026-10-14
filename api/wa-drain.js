// Daily automation tick for the WhatsApp Cloud API path — CREDIT-FREE rails.
// Auth: x-webhook-secret header, ?secret=, or Authorization: Bearer CRON_SECRET
// (Vercel cron sends the Bearer header automatically when CRON_SECRET is set).
//
// Pipeline (when ?pipeline=1):
//   1. deadline-dispatch  — generate student deadline alerts into the queue (no ABBA credits)
//   2. campaign-dispatch   — move due campaign messages into the queue (no ABBA credits)
//   3. drainOutbound        — deliver the queue through the official WhatsApp Cloud API
// Everything here runs on pure infrastructure: Vercel cron + Supabase + Meta Graph API.
// Zero Superagent/LLM credits consumed.
const { drainOutbound, isConfigured } = require('../lib/wa-cloud');
const automationHandler = require('./automation');
module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const q = (req.query || {});
  const provided = req.headers['x-webhook-secret'] || q.secret || String(req.headers.authorization || '').replace('Bearer ', '');
  const ok = (process.env.WEBHOOK_SECRET && provided === process.env.WEBHOOK_SECRET)
    || (process.env.CRON_SECRET && provided === process.env.CRON_SECRET);
  if (!ok) return res.status(401).json({ error: 'Unauthorized' });

  // 1+2: run the dispatch generators (works even before WhatsApp Cloud is configured,
  // so alerts/campaigns accumulate in the queue and deliver the moment the rail activates).
  let dispatched = { deadline: null, campaign: null };
  if (q.pipeline === '1') {
    const shim = () => {
      let payload = null;
      const r = { status() { return r; }, json(p) { payload = p; return r; } };
      return { req: { method: 'POST', body: { action: '' }, headers: { 'x-webhook-secret': process.env.WEBHOOK_SECRET || '' } }, res: r, get() { return payload; } };
    };
    try {
      for (const action of ['deadline-dispatch', 'campaign-dispatch']) {
        const s = shim();
        s.req.body.action = action;
        await automationHandler(s.req, s.res);
        dispatched[action === 'deadline-dispatch' ? 'deadline' : 'campaign'] = s.get();
      }
    } catch (e) { console.error('pipeline dispatch:', e.message); }
  }

  if (!isConfigured()) return res.status(200).json({
    ok: true,
    configured: false,
    dispatched,
    note: 'Queues are being filled credit-free. Delivery starts once WA_CLOUD_TOKEN / WA_PHONE_NUMBER_ID are set (WhatsApp Cloud API activation).'
  });
  try {
    const limit = Math.min(Number(q.limit) || 25, 50);
    const r = await drainOutbound(limit);
    return res.status(200).json({ ok: true, configured: true, dispatched, ...r });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
