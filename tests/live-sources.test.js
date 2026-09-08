const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSource, buildEvidence } = require('../lib/live-sources');

test('live source normalization preserves provenance and authority', () => {
  const source = normalizeSource(
    { title: 'Calendar', url: 'https://nou.edu.ng/calendar/', content: 'Academic calendar' },
    { authority_tier: 1, source_type: 'official_noun' }
  );
  assert.equal(source.authority_tier, 1);
  assert.equal(source.source_type, 'official_noun');
  assert.equal(source.url, 'https://nou.edu.ng/calendar/');
  assert.ok(source.retrieved_at);
});

test('evidence builder ignores empty source bodies', () => {
  const result = buildEvidence([{ title: 'Empty', url: 'https://nou.edu.ng/x', content: '' }]);
  assert.deepEqual(result, []);
});
