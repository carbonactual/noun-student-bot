const DOMAINS = Object.freeze({
  academic: ['programme','course','assessment','exam','tma','research','progression','graduation'],
  services: ['signatures','id_card','exam_clearance','printing','photocopying','binding','handouts','textbooks','study_space','transport','accommodation','gown_regalia'],
  life: ['student_event','club','sports','excursion','matriculation'],
  skills: ['skills_acquisition','training','apprenticeship'],
  work: ['employment','internship','siwes','nysc'],
  commerce: ['student_business','marketplace'],
  finance: ['student_finance','grant','scholarship','savings','device_funding']
});

const ALL_CATEGORIES = Object.freeze([...new Set(Object.values(DOMAINS).flat())]);

const INTENTS = Object.freeze({
  discover_service: 'discover_service',
  request_service: 'request_service',
  offer_service: 'offer_service',
  discover_opportunity: 'discover_opportunity',
  join_event: 'join_event',
  build_skill: 'build_skill',
  buy_or_sell: 'buy_or_sell',
  finance_discovery: 'finance_discovery',
  student_governance: 'student_governance',
  academic_support: 'academic_support'
});

const NANO_FINANCE_STAGES = Object.freeze([
  'need_capture',
  'financial_education',
  'opportunity_discovery',
  'eligibility_explanation',
  'terms_explanation',
  'provider_routing',
  'io_execution'
]);

function domainForCategory(category) {
  for (const [domain, categories] of Object.entries(DOMAINS)) {
    if (categories.includes(category)) return domain;
  }
  return 'other';
}

function classifyIntent(text = '') {
  const s = String(text).toLowerCase();
  if (/ballot|election|vote|student government|student union/.test(s)) return INTENTS.student_governance;
  if (/internship|siwes|job|employment|vacancy|apprentice|nysc/.test(s)) return INTENTS.discover_opportunity;
  if (/skill|training|workshop|bootcamp|masterclass|learn/.test(s)) return INTENTS.build_skill;
  if (/sport|football|basketball|athletic|game|excursion|tour|club|event/.test(s)) return INTENTS.join_event;
  if (/buy|sell|marketplace|business|vendor|service provider/.test(s)) return INTENTS.buy_or_sell;
  if (/loan|finance|fund|scholarship|grant|device funding|savings/.test(s)) return INTENTS.finance_discovery;
  if (/offer|i can help|i provide|my service/.test(s)) return INTENTS.offer_service;
  if (/request|i need|looking for|can someone/.test(s)) return INTENTS.request_service;
  if (/signing|signature|photocopy|printing|print|binding|handout|textbook|gown|id card|clearance/.test(s)) return INTENTS.discover_service;
  if (/course|programme|tma|exam|research|assignment|study|academic/.test(s)) return INTENTS.academic_support;
  return INTENTS.discover_service;
}

function financialBoundary(action) {
  const blocked = new Set(['originate_loan','approve_credit','collect_repayment','move_money','execute_payment','operate_wallet','settle_transaction']);
  return { allowed: !blocked.has(action), action, boundary: blocked.has(action) ? 'carbon_actual_io' : 'noun_intelligence' };
}

function buildStudentHome({ identity = {}, academic = {}, preferences = {} } = {}) {
  return {
    identity,
    academic,
    preferences,
    surfaces: ['academic','services','opportunities','skills','commerce','student_life','economic_access','support'],
    rule: 'personalize from verified context; never infer private academic facts for marketplace exposure'
  };
}

module.exports = { DOMAINS, ALL_CATEGORIES, INTENTS, NANO_FINANCE_STAGES, domainForCategory, classifyIntent, financialBoundary, buildStudentHome };
