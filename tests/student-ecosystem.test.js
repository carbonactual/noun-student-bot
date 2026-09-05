const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DOMAINS,
  ALL_CATEGORIES,
  INTENTS,
  domainForCategory,
  classifyIntent,
  financialBoundary,
  buildStudentHome
} = require('../lib/student-ecosystem');

test('student ecosystem covers academic, services, life, skills, work, commerce and finance', () => {
  for (const domain of ['academic','services','life','skills','work','commerce','finance']) {
    assert.ok(Array.isArray(DOMAINS[domain]));
    assert.ok(DOMAINS[domain].length > 0);
  }
  assert.ok(ALL_CATEGORIES.includes('nysc'));
  assert.ok(ALL_CATEGORIES.includes('sports'));
  assert.ok(ALL_CATEGORIES.includes('student_business'));
});

test('category maps to the correct student domain', () => {
  assert.equal(domainForCategory('photocopying'), 'services');
  assert.equal(domainForCategory('skills_acquisition'), 'skills');
  assert.equal(domainForCategory('employment'), 'work');
  assert.equal(domainForCategory('student_business'), 'commerce');
  assert.equal(domainForCategory('grant'), 'finance');
});

test('student governance requests are classified separately from commerce', () => {
  assert.equal(classifyIntent('How do I vote in the student election?'), INTENTS.student_governance);
});

test('student marketplace and service requests remain discoverable intents', () => {
  assert.equal(classifyIntent('I need someone to photocopy my handout'), INTENTS.discover_service);
  assert.equal(classifyIntent('I want to sell my graphic design service'), INTENTS.buy_or_sell);
});

test('finance remains discovery-only inside NOUN while execution belongs to I/O', () => {
  assert.deepEqual(financialBoundary('find student finance'), {
    allowed: true,
    action: 'find student finance',
    boundary: 'noun_intelligence'
  });
  assert.equal(financialBoundary('move_money').allowed, false);
  assert.equal(financialBoundary('move_money').boundary, 'carbon_actual_io');
});

test('student home exposes the unified operating surfaces without leaking private academic data', () => {
  const home = buildStudentHome({ identity: {id: 'student-1'}, academic: {study_level: 'masters'} });
  assert.deepEqual(home.surfaces, ['academic','services','opportunities','skills','commerce','student_life','economic_access','support']);
  assert.match(home.rule, /never infer private academic facts/i);
});
