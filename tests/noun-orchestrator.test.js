const test = require('node:test');
const assert = require('node:assert/strict');
const { orchestrateNounRequest } = require('../lib/noun-orchestrator');

test('orchestrator routes a study request through context, evidence and ABBA', async () => {
  const calls = [];
  const result = await orchestrateNounRequest(
    { phone: '2348012345678', message: 'Help me study CIT301', course: 'CIT301', channel: 'web' },
    {
      buildStudentIntelligence: async () => ({ personalized: true, student: { courses: ['CIT301'] } }),
      searchKnowledge: async () => ({ confidence: 'high', sources: [{ title: 'Official course guide' }], live_facts: [] }),
      invokeAbba: async request => {
        calls.push(request);
        return { requestId: request.requestId, answer: 'Study response', evidence: request.evidence.sources };
      },
      recordActivity: async (...args) => calls.push({ activity: args })
    }
  );
  assert.equal(result.status, 'complete');
  assert.equal(result.answer, 'Study response');
  assert.equal(result.capability, 'learning.study');
  assert.ok(calls.some(x => x.intent === 'academic_support'));
});

test('orchestrator blocks prohibited finance execution before ABBA', async () => {
  let invoked = false;
  const result = await orchestrateNounRequest(
    { phone: '2348012345678', message: 'place investment order for me', channel: 'web' },
    {
      invokeAbba: async () => { invoked = true; return { answer: 'bad' }; },
      recordActivity: async () => {}
    }
  );
  assert.equal(result.status, 'blocked');
  assert.equal(invoked, false);
});
