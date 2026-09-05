const test = require('node:test');
const assert = require('node:assert/strict');
const { rankProviders } = require('../lib/service-matching');

test('rankProviders prefers relevant verified available providers and explains the match', () => {
  const matches = rankProviders(
    { category: 'printing', skills: ['graphic design'], location: 'Abuja', remote_ok: false },
    [
      { id: 'a', category: 'printing', skills: ['graphic design'], location: 'Abuja', verification_status: 'qualification_verified', available: true, safety_flags: [], public_profile: true },
      { id: 'b', category: 'printing', skills: ['printing'], location: 'Lagos', verification_status: 'unverified', available: true, safety_flags: [], public_profile: true }
    ]
  );
  assert.equal(matches[0].id, 'a');
  assert.ok(matches[0].score > matches[1].score);
  assert.ok(matches[0].reasons.some(r => /category/i.test(r)));
  assert.ok(matches[0].reasons.some(r => /verification/i.test(r)));
});

test('rankProviders excludes providers with safety flags', () => {
  const matches = rankProviders(
    { category: 'handouts', skills: [] },
    [
      { id: 'safe', category: 'handouts', skills: [], verification_status: 'identity_verified', available: true, safety_flags: [], public_profile: true },
      { id: 'unsafe', category: 'handouts', skills: [], verification_status: 'qualification_verified', available: true, safety_flags: ['suspended'], public_profile: true }
    ]
  );
  assert.deepEqual(matches.map(m => m.id), ['safe']);
});

test('rankProviders never grants a hidden boost for student status', () => {
  const matches = rankProviders(
    { category: 'printing', skills: [] },
    [
      { id: 'student', category: 'printing', skills: [], verification_status: 'unverified', available: true, safety_flags: [], public_profile: true, is_student: true },
      { id: 'verified', category: 'printing', skills: [], verification_status: 'qualification_verified', available: true, safety_flags: [], public_profile: true, is_student: false }
    ]
  );
  assert.equal(matches[0].id, 'verified');
});
