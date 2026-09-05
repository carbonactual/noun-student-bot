const CONSEQUENCES = new Set(['send','campaign_launch','official_submission','record_change','escalate']);

function toOmniiIntent({ studentId = null, request = '', purpose = 'education_support', action = 'inform', metadata = {} } = {}) {
  return { type: 'intent', product: 'NOUN_STUDENT_BOT', subjectId: studentId, request, purpose, action, metadata, authorityRef: null };
}

function toOmniiEvidence({ sourceRef = null, sourceType = 'courseware', confidence = 'unknown', provenance = {} } = {}) {
  return { type: 'evidence', sourceRef, sourceType, confidence, provenance, authorityRef: null };
}

function guardAction({ action = 'inform', authorityRef = null, humanApproved = false } = {}) {
  const consequential = CONSEQUENCES.has(action);
  return { allowed: !consequential || Boolean(authorityRef && humanApproved), consequential, authorityRef, humanApproved, reason: consequential && !authorityRef ? 'authority-required' : 'within-boundary' };
}

module.exports = { toOmniiIntent, toOmniiEvidence, guardAction };
