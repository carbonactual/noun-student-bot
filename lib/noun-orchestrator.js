const { normalizeAbbaRequest, buildAbbaResult } = require('./abba-contract');
const { classifyIntent, financialBoundary, representationBoundary } = require('./student-ecosystem');
const { capabilityForIntent, resolveCapability } = require('./capability-registry');
const { buildStudentIntelligence } = require('./student-intelligence');
const { buildNounStudentContext } = require('./student-context-kernel');
const { searchKnowledge, recordActivity, db, tenantId } = require('./knowledge');
const { invokeAbba } = require('./abba-runtime');
const { normalizeEvidence, evidenceDecision } = require('./evidence');
const { createEvent, classifyOutcome } = require('./event-continuity');
const { chooseEscalation } = require('./human-escalation');
const { pulseFromOutcome } = require('./pulse');
const { rankOpportunities } = require('./opportunity-engine');

function boundaryFor(capability, utterance) {
  if (capability.domain === 'finance') {
    const blocked = ['originate_loan', 'approve_credit', 'move_money', 'execute_payment', 'operate_wallet', 'settle_transaction', 'execute_investment', 'place_investment_order'];
    const requestedAction = blocked.find(action => new RegExp(action.replaceAll('_', '[ _-]'), 'i').test(utterance));
    return financialBoundary(requestedAction || 'explain');
  }
  if (capability.domain === 'representation') {
    if (/exam|impersonat|bypass|credential/i.test(utterance)) return representationBoundary('identity_impersonation');
    return representationBoundary('document_pickup');
  }
  return { allowed: true, action: capability.name, boundary: capability.boundary };
}

async function safeRows(table, queryBuilder) {
  try {
    const tid = await tenantId();
    let query = db.from(table).select('*').eq('tenant_id', tid);
    query = queryBuilder ? queryBuilder(query) : query;
    const result = await query.limit(200);
    return result.data || [];
  } catch (_) {
    return [];
  }
}

async function persistContinuity(event, pulse, phone, course, capability) {
  try {
    const tid = await tenantId();
    await db.from('noun_events').insert({
      tenant_id: tid,
      event_id: event.event_id,
      event_name: event.event_name,
      principal: event.principal,
      subject: event.subject,
      correlation_id: event.correlation_id,
      payload: event.payload,
      evidence_ref: event.evidence_ref,
      occurred_at: event.occurred_at,
      observed_at: event.observed_at
    });
    await db.from('noun_pulses').insert({
      tenant_id: tid,
      phone,
      course_code: course || null,
      capability,
      event_id: event.event_id,
      outcome: pulse.outcome,
      value_sent: pulse.value_sent,
      value_returned: pulse.value_returned,
      status: pulse.status,
      metadata: pulse.metadata,
      occurred_at: pulse.occurred_at
    });
  } catch (error) {
    try {
      await recordActivity(phone, 'continuity_persistence_failed', course, capability, { error: String(error.message || error), event_id: event.event_id });
    } catch (_) {
      // Continuity/telemetry must never break the primary student request.
    }
  }
}

