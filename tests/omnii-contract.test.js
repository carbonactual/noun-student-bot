const test = require('node:test');
const assert = require('node:assert/strict');
const { toOmniiIntent, toOmniiEvidence, guardAction } = require('../lib/omnii-contract');

test('NOUN request becomes OMNII intent without implicit authority', () => {
  const intent = toOmniiIntent({ studentId: 'student:1', request: 'exam checklist' });
  assert.equal(intent.authorityRef, null);
  assert.equal(intent.product, 'NOUN_STUDENT_BOT');
});

test('NOUN evidence is evidence, not authority', () => {
  const evidence = toOmniiEvidence({ sourceRef: 'noun:course:abc', sourceType: 'courseware' });
  assert.equal(evidence.authorityRef, null);
  assert.equal(evidence.type, 'evidence');
});

test('consequential outbound actions require authority and human approval', () => {
  assert.equal(guardAction({ action: 'campaign_launch' }).allowed, false);
  assert.equal(guardAction({ action: 'inform' }).allowed, true);
});
