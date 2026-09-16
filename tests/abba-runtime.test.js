const test = require('node:test');
const assert = require('node:assert/strict');
const { invokeAbba } = require('../lib/abba-runtime');

test('ABBA runtime posts the canonical request envelope', async () => {
  let captured;
  const result = await invokeAbba({ requestId: 'r1', utterance: 'hello' }, {
    runtimeUrl: 'https://abba.example.test/orchestrate',
    runtimeKey: 'secret',
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return { ok: true, status: 200, json: async () => ({ requestId: 'r1', answer: 'Hello from ABBA' }) };
    }
  });
  assert.equal(result.answer, 'Hello from ABBA');
  assert.equal(captured.url, 'https://abba.example.test/orchestrate');
  assert.equal(captured.options.headers.Authorization, 'Bearer secret');
});

test('ABBA runtime fails closed when no runtime is configured', async () => {
  await assert.rejects(() => invokeAbba({ requestId: 'r2', utterance: 'hello' }, { runtimeUrl: '' }), /ABBA runtime unavailable/);
});