async function orchestrateNounRequest(input, deps = {}) {
  const request = normalizeAbbaRequest(input);
  const classify = deps.classifyIntent || classifyIntent;
  const studentIntel = deps.buildStudentIntelligence || buildStudentIntelligence;
  const knowledgeSearch = deps.searchKnowledge || searchKnowledge;
  const invoke = deps.invokeAbba || invokeAbba;
  const record = deps.recordActivity || recordActivity;

  const intent = classify(request.utterance);
  const capabilityName = request.requestedCapability || capabilityForIntent(intent);
  const capability = resolveCapability(capabilityName) || resolveCapability('human.escalate');
  const boundary = boundaryFor(capability, request.utterance);

  const identityPhone = request.identity.phone;
  const baseEvent = createEvent({
    eventName: 'noun.intent.received',
    actor: 'noun-bot',
    principal: identityPhone,
    subject: capability.name,
    source: request.channel,
    correlationId: request.requestId,
    payload: { intent, capability: capability.name, course: request.course }
  });

  if (!boundary.allowed) {
    const escalation = chooseEscalation({ intent, confidence: 'high', consequential: true });
    const pulse = pulseFromOutcome({ valueSent: 1, valueReturned: 0, eventName: 'noun.request.blocked', outcome: 'blocked', metadata: { intent, capability: capability.name } });
    const result = buildAbbaResult({
      requestId: request.requestId,
      capability: capability.name,
      answer: 'This request is outside NOUN Bot execution authority. I can explain the permitted path and route you to the authorized human or financial boundary.',
      boundaries: { allowed: false, boundary: boundary.boundary, action: boundary.action },
      escalation,
      evidenceDecision: 'escalate',
      pulse,
      event: { ...baseEvent, event_name: 'noun.request.blocked' },
      status: 'blocked'
    });
    await record(identityPhone, 'orchestration_blocked', request.course, capability.name, { request_id: request.requestId, intent, boundary, escalation });
    await persistContinuity({ ...baseEvent, event_name: 'noun.request.blocked' }, pulse, identityPhone, request.course, capability.name);
    return result;
  }

  const [studentData, knowledge] = await Promise.all([
    studentIntel(identityPhone, `${request.course || ''} ${request.utterance}`),
    knowledgeSearch(`${request.course || ''} ${request.utterance}`, { limit: 12, live: true })
  ]);

  const studentContext = buildNounStudentContext({
    student: studentData.student || {},
    activity: studentData.recent_activity || [],
    preferences: studentData.preferences || {},
    goals: studentData.goals || [],
    needs: studentData.priorities?.map(x => x.title).filter(Boolean) || [],
    risks: studentData.insights?.filter(x => /risk|attention/i.test(`${x.title} ${x.detail}`)).map(x => x.title).slice(0, 10) || []
  });

  const evidence = (knowledge.facts || []).map(normalizeEvidence);
  const evidenceState = evidenceDecision(evidence);
  const escalation = chooseEscalation({ intent, confidence: knowledge.confidence, consequential: ['form_or_request', 'authorized_representation', 'finance_discovery', 'investment_education', 'student_governance'].includes(intent), evidenceDecision: evidenceState.decision });

  let opportunityMatches = [];
  if (intent === 'discover_opportunity') {
    const opportunities = await safeRows('opportunities', q => q.in('status', ['active', 'verified', 'published']));
    opportunityMatches = rankOpportunities({
      programme_title: studentContext.academic.primary.programme_title,
      study_level: studentContext.academic.study_level,
      interests: studentContext.interests.opportunities,
      skills: studentContext.interests.skills,
      location: studentContext.preferences.location || studentContext.identity.location
    }, opportunities);
  }

  const abbaRequest = {
    ...request,
    intent,
    capability: capability.name,
    capabilityDescriptor: capability,
    context: { ...request.context, student: studentContext, escalation, opportunityMatches },
    evidence: { ...knowledge, normalized: evidence, decision: evidenceState }
  };

  let result;
  try {
    result = await invoke(abbaRequest, deps.runtimeDependencies || {});
  } catch (error) {
    const failedEvent = { ...baseEvent, event_name: 'noun.abba.unavailable', payload: { intent, capability: capability.name, error: String(error.message || error) } };
    const pulse = pulseFromOutcome({ valueSent: 1, valueReturned: 0, eventName: failedEvent.event_name, outcome: 'unavailable', metadata: { capability: capability.name } });
    const failed = buildAbbaResult({
      requestId: request.requestId,
      capability: capability.name,
      answer: 'ABBA intelligence is temporarily unavailable. The request was recorded and can be retried without losing the student context.',
      evidence: knowledge.sources || [],
      boundaries: { allowed: true, boundary: capability.boundary },
      context: studentContext,
      escalation,
      opportunityMatches,
      evidenceDecision: evidenceState.decision,
      pulse,
      event: failedEvent,
      status: 'unavailable'
    });
    await record(identityPhone, 'orchestration_abba_unavailable', request.course, capability.name, { request_id: request.requestId, error: String(error.message || error), escalation });
    await persistContinuity(failedEvent, pulse, identityPhone, request.course, capability.name);
    return failed;
  }

  const status = result.status || 'complete';
  const outcome = classifyOutcome({ status, externalAcknowledged: false, verified: status === 'complete' || status === 'completed' });
  const event = { ...baseEvent, event_name: 'noun.request.completed', payload: { intent, capability: capability.name, status, outcome } };
  const pulse = pulseFromOutcome({ valueSent: 1, valueReturned: outcome === 'success' ? 2 : 0, eventName: event.event_name, outcome, metadata: { intent, capability: capability.name } });

  const normalizedResult = buildAbbaResult({
    ...result,
    requestId: request.requestId,
    capability: capability.name,
    evidence: result.evidence?.length ? result.evidence : (knowledge.sources || []),
    boundaries: { allowed: true, boundary: capability.boundary },
    context: studentContext,
    escalation,
    opportunityMatches,
    pulse,
    event,
    evidenceDecision: evidenceState.decision,
    status
  });

  await record(identityPhone, 'orchestration_completed', request.course, capability.name, {
    request_id: request.requestId,
    intent,
    status: normalizedResult.status,
    evidence_count: normalizedResult.evidence.length,
    escalation: escalation.route,
    pulse_status: pulse.status
  });
  await persistContinuity(event, pulse, identityPhone, request.course, capability.name);
  return normalizedResult;
}

module.exports = { orchestrateNounRequest, boundaryFor, persistContinuity };
