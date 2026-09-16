const test = require('node:test');
const assert = require('node:assert/strict');
const { ABBA_PROTOCOL_VERSION, normalizeAbbaRequest, buildAbbaResult } = require('../lib/abba-contract');

test('ABBA request contract normalizes identity, channel and utterance', () => {
  const value = normalizeAbbaRequest({ phone: '+234 801 234 5678', message: 'Help me study', channel: 'web' });
  assert.equal(value.protocolVersion, ABBA_PROTOCOL_VERSION);
  assert.equal(value.identity.phone, '2348012345678');
  assert.equal(value.channel, 'web');
  assert.equal(value.utterance, 'Help me study');
});

test('ABBA result contract strips malformed collections', () => {
  const value = buildAbbaResult({ requestId: 'r1', answer: 'Done', actions: 'bad', evidence: null });
  assert.deepEqual(value.actions, []);
  assert.deepEqual(value.evidence, []);
  assert.equal(value.status, 'complete');
});
