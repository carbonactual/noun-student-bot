const DOMAINS = Object.freeze({
  academic: ['programme','course','assessment','exam','tma','research','progression','graduation','mock_exam','mock_test','question_bank','study_plan','how_to_video','course_video'],
  services: ['signatures','id_card','exam_card','exam_clearance','registration_slip','printing','photocopying','scanning','binding','handouts','textbooks','study_space','library','library_card','computer_access','transport','accommodation','gown_regalia','matriculation_service','certificate_request','transcript_request','letter_request','form_request'],
  life: ['student_event','club','association','sports','sports_team','excursion','competition','matriculation','graduation'],
  skills: ['skills_acquisition','training','workshop','bootcamp','masterclass','apprenticeship','mentorship','career_skill'],
  work: ['employment','internship','siwes','apprenticeship','nysc','fellowship','volunteer'],
  commerce: ['student_business','marketplace','product_listing','service_listing','service_request','order'],
  finance: ['student_finance','student_loan','grant','scholarship','savings','device_funding','business_funding','financial_literacy','investment_education','investment_opportunity_discovery'],
  governance: ['student_governance','election','ballot','referendum','consultation'],
  representation: ['authorized_representative','errand_service','document_pickup','document_delivery','appointment_assistance'],
  research: ['project_topic','supervisor_request','research_method','literature_search','seminar','dissertation','thesis','project_submission','authentic_assessment']
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
  investment_education: 'investment_education',
  student_governance: 'student_governance',
  academic_support: 'academic_support',
  mock_assessment: 'mock_assessment',
  research_support: 'research_support',
  form_or_request: 'form_or_request',
  authorized_representation: 'authorized_representation'
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

const INVESTMENT_BOUNDARY = Object.freeze({
  allowed: ['education','risk_explanation','concepts','verified_opportunity_discovery'],
  blocked: ['personalized_execution','order_placement','portfolio_management','money_movement'],
  execution_boundary: 'carbon_actual_io_or_authorized_regulated_provider'
});

const REPRESENTATION_BOUNDARY = Object.freeze({
  allowed: ['printing','binding','document_pickup','document_delivery','appointment_assistance','other_explicitly_authorized_errands'],
  blocked: ['exam_attendance','graded_assessment','identity_impersonation','credential_bypass','unauthorized_institutional_action']
});

function domainForCategory(category) {
  for (const [domain, categories] of Object.entries(DOMAINS)) {
    if (categories.includes(category)) return domain;
  }
  return 'other';
}

function classifyIntent(text = '') {
  const s = String(text).toLowerCase();
  if (/ballot|election|vote|student government|student union|referendum/.test(s)) return INTENTS.student_governance;
  if (/mock exam|mock test|practice test|question bank/.test(s)) return INTENTS.mock_assessment;
  if (/project topic|research topic|supervisor|dissertation|thesis|seminar|research methods|literature search/.test(s)) return INTENTS.research_support;
  if (/form|application|request|change of study centre|change of programme|library card|transcript|certificate|recommendation letter|progress report/.test(s)) return INTENTS.form_or_request;
  if (/authorized representative|represent me|pick up.*document|collect.*document|deliver.*document|errand/.test(s)) return INTENTS.authorized_representation;
  if (/investment|investing|shares|bonds|fund|portfolio|risk|diversif/.test(s)) return INTENTS.investment_education;
  if (/internship|siwes|job|employment|vacancy|apprentice|nysc|fellowship|volunteer/.test(s)) return INTENTS.discover_opportunity;
  if (/skill|training|workshop|bootcamp|masterclass|learn|mentorship/.test(s)) return INTENTS.build_skill;
  if (/sport|football|basketball|athletic|game|excursion|tour|club|association|competition|event/.test(s)) return INTENTS.join_event;
  if (/buy|sell|marketplace|business|vendor|service provider|listing|order/.test(s)) return INTENTS.buy_or_sell;
  if (/loan|finance|grant|scholarship|device funding|savings|financial aid/.test(s)) return INTENTS.finance_discovery;
  if (/offer|i can help|i provide|my service/.test(s)) return INTENTS.offer_service;
  if (/request|i need|looking for|can someone/.test(s)) return INTENTS.request_service;
  if (/signing|signature|photocopy|printing|print|binding|scan|handout|textbook|gown|id card|exam card|clearance|registration slip|library/.test(s)) return INTENTS.discover_service;
  if (/course|programme|tma|exam|assignment|study|academic|how to study/.test(s)) return INTENTS.academic_support;
  return INTENTS.discover_service;
}

function financialBoundary(action) {
  const blocked = new Set(['originate_loan','approve_credit','collect_repayment','move_money','execute_payment','operate_wallet','settle_transaction','execute_investment','place_investment_order']);
  return { allowed: !blocked.has(action), action, boundary: blocked.has(action) ? 'carbon_actual_io' : 'noun_intelligence' };
}

function representationBoundary(action) {
  const blocked = new Set(REPRESENTATION_BOUNDARY.blocked);
  return { allowed: !blocked.has(action), action, boundary: blocked.has(action) ? 'prohibited_or_authorized_institutional_boundary' : 'noun_student_services' };
}

function buildStudentHome({ identity = {}, academic = {}, preferences = {} } = {}) {
  return {
    identity,
    academic,
    preferences,
    surfaces: ['academic','services','research','opportunities','skills','commerce','student_life','governance','economic_access','representation','support'],
    rule: 'personalize from verified context; never infer private academic facts for marketplace exposure'
  };
}

module.exports = {
  DOMAINS,
  ALL_CATEGORIES,
  INTENTS,
  NANO_FINANCE_STAGES,
  INVESTMENT_BOUNDARY,
  REPRESENTATION_BOUNDARY,
  domainForCategory,
  classifyIntent,
  financialBoundary,
  representationBoundary,
  buildStudentHome
};
