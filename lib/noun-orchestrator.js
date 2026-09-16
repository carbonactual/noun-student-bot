const { normalizeAbbaRequest, buildAbbaResult } = require('./abba-contract');
const { classifyIntent, financialBoundary, representationBoundary } = require('./student-ecosystem');
const { capabilityForIntent, resolveCapability } = require('./capability-registry');
const { buildStudentIntelligence } = require('./student-intelligence');
const { searchKnowledge, recordActivity } = require('./knowledge');
const { invokeAbba } = require('./abba-runtime');

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

  if (!boundary.allowed) {
    const result = buildAbbaResult({
      requestId: request.requestId,
      capability: capability.name,
      answer: 'This request is outside NOUN Bot execution authority. I can explain the permitted path and route you to the authorized human or financial boundary.',
      boundaries: { allowed: false, boundary: boundary.boundary, action: boundary.action },
      status: 'blocked'
    });
    await record(request.identity.phone, 'orchestration_blocked', request.course, capability.name, { request_id: request.requestId, intent, boundary });
    return result;
  }

  const [studentContext, knowledge] = await Promise.all([
    studentIntel(request.identity.phone, `${request.course || ''} ${request.utterance}`),
    knowledgeSearch(`${request.course || ''} ${request.utterance}`, { limit: 12, live: true })
  ]);

  const abbaRequest = {
    ...request,
    intent,
    capability: capability.name,
    capabilityDescriptor: capability,
    context: { ...request.context, student: studentContext },
    evidence: knowledge
  };

  let result;
  try {
    result = await invoke(abbaRequest, deps.runtimeDependencies || {});
  } catch (error) {
    const failed = buildAbbaResult({
      requestId: request.requestId,
      capability: capability.name,
      answer: 'ABBA intelligence is temporarily unavailable. The request was recorded and can be retried without losing the student context.',
      evidence: knowledge.sources || [],
      boundaries: { allowed: true, boundary: capability.boundary },
      status: 'unavailable'
    });
    await record(request.identity.phone, 'orchestration_abba_unavailable', request.course, capability.name, { request_id: request.requestId, error: String(error.message || error) });
    return failed;
  }

  const normalizedResult = buildAbbaResult({
    ...result,
    requestId: request.requestId,
    capability: capability.name,
    evidence: result.evidence?.length ? result.evidence : (knowledge.sources || []),
    boundaries: { allowed: true, boundary: capability.boundary }
  });

  await record(request.identity.phone, 'orchestration_completed', request.course, capability.name, {
    request_id: request.requestId,
    intent,
    status: normalizedResult.status,
    evidence_count: normalizedResult.evidence.length
  });
  return normalizedResult;
}

module.exports = { orchestrateNounRequest, boundaryFor };
