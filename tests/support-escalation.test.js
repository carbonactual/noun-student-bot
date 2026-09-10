const test = require('node:test');
const assert = require('node:assert/strict');
const { classifySupportRequest, buildSupportCase } = require('../lib/support-escalation');

test('classifies high-impact administrative requests for human handling', () => {
  assert.equal(classifySupportRequest('My result is missing from the portal'), 'Results');
  assert.equal(classifySupportRequest('I cannot access my student portal'), 'Portal access');
  assert.equal(classifySupportRequest('Please explain unit 3'), 'Academic');
});

test('creates a traceable support case without pretending to resolve it', () => {
  const c = buildSupportCase({ phone: '08012345678', category: 'Results', description: 'My result is missing', course_code: 'CIT301', urgency: 'urgent' });
  assert.equal(c.status, 'OPEN');
  assert.equal(c.student_phone, '08012345678');
  assert.equal(c.category, 'Results');
  assert.equal(c.course_code, 'CIT301');
  assert.equal(c.resolution, null);
});
