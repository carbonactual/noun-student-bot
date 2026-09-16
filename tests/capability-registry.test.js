const test = require('node:test');
const assert = require('node:assert/strict');
const { listCapabilities, capabilityForIntent } = require('../lib/capability-registry');
const { INTENTS } = require('../lib/student-ecosystem');

test('capability registry exposes core NOUN domains', () => {
  const names = listCapabilities().map(x => x.name);
  for (const name of ['learning.study','learning.practice','research.support','institution.form','opportunity.discover','marketplace.request','finance.discover','governance.inform','representation.authorized']) {
    assert.ok(names.includes(name), name);
  }
});

test('existing NOUN intents resolve to backend capabilities', () => {
  assert.equal(capabilityForIntent(INTENTS.academic_support), 'learning.study');
  assert.equal(capabilityForIntent(INTENTS.mock_assessment), 'learning.practice');
  assert.equal(capabilityForIntent(INTENTS.finance_discovery), 'finance.discover');
  assert.equal(capabilityForIntent(INTENTS.student_governance), 'governance.inform');
});
