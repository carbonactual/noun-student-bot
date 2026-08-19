const test = require('node:test');
const assert = require('node:assert/strict');
const { nextRetry } = require('../lib/outbound');

test('failed outbound messages retry with bounded exponential backoff', () => {
  const now = Date.parse('2026-08-20T00:00:00.000Z');
  assert.deepEqual(nextRetry(1, now), {
    status: 'queued',
    available_at: '2026-08-20T00:02:00.000Z'
  });
  assert.deepEqual(nextRetry(4, now), {
    status: 'queued',
    available_at: '2026-08-20T00:16:00.000Z'
  });
  assert.equal(nextRetry(5, now).status, 'failed');
});
