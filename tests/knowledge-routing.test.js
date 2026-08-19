const test = require('node:test');
const assert = require('node:assert/strict');

const { buildStudentGrounding } = require('../lib/knowledge');

test('canonical grounding prefers authoritative NOUN facts and includes course content', () => {
  const result = buildStudentGrounding({
    knowledge: {
      facts: [{ authority_tier: 1, title: 'Official policy', summary: 'Use the official process.' }],
      sources: [{ tier: 1, title: 'Official policy', url: 'https://example.test/policy' }],
      confidence: 'high'
    },
    courseContent: '[CIT301 — Research Methods]\nPrimary data are collected directly by a researcher.'
  });

  assert.match(result.text, /\[Tier 1 official_noun\] Official policy/);
  assert.match(result.text, /CIT301 — Research Methods/);
  assert.equal(result.sources[0].tier, 1);
  assert.equal(result.confidence, 'high');
});
