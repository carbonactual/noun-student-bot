const { orchestrateNounRequest } = require('../lib/noun-orchestrator');

const SECRET = process.env.WEBHOOK_SECRET;

function allowed(req) {
  return !SECRET || req.headers?.['x-webhook-secret'] === SECRET;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!allowed(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const result = await orchestrateNounRequest({
      phone: req.body?.phone,
      message: req.body?.message || req.body?.question,
      course: req.body?.course,
      channel: req.body?.channel || 'web',
      requestedCapability: req.body?.capability,
      context: req.body?.context,
      authorization: req.body?.authorization,
      requestId: req.body?.requestId
    });
    const code = result.status === 'blocked' ? 403 : result.status === 'unavailable' ? 503 : 200;
    return res.status(code).json(result);
  } catch (error) {
    const message = /required/i.test(String(error.message || '')) ? String(error.message) : 'NOUN orchestration request failed';
    return res.status(400).json({ error: message });
  }
};
