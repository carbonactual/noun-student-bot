const CONSEQUENT_INTENTS = new Set(['form_or_request','authorized_representation','finance_discovery','investment_education','student_governance','research_support']);

function chooseEscalation({ intent = '', confidence = 'low', consequential = false, evidenceDecision = null } = {}) {
  const low = confidence === 'low';
  if (intent === 'research_support' && (low || consequential)) return { route: 'research_human', reason: low ? 'low-confidence-research' : 'consequential-research', priority: 'high' };
  if (intent === 'form_or_request' || intent === 'authorized_representation') {
    return { route: 'institutional_human', reason: consequential || low ? 'institutional-boundary' : 'user-requested-human', priority: consequential ? 'high' : 'normal' };
  }
  if (intent === 'finance_discovery' || intent === 'investment_education') {
    return { route: 'financial_human', reason: consequential || low ? 'financial-boundary' : 'provider-guidance', priority: consequential ? 'high' : 'normal' };
  }
  if (intent === 'student_governance') return { route: 'institutional_human', reason: 'governance-boundary', priority: 'high' };
  if (evidenceDecision === 'escalate' || low) return { route: 'student-support-human', reason: 'insufficient-confidence', priority: 'normal' };
  if (CONSEQUENT_INTENTS.has(intent) && consequential) return { route: 'student-support-human', reason: 'consequential-action', priority: 'high' };
  return { route: 'ai', reason: 'within-ai-boundary', priority: 'low' };
}

module.exports = { chooseEscalation, CONSEQUENT_INTENTS };
