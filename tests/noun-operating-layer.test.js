const test = require('node:test');
const assert = require('node:assert/strict');

const { buildNounStudentContext } = require('../lib/student-context-kernel');
const { createEvent, replayKey, classifyOutcome } = require('../lib/event-continuity');
const { normalizeEvidence, evidenceDecision } = require('../lib/evidence');
const { rankOpportunities } = require('../lib/opportunity-engine');
const { chooseEscalation } = require('../lib/human-escalation');
const { pulseFromOutcome, assetLiability } = require('../lib/pulse');

test('student context kernel composes persistent learner, goals, needs, consent and timeline', () => {
  const context = buildNounStudentContext({
    student: { phone: '08012345678', full_name: 'Ada', level: '300L', programme_title: 'BSc Computer Science', faculty: 'Science' },
    programmes: [{ id: 'p1', title: 'BSc Computer Science', study_level: 'undergraduate', academic_status: 'active', is_primary: true }],
    activity: [
      { event_type: 'skill_interest', topic: 'Python' },
      { event_type: 'opportunity_interest', topic: 'internship' },
      { event_type: 'study_question', course_code: 'CIT301', topic: 'databases', created_at: '2026-09-15T10:00:00Z' }
    ],
    preferences: { marketplace_public: false, learning_goals: ['graduate on time'] }
  });
  assert.equal(context.identity.learner_id, '08012345678');
  assert.equal(context.academic.primary.programme_title, 'BSc Computer Science');
  assert.deepEqual(context.interests.skills, ['Python']);
  assert.equal(context.visibility.marketplace_public, false);
  assert.deepEqual(context.goals, ['graduate on time']);
  assert.equal(context.timeline[0].event_type, 'study_question');
});

test('event continuity creates replay-safe canonical envelopes', () => {
  const event = createEvent({
    eventId: 'evt-1', eventName: 'noun.study.question', actor: 'abba', principal: 'student-1',
    subject: 'course:CIT301', source: 'noun-bot', correlationId: 'corr-1', payload: { course: 'CIT301' }
  });
  assert.equal(event.schema_version, '1.0');
  assert.equal(event.event_id, 'evt-1');
  assert.equal(replayKey(event), 'corr-1:evt-1');
  assert.equal(classifyOutcome({ status: 'completed' }), 'success');
});

test('evidence contract distinguishes authoritative and stale evidence', () => {
  const official = normalizeEvidence({ title: 'Exam timetable', url: 'https://nou.edu.ng/exam', authority_tier: 1, retrieved_at: '2026-09-16T08:00:00Z', effective_date: '2026-09-16' });
  assert.equal(official.authority, 'official_noun');
  assert.equal(official.verification_state, 'verified');
  assert.equal(evidenceDecision([official]).decision, 'answer');

  const staleOnly = normalizeEvidence({ title: 'Old notice', url: 'https://example.test/old', authority_tier: 4, retrieved_at: '2026-07-16T08:00:00Z' });
  assert.equal(staleOnly.freshness_state, 'stale');
  assert.equal(evidenceDecision([staleOnly]).decision, 'escalate');
});

test('opportunity engine matches verified student context without exposing private data', () => {
  const matches = rankOpportunities(
    { programme_title: 'BSc Computer Science', study_level: 'undergraduate', interests: ['internship'], skills: ['Python'], location: 'Abuja' },
    [
      { id: 'a', title: 'Software Internship', type: 'internship', skills: ['python'], programme_tags: ['computer science'], location: 'Abuja', verification_status: 'verified' },
      { id: 'b', title: 'Unrelated Sales Role', type: 'job', skills: ['sales'], programme_tags: ['marketing'], location: 'Lagos', verification_status: 'verified' }
    ]
  );
  assert.equal(matches[0].id, 'a');
  assert.equal(Object.prototype.hasOwnProperty.call(matches[0], 'phone'), false);
});

test('human escalation routes consequential or low-confidence matters to the right human path', () => {
  assert.deepEqual(chooseEscalation({ intent: 'form_or_request', confidence: 'low' }).route, 'institutional_human');
  assert.deepEqual(chooseEscalation({ intent: 'research_support', confidence: 'medium', consequential: true }).route, 'research_human');
  assert.deepEqual(chooseEscalation({ intent: 'academic_support', confidence: 'high', consequential: false }).route, 'ai');
});

test('pulse follows outcome and canonical asset/liability comparison', () => {
  const pulse = pulseFromOutcome({ valueSent: 10, valueReturned: 16, eventName: 'learning.completed', outcome: 'completed' });
  assert.equal(pulse.status, 'asset');
  assert.equal(assetLiability(10, 10), 'liability');
  assert.equal(assetLiability(12, 5), 'liability');
});
