const assert = require('assert');
const { buildStudentContext } = require('../lib/student-context');
const { buildOeiLearnerContext, routeThroughOei } = require('../lib/oei-integration');
const { routeStudentIntentThroughOei } = require('../lib/abba');
const { DOMAINS, investmentBoundary, representationBoundary } = (() => {
  const ecosystem = require('../lib/student-ecosystem');
  return { DOMAINS: ecosystem.DOMAINS, investmentBoundary: ecosystem.financialBoundary, representationBoundary: ecosystem.representationBoundary };
})();
const context = buildStudentContext({ phone: 'p1', full_name: 'Student', study_level: 'undergraduate' }, [{ id: 'programme-1', title: 'Computing', is_primary: true }], [{ event_type: 'skill_interest', metadata: { skill: 'analysis' } }], { learning_goals: ['data analyst'] });
const learner = buildOeiLearnerContext({ phone: context.identity.phone, full_name: context.identity.full_name }, { programmes: ['programme-1'], skills: context.oei.skills, goals: context.oei.goals });
assert.equal(learner.institution, 'noun');
assert.ok(DOMAINS.academic.includes('course'));
assert.equal(investmentBoundary('execute_investment').allowed, false);
assert.equal(representationBoundary('exam_attendance').allowed, false);
const adapter = { id: 'noun', workflows: { form_request: { domain: 'services' } } };
assert.equal(routeThroughOei('form_request', adapter).routed, true);
assert.equal(routeStudentIntentThroughOei('form_request', adapter).routed, true);
console.log('NOUN OEI integration tests passed');
