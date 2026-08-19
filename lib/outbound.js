function nextRetry(attempts, now = Date.now()) {
  const n = Number(attempts) || 0;
  if (n >= 5) return { status: 'failed', available_at: new Date(now).toISOString() };
  const delayMs = Math.min(60 * 60 * 1000, Math.pow(2, n) * 60 * 1000);
  return { status: 'queued', available_at: new Date(now + delayMs).toISOString() };
}

module.exports = { nextRetry };
