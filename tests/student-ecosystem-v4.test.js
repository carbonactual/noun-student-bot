const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DOMAINS,
  ALL_CATEGORIES,
  INTENTS,
  classifyIntent,
  financialBoundary,
  representationBoundary,
  buildStudentHome
} = require('../lib/student-ecosystem');

test('widened ecosystem includes mock learning, requests, physical services, research and governance', () => {
  for (const category of ['mock_exam','mock_test','how_to_video','exam_card','form_request','project_topic','supervisor_request','investment_education','election','authorized_representative']) {
    assert.ok(ALL_CATEGORIES.includes(category), category);
  }
  assert.ok(DOMAINS.research.includes('project_topic'));
  assert.ok(DOMAINS.representation.includes('document_pickup'));
});

test('new intents classify student needs by domain', () => {
  assert.equal(classifyIntent('Where can I take a mock exam for CIT301?'), INTENTS.mock_assessment);
  assert.equal(classifyIntent('I need the form to change my study centre'), INTENTS.form_or_request);
  assert.equal(classifyIntent('Help me choose a project topic'), INTENTS.research_support);
  assert.equal(classifyIntent('Can someone collect my printed documents for me?'), INTENTS.authorized_representation);
  assert.equal(classifyIntent('Teach me what diversification means in investing'), INTENTS.investment_education);
});

test('representation boundary permits errands but blocks exam attendance and impersonation', () => {
  assert.equal(representationBoundary('document_pickup').allowed, true);
  assert.equal(representationBoundary('exam_attendance').allowed, false);
  assert.equal(representationBoundary('identity_impersonation').allowed, false);
});

test('investment execution remains outside NOUN intelligence', () => {
  assert.equal(financialBoundary('execute_investment').allowed, false);
  assert.equal(financialBoundary('place_investment_order').allowed, false);
  assert.equal(financialBoundary('explain_risk').allowed, true);
});

test('student home includes research, governance and representation without changing one identity model', () => {
  const home = buildStudentHome({ identity: { id: 'student-1' } });
  assert.deepEqual(home.surfaces, ['academic','services','research','opportunities','skills','commerce','student_life','governance','economic_access','representation','support']);
});
