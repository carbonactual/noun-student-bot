const { INTENTS } = require('./student-ecosystem');

const CAPABILITIES = Object.freeze({
  'learning.study': { name: 'learning.study', domain: 'academic', execution: 'reason', evidenceRequired: true, boundary: 'noun_intelligence' },
  'learning.practice': { name: 'learning.practice', domain: 'academic', execution: 'reason', evidenceRequired: true, boundary: 'practice_only' },
  'research.support': { name: 'research.support', domain: 'research', execution: 'reason', evidenceRequired: true, boundary: 'academic_integrity' },
  'institution.form': { name: 'institution.form', domain: 'services', execution: 'route', evidenceRequired: true, boundary: 'user_or_institution_authorized' },
  'institution.request': { name: 'institution.request', domain: 'services', execution: 'route', evidenceRequired: true, boundary: 'user_or_institution_authorized' },
  'service.discover': { name: 'service.discover', domain: 'services', execution: 'discover', evidenceRequired: true, boundary: 'noun_services' },
  'opportunity.discover': { name: 'opportunity.discover', domain: 'work', execution: 'discover', evidenceRequired: true, boundary: 'verified_opportunities' },
  'skills.build': { name: 'skills.build', domain: 'skills', execution: 'reason', evidenceRequired: false, boundary: 'noun_intelligence' },
  'marketplace.request': { name: 'marketplace.request', domain: 'commerce', execution: 'match', evidenceRequired: true, boundary: 'opt_in_marketplace' },
  'marketplace.offer': { name: 'marketplace.offer', domain: 'commerce', execution: 'match', evidenceRequired: true, boundary: 'opt_in_marketplace' },
  'finance.discover': { name: 'finance.discover', domain: 'finance', execution: 'discover', evidenceRequired: true, boundary: 'carbon_actual_io' },
  'governance.inform': { name: 'governance.inform', domain: 'governance', execution: 'inform', evidenceRequired: true, boundary: 'student_decision' },
  'representation.authorized': { name: 'representation.authorized', domain: 'representation', execution: 'route', evidenceRequired: true, boundary: 'explicit_authorization' },
  'human.escalate': { name: 'human.escalate', domain: 'support', execution: 'route', evidenceRequired: false, boundary: 'human_escalation' }
});

const INTENT_MAP = Object.freeze({
  [INTENTS.academic_support]: 'learning.study',
  [INTENTS.mock_assessment]: 'learning.practice',
  [INTENTS.research_support]: 'research.support',
  [INTENTS.form_or_request]: 'institution.form',
  [INTENTS.authorized_representation]: 'representation.authorized',
  [INTENTS.discover_service]: 'service.discover',
  [INTENTS.discover_opportunity]: 'opportunity.discover',
  [INTENTS.build_skill]: 'skills.build',
  [INTENTS.buy_or_sell]: 'marketplace.request',
  [INTENTS.request_service]: 'service.discover',
  [INTENTS.offer_service]: 'marketplace.offer',
  [INTENTS.finance_discovery]: 'finance.discover',
  [INTENTS.investment_education]: 'finance.discover',
  [INTENTS.student_governance]: 'governance.inform',
  [INTENTS.join_event]: 'opportunity.discover'
});

function listCapabilities() { return Object.values(CAPABILITIES); }
function resolveCapability(name) { return CAPABILITIES[name] || null; }
function capabilityForIntent(intent) { return INTENT_MAP[intent] || 'human.escalate'; }

module.exports = { CAPABILITIES, INTENT_MAP, listCapabilities, resolveCapability, capabilityForIntent };
