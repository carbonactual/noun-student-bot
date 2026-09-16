const { buildAbbaResult } = require('./abba-contract');

function withTimeout(ms = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function invokeAbba(request, dependencies = {}) {
  const fetchImpl = dependencies.fetchImpl || global.fetch;
  const runtimeUrl = dependencies.runtimeUrl || process.env.ABBA_RUNTIME_URL;
  const runtimeKey = dependencies.runtimeKey || process.env.ABBA_RUNTIME_KEY;
  if (!runtimeUrl) throw new Error('ABBA runtime unavailable');
  if (typeof fetchImpl !== 'function') throw new Error('fetch unavailable');

  const { signal, clear } = withTimeout(Number(dependencies.timeoutMs || process.env.ABBA_TIMEOUT_MS || 15000));
  try {
    const response = await fetchImpl(runtimeUrl, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(runtimeKey ? { Authorization: `Bearer ${runtimeKey}` } : {})
      },
      body: JSON.stringify(request)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`ABBA runtime returned ${response.status}`);
    if (!data || typeof data !== 'object' || !data.answer) throw new Error('ABBA runtime returned an invalid result');
    return buildAbbaResult(data);
  } finally {
    clear();
  }
}

module.exports = { invokeAbba };
