// CIBN portal intelligence extracted from the owner's September 17, 2026 screenshot package.
// Source authority is deliberately explicit: portal observations are not silently promoted to policy.
// Keep this catalog separate from Institute GPT commercial service pricing.

const SOURCE = {
  PORTAL: 'owner_portal_screenshot_2026-09-17',
  MEMBERSHIP_LETTER: 'cibn_membership_registration_letter_2026-09-17',
  EXAMINER_REPORT: 'april_2026_examiners_report',
  DIGITAL_STOREFRONT: 'cibn_digital_screenshot_2026-09-17',
  UNKNOWN_PORTAL_GUARD: 'portal_screenshot_context_not_identified'
};

const COURSE_MAP = [
  // ACIB / Banking Professional Examination
  ...parse('ACIB Diploma', [
    '601|Economics of Banking & Finance|2026-10-06|14:00-17:00|mandatory',
    '602|Customer Service & Relationship Management|2026-10-06|14:00-17:00|mandatory',
    '603|Banking Law and Regulation|2026-10-07|09:00-12:00|mandatory',
    '604|Ethics, Corporate Governance & Professionalism|2026-10-08|14:00-17:00|mandatory'
  ]),
  ...parse('ACIB Intermediate Professional', [
    '701|Digital Banking|2026-10-06|09:00-12:00|mandatory',
    '702|Enterprise Risk Management|2026-10-06|09:00-12:00|mandatory',
    '703|Fintech|2026-10-08|14:00-17:00|mandatory',
    '704|Finance in the Global Market|2026-10-07|14:00-17:00|mandatory'
  ]),
  ...parse('ACIB Chartered Banker', [
    '801|Corporate Financial Services|2026-10-06|09:00-12:00|mandatory',
    '802|Bank Management and Strategy|2026-10-07|09:00-12:00|mandatory',
    '803|Lending and Credit Management|2026-10-08|09:00-12:00|mandatory',
    '804|Applied Banking|2026-10-06|14:00-17:00|mandatory',
    '805|Bank Audit and Compliance|2026-10-08|14:00-17:00|elective',
    '806|Agency Banking|2026-10-08|14:00-17:00|elective',
    '807|Infrastructure Finance|2026-10-08|14:00-17:00|elective',
    '808|SME’s Finance|2026-10-08|14:00-17:00|elective',
    '809|Agricultural & Rural Banking|2026-10-08|14:00-17:00|elective',
    '810|Human Resource Management|2026-10-08|14:00-17:00|elective',
    '811|Central Banking/Deposit Insurance System|2026-10-08|14:00-17:00|elective',
    '812|Public Sector Finance|2026-10-08|14:00-17:00|elective',
    '813|Experiential Learning Module|2026-10-09|09:00-12:00|mandatory'
  ]),

  // Microfinance Certification Programme (MCP)
  ...parse('Microfinance Certification Programme · Microfinance I', [
    'MF301|The Evolution, Management and Regulation of Microfinancing|2026-10-06|09:00-12:00|mandatory',
    'MF302|Financial Analysis and Performance Monitoring in Microfinance Institutions|2026-10-06|09:00-12:00|mandatory',
    'MF303|Product Development and Marketing Management|2026-10-06|14:00-17:00|mandatory'
  ]),
  ...parse('Microfinance Certification Programme · Microfinance II', [
    'MF401|Risk Management and Internal Control in Microfinance Institutions|2026-10-07|09:00-12:00|mandatory',
    'MF402|Ethics and Corporate Governance|2026-10-07|14:00-17:00|mandatory',
    'MF404|Small and Medium Enterprises Management and Development|2026-10-07|14:00-17:00|elective'
  ]),

  // e-Payments Programme
  ...parse('e-Payments Programme · E-Payment I', [
    'EP101|Introduction to Electronic Payments|2026-10-06|09:00-12:00|mandatory',
    'EP102|E-Payment Operations|2026-10-06|09:00-12:00|mandatory',
    'EP103|E-Payment Regulation|2026-10-06|14:00-17:00|mandatory',
    'EP104|E-Payment Operations Simulation Lab & Experiential Learning|2026-10-07|09:00-12:00|mandatory'
  ]),
  ...parse('e-Payments Programme · E-Payment II', [
    'EP201|The Business of Digital Financial Services & Innovation|2026-10-08|09:00-12:00|mandatory',
    'EP202|Digital Identity|2026-10-08|09:00-12:00|mandatory',
    'EP203|E-Payment Technology and Operations|2026-10-06|14:00-17:00|mandatory',
    'EP204|The Regulatory Environment for DFS|2026-10-07|14:00-17:00|mandatory',
    'EP205|E-Payment Security, Audit & Compliance|2026-10-07|14:00-17:00|mandatory',
    'EP206|Financial Inclusion|2026-10-09|09:00-12:00|mandatory',
    'EP207|E-Payment Operations Simulation Lab & Experiential Learning|2026-10-07|09:00-12:00|mandatory'
  ]),

  // Agency Banking Programme
  ...parse('Agency Banking Programme · CAB1', [
    'CAB101|Agency Banking Law & Regulations|2026-10-06|09:00-12:00|mandatory',
    'CAB102|Customer Service & Agency Banking Relationship Mgt|2026-10-07|09:00-12:00|mandatory',
    'CAB103|Financial Inclusion|2026-10-06|09:00-12:00|mandatory',
    'CAB104|Operating Models, Channels & Services|2026-10-07|09:00-12:00|mandatory'
  ]),
  ...parse('Agency Banking Programme · CAB2', [
    'CAB201|Entrepreneurship & Innovation|2026-10-06|14:00-17:00|mandatory',
    'CAB202|Contemporary Issues in Agency Banking|2026-10-06|14:00-17:00|mandatory',
    'CAB203|Risk, Control & Reconciliation|2026-10-07|14:00-17:00|mandatory',
    'CAB204|Digital Financial Services|2026-10-07|14:00-17:00|mandatory'
  ]),
  ...parse('Agency Banking Programme · CAB3', [
    'CAB301|Ethics, Corporate Governance & Professionalism|2026-10-07|09:00-12:00|mandatory',
    'CAB302|Micro & SME Finance|2026-10-07|09:00-12:00|mandatory',
    'CAB303|Agency Performance Management|2026-10-08|09:00-12:00|mandatory',
    'CAB304|Experiential Learning/Multi-Disciplinary Case Study|2026-10-08|09:00-12:00|mandatory'
  ]),

  // Additional portal catalogue visible in the same registration journey
  ...parse('Non-Interest Banking', [
    'CNB101|Principles of Non-Interest Banking and Finance|2026-10-07|14:00-17:00|catalogue',
    'CNB102|Non-Interest Financial Institutions and Products|2026-10-08|09:00-12:00|catalogue',
    'CNB103|Financial Reporting in Non-Interest Banking and Finance|2026-10-08|09:00-12:00|catalogue',
    'CNB104|Management of Non-Interest Financial Institutions|2026-10-07|14:00-17:00|catalogue',
    'CNB105|Ethics and Corporate Governance|2026-10-08|14:00-17:00|catalogue'
  ]),
  ...parse('Public Sector', [
    'CPS101|Public Sector|2026-10-06|14:00-17:00|catalogue',
    'CPS102|Public Finance|2026-10-06|14:00-17:00|catalogue',
    'CPS103|Credit Risk Management|2026-10-07|14:00-17:00|catalogue',
    'CPS104|Public Debt Management|2026-10-07|14:00-17:00|catalogue'
  ]),
  ...parse('Loan Processing and Documentation', [
    'CLPD101|Banking Law, Ethics and Corporate Governance|2026-10-06|09:00-12:00|catalogue',
    'CLPD102|Practice of Banking|2026-10-07|09:00-12:00|catalogue',
    'CLPD103|Mortgage Finance|2026-10-07|09:00-12:00|catalogue',
    'CLPD104|Property Law|2026-10-06|09:00-12:00|catalogue'
  ]),
  ...parse('Deposit Insurance System Certification', [
    'CFDIS101|Banking Regulation, Law & Supervision|2026-10-06|09:00-12:00|catalogue',
    'CFDIS102|Fundamentals of Deposit Insurance|2026-10-06|09:00-12:00|catalogue',
    'CFDIS103|Banking Practice & Credit Management|2026-10-07|09:00-12:00|catalogue',
    'CFDIS104|Practice of Deposit Insurance System in Nigeria|2026-10-07|09:00-12:00|catalogue'
  ]),
  ...parse('Banking Operations', [
    'CBO101|Domestic Operations|2026-10-06|14:00-17:00|catalogue',
    'CBO102|Foreign Operations|2026-10-06|14:00-17:00|catalogue'
  ]),
  ...parse('Digital Banking', [
    'CDB101|Fundamentals in Digital Banking|2026-10-06|14:00-17:00|catalogue',
    'CDB102|E-Commerce, Internet Laws and Data Security|2026-10-06|09:00-12:00|catalogue',
    'CDB103|Disruptive Innovation|2026-10-06|09:00-12:00|catalogue',
    'CDB104|Information, System Audit and Cyber Security|2026-10-07|09:00-12:00|catalogue',
    'CDB105|Data Analytics in Banking|2026-10-07|09:00-12:00|catalogue',
    'CDB106|Digital Banking Trends|2026-10-07|14:00-17:00|catalogue',
    'CDB107|Payment Systems|2026-10-07|14:00-17:00|catalogue'
  ]),
  ...parse('Reporting and Compliance', [
    'CRC101|Audit|2026-10-07|09:00-12:00|catalogue',
    'CRC102|Compliance|2026-10-07|09:00-12:00|catalogue',
    'CRC103|Management Control and Financial Reporting|2026-10-08|09:00-12:00|catalogue',
    'CRC104|Risk Management|2026-10-08|09:00-12:00|catalogue'
  ]),
  ...parse('Sustainable Banking', [
    'CSB101|Fundamentals of Sustainable Banking|2026-10-06|09:00-12:00|catalogue',
    'CSB102|Business Case for Environmental and Social Risk Management|2026-10-06|14:00-17:00|catalogue',
    'CSB103|Environmental & Social Management System|2026-10-06|14:00-17:00|catalogue',
    'CSB104|Local Environment and Social Principles, Regulation and Standards|2026-10-06|14:00-17:00|catalogue',
    'CSB105|Regional and International Environmental and Social Principles and Standards|2026-10-07|09:00-12:00|catalogue',
    'CSB106|Environmental and Social Risk and Impacts for Financing Products|2026-10-07|09:00-12:00|catalogue',
    'CSB107|Environmental and Social Opportunities|2026-10-07|14:00-17:00|catalogue',
    'CSB108|Sustainable Banking Practices|2026-10-07|14:00-17:00|catalogue'
  ])
];

function parse(programLevel, rows) {
  return rows.map(row => {
    const [code, name, date, time, type] = row.split('|');
    return {
      program: programLevel.split(' · ')[0],
      level: programLevel.split(' · ')[1] || null,
      code, name, date, time, type,
      elective: type === 'elective',
      source: SOURCE.PORTAL
    };
  });
}

const PROGRAMME_SECTIONS_VISIBLE_BUT_EMPTY = [
  'Certified Risk Manager 1',
  'Certified Risk Manager 2',
  'Certified Risk Manager 3',
  'Ethics & Corporate Governance',
  'Banking Law, Regulation & Supervision'
].map(name => ({name, source: SOURCE.PORTAL, status: 'no course rows visible in screenshot'}));

const RULES = {
  charteredBankerElectiveMax: {
    rule: 'You can only register Maximum of three (3) elective courses.',
    scope: 'ACIB Chartered Banker registration screen',
    source: SOURCE.PORTAL
  },
  exemptionFailedSubject: {
    rule: 'You cannot be exempted from a subject you attempted and failed.',
    scope: 'Exemption Application screen',
    source: SOURCE.PORTAL
  },
  exemptionTiming: {
    rule: 'Complete exemption processes before sitting for the last examination paper; the portal warns that you cannot qualify with exemption after that point.',
    scope: 'Banking Professional Examination registration screen',
    source: SOURCE.PORTAL
  },
  exemptionUpload: {
    rule: 'A single PDF document not larger than 2MB is requested for the exemption application evidence upload.',
    scope: 'Exemption result/application screen',
    source: SOURCE.PORTAL
  },
  unknownFiveCourseGuard: {
    rule: 'The portal displayed a guard reading: Amount Cannot Be Zero Or You Cannot Register More than Five(5) Courses.',
    scope: 'programme/payment screen not uniquely identified in the extracted package',
    source: SOURCE.UNKNOWN_PORTAL_GUARD,
    confidence: 'context-limited; do not generalise'
  },
  oldSubjectMapping: {
    rule: 'The portal provides a link to map old subjects to the new syllabus; the owner screenshot of that link returned HTTP 404.',
    scope: 'Banking Professional Examination registration',
    source: SOURCE.PORTAL,
    action: 'Do not invent the mapping. Tell the candidate the portal link is/was broken and use an authoritative current mapping when available.'
  },
  publicationCopyright: {
    rule: 'The portal displays a notice prohibiting reproduction/distribution of attached CIBN publications without permission.',
    scope: 'paid publication viewer',
    source: SOURCE.PORTAL,
    action: 'ABBA should summarize and teach concepts rather than reproduce protected handouts verbatim.'
  }
};

const OBSERVED_FEES = [
  {item:'MCP October 2026 exam registration', amount:32500, currency:'NGN', type:'exam_fee', authority:'portal_observation', source:SOURCE.PORTAL},
  {item:'MCP example online transaction charge', amount:596.45, currency:'NGN', type:'payment_gateway_charge', authority:'portal_observation', source:SOURCE.PORTAL},
  {item:'MCP example Paystack displayed amount', amount:33094.43, currency:'NGN', type:'payment_gateway_display', authority:'portal_observation', source:SOURCE.PORTAL, note:'Screenshot also showed transaction amount ₦33,096.45 and cashback ₦2.02; do not turn this into a universal fee rule.'},
  {item:'ACIB Diploma, all 4 courses selected example', amount:41000, currency:'NGN', type:'exam_fee_cart', authority:'portal_observation', source:SOURCE.PORTAL, note:'Observed cart total; not proof of a universal per-course rate.'},
  {item:'ACIB Intermediate, all 4 courses selected example', amount:87250, currency:'NGN', type:'exam_fee_cart', authority:'portal_observation', source:SOURCE.PORTAL, note:'Observed cart total; supersedes an older 15k-37.5k schedule in an earlier internal note.'},
  {item:'ACIB Chartered Banker selected example', amount:135000, currency:'NGN', type:'exam_fee_cart', authority:'portal_observation', source:SOURCE.PORTAL, note:'Observed selection included 801, 802, 803, 804, 806, 807, 810 and 813; total is an example, not a universal level price.'},
  {item:'Agency Banking selected example: CAB104 + CAB203 + CAB204', amount:20750, currency:'NGN', type:'exam_fee_cart', authority:'portal_observation', source:SOURCE.PORTAL, note:'Observed cart total for the displayed three-course selection.'},
  {item:'e-Payments all displayed courses selected example', amount:271000, currency:'NGN', type:'exam_fee_cart', authority:'portal_observation', source:SOURCE.PORTAL, note:'The portal raised an exam-timetable clash warning; the amount is an example, not a permitted combination.'},
  {item:'Life Annual Subscription Payment screen example', amount:270000, currency:'NGN', type:'subscription_portal_observation', authority:'portal_observation', source:SOURCE.PORTAL, note:'The screenshot uses the portal label “Life Annual Subscription Payment”; do not equate this with the Student Member annual subscription without verifying the membership category.'},
  {item:'Student Member annual subscription from registration letter', amount:5000, currency:'NGN', type:'annual_subscription', authority:'membership_letter', source:SOURCE.MEMBERSHIP_LETTER, note:'Letter says due 1 January every year.'}
];

const PUBLICATION_CATALOG = [
  'Financial Reporting A Model...',
  'Management of Non-Interest Financial Institutions Study Pack',
  'Principles of Non-Interest Banking and Finance Module Study Pack',
  'Ethics and Corporate Governance Principles and Practices Study Pack',
  'Agency Performance Management Study Pack',
  'Digital Financial Services Study Pack',
  'Contemporary Issues in Agency Banking Study Pack',
  'Agency Banking Study Pack',
  'Module V - Ethics and Corporate Governance',
  'Agency Banking - Ethics and Corporate Governance Study Pack',
  'Experiential Learning Module',
  'The Business of DFS Innovation Study Pack',
  'E-Payments Technology & Operations Study Pack',
  'Digital Identity Study Pack',
  'The Regulatory Environment for DFS Study Pack',
  'Financial Inclusion Study Pack',
  'E-Payment Security Audit & Compliance Study Pack',
  'Study materials for Practice of Banking Study Pack',
  'Study materials for Property Law Study Pack',
  'Study materials for Mortgage Finance Study Pack',
  'Study materials for Ethics and Corporate Governance Study Pack',
  'Study materials for Banking Law & Regulation Study Pack',
  'Study Pack for Entrepreneurship & Innovation',
  'Study pack for Ethics Corporate Governance & Professionalism',
  'Study Pack for Risk Control and Reconciliation',
  'Study Pack for Customer Service & Agency Relationship Management',
  'Study Pack for Agency Banking Laws & Regulations',
  'Study Pack for Financial Inclusion',
  'Study Pack for Operating Models, Channels & Services',
  'Study Pack - Infrastructure Finance',
  'Experiential Learning Module',
  'Study Pack - Bank Management and Strategy',
  'Study Pack - Human Resources Management',
  'Study Pack - Ethics, Corporate Governance and Professionalism',
  'Study Pack - Sustainable Banking',
  'Study Pack - Sustainable Banking',
  'Study Pack - Sustainable Banking',
  'Study Pack - Sustainable Banking',
  'Study Pack - Sustainable Banking',
  'Study Pack - Sustainable Banking',
  'Study Pack - Sustainable Banking',
  'Study Pack - Sustainable Banking',
  'Study Pack - CUSTOMER SERVICE & RELATIONSHIP MGT',
  'Study Pack - Digital Banking',
  'Study Pack - Lending and Credit Management',
  'Study Pack - Banking Law & Regulation',
  'Study Pack - SME Finance',
  'Study Pack - Economics of Banking & Finance',
  'Study Pack - Bank Audit and Compliance',
  'Study Pack - Central Banking/ Deposit Insurance System',
  'Study Pack - Fintech',
  'Study Pack - Finance in the Global Market',
  'Study Pack - Enterprise Risk Management',
  'Study Pack - Agricultural & Rural Banking',
  'Study Pack - Agency Banking',
  'Study Pack - Public Sector Finance',
  'Study Pack - Applied Banking',
  'Study Pack - Corporate Financial Services',
  'Professional E-Payment Certification Guide- Introduction to Electronic Payment',
  'Professional E-Payment Certification Guide- E-Payment Regulation',
  'Professional E-Payment Certification Guide - Electronic Payment Operations',
  'MicroFinance Study Guide - Risk Mgt & Internal Control in Microfinance Institutions (Module IV)',
  'New Banking Professional Examination Syllabus (Starting October 2021)',
  'Module VI - Digital Finance in Microfinance Institutions',
  'Micro-Finance Study Guide - Small & Medium Enterprises Mgt & Development (Module VII)',
  'Micro-Finance Study Guide - Product Development & Marketing Management (Module III)',
  'Micro-Finance Study Guide - Evolution Mgt & Regulation of Microfinancing (Module I)',
  'Micro-Finance Study Guide - Financial Analysis and Performance Monitoring in MFIs (Module II)',
  'Micro-Finance Study Guide - Ethics & Corporate Governance (Module V)',
  'New Syllabus for Microfinance Certification Programme (MCP)',
  'Syllabus for Certificate in Treasury Management',
  'Syllabus for Certificate in Mortgage Finance',
  'Syllabus for Certificate in Human Capital Management',
  'Syllabus for Certificate in Corporate Finance and Investment Banking',
  'MCP Training Manual'
].map((title, i) => ({
  number: i + 1,
  title,
  priceNGN: i < 61 ? 2000 : i < 69 ? 1000 : i < 74 ? 500 : 1000,
  source: SOURCE.PORTAL
}));

const DOWNLOADABLE_DOCUMENTS_VISIBLE = [
  'OCTOBER 2023 DIET EXAMINERS REPORT',
  'APRIL 2026 EXAMINER\'S REPORT',
  'OCTOBER 2022 EXAMINERS REPORT'
].map(title => ({title, source: SOURCE.PORTAL, type:'downloadable'}));

const INTEREST_DOMAINS = [
  {key:'operations', label:'Operations', match:/operations?|domestic|foreign operations|settlement|process/i, courseCodes:['CBO101','CBO102','EP102','EP203','EP104','EP207','CAB104']},
  {key:'credit', label:'Credit / Lending', match:/credit|lending|loan|facility|borrow|collateral/i, courseCodes:['803','MF302','CFDIS103','CPS103','CAB203']},
  {key:'audit', label:'Audit', match:/audit|assurance|control testing/i, courseCodes:['805','EP205','CRC101','CDB104','CAB203']},
  {key:'risk', label:'Risk', match:/risk|enterprise risk|liquidity|market risk/i, courseCodes:['702','MF401','CAB203','CRC104','803','704']},
  {key:'compliance', label:'Compliance / Regulation', match:/compliance|regulation|regulatory|aml|governance/i, courseCodes:['603','805','EP103','EP204','EP205','CRC102','CFDIS101','CNB105']},
  {key:'digital', label:'Digital Banking / Fintech', match:/digital|fintech|cyber|data analytics|payment systems/i, courseCodes:['701','703','CDB101','CDB102','CDB103','CDB104','CDB105','CDB106','CDB107','EP201','EP202','EP203','EP205']},
  {key:'agency', label:'Agency Banking', match:/agency|agent banking|agent network/i, courseCodes:['806','CAB101','CAB102','CAB103','CAB104','CAB201','CAB202','CAB203','CAB204','CAB301','CAB302','CAB303','CAB304']},
  {key:'treasury', label:'Treasury / Global Markets', match:/treasury|foreign exchange|fx|money market|global market|investment/i, courseCodes:['704','801']},
  {key:'sme', label:'SME / Enterprise', match:/sme|small business|enterprise/i, courseCodes:['808','MF404','CAB302']},
  {key:'agriculture', label:'Agriculture / Rural Banking', match:/agri|agricultural|rural/i, courseCodes:['809']},
  {key:'hr', label:'Human Resources', match:/human resource|hr|people management/i, courseCodes:['810']},
  {key:'publicSector', label:'Public Sector Finance', match:/public sector|government finance|public debt/i, courseCodes:['812','CPS101','CPS102','CPS104']},
  {key:'nonInterest', label:'Non-Interest Banking', match:/non.?interest|islamic finance|sharia/i, courseCodes:['CNB101','CNB102','CNB103','CNB104','CNB105']},
  {key:'depositInsurance', label:'Central Banking / Deposit Insurance', match:/deposit insurance|central banking|ndic/i, courseCodes:['811','CFDIS101','CFDIS102','CFDIS104']},
  {key:'customerService', label:'Customer Service / Relationship', match:/customer service|relationship management|customer experience/i, courseCodes:['602','CAB102']},
  {key:'sustainable', label:'Sustainable Banking / ESG', match:/sustainable|esg|environmental|social risk/i, courseCodes:['CSB101','CSB102','CSB103','CSB104','CSB105','CSB106','CSB107','CSB108']}
];

function course(code) {
  const key = String(code || '').toLowerCase();
  return COURSE_MAP.find(x => x.code.toLowerCase() === key) || null;
}

function conflicts(codes) {
  const rows = (codes || []).map(course).filter(Boolean);
  const groups = new Map();
  for (const row of rows) {
    const key = row.date + '|' + row.time;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([slot, items]) => ({slot, courses:items.map(x => ({code:x.code,name:x.name}))}));
}

function validateSelection(codes, {program=''} = {}) {
  const rows = (codes || []).map(course).filter(Boolean);
  const errors = [];
  const electiveCount = rows.filter(x => x.elective).length;
  if (/chartered banker/i.test(program) && electiveCount > 3) {
    errors.push(RULES.charteredBankerElectiveMax.rule);
  }
  return {errors, conflicts:conflicts(codes), courses:rows};
}

function findInterest(message) {
  const text = String(message || '');
  return INTEREST_DOMAINS.filter(x => x.match.test(text)).map(x => x);
}

function publicationsFor(message) {
  const text = String(message || '').toLowerCase();
  if (!/(handout|publication|study pack|syllabus|examiner|mcp manual|materials|book|download)/i.test(text)) return [];
  return PUBLICATION_CATALOG.filter(x => text.length < 12 || x.title.toLowerCase().split(/\s+/).some(word => word.length > 4 && text.includes(word))).slice(0, 12);
}

function contextForQuery(message, focusCourse='') {
  const q = String(message || '');
  const lower = q.toLowerCase();
  const selectedFocus = focusCourse ? course(focusCourse) : null;
  const interests = findInterest(q);
  const publications = publicationsFor(q);
  const relevantCodes = new Set();
  for (const i of interests) for (const code of i.courseCodes) relevantCodes.add(code);
  if (selectedFocus) relevantCodes.add(selectedFocus.code);

  // Direct course-code/name retrieval.
  for (const row of COURSE_MAP) {
    if (lower.includes(row.code.toLowerCase()) || lower.includes(row.name.toLowerCase())) relevantCodes.add(row.code);
  }

  let relevantCourses = COURSE_MAP.filter(x => relevantCodes.has(x.code));
  if (/course|subject|paper|exam|timetable|clash|schedule/i.test(lower) && !relevantCourses.length) {
    relevantCourses = selectedFocus ? [selectedFocus] : [];
  }

  const context = [];
  if (relevantCourses.length) {
    context.push({
      type:'portal_course_data',
      authority:'owner portal screenshot',
      courses:relevantCourses
    });
    if (/(clash|conflict|same time|timetable|schedule|register)/i.test(lower)) {
      context.push({type:'portal_rules', rules:[RULES.charteredBankerElectiveMax,RULES.exemptionTiming,RULES.exemptionFailedSubject]});
    }
  }
  if (publications.length) context.push({type:'portal_publications', count:PUBLICATION_CATALOG.length, items:publications});
  if (/(fee|price|cost|how much|subscription|payment|charge)/i.test(lower)) {
    context.push({type:'observed_portal_fees', fees:OBSERVED_FEES});
  }
  if (/(exemption|exempt|probable exemption|failed)/i.test(lower)) {
    context.push({type:'exemption_rules', rules:[RULES.exemptionFailedSubject,RULES.exemptionTiming,RULES.exemptionUpload]});
  }
  if (/(download|broken|404|mapping|old subject|handout|publication)/i.test(lower)) {
    context.push({type:'portal_edge_cases', rules:[RULES.oldSubjectMapping,RULES.publicationCopyright], downloadableDocuments:DOWNLOADABLE_DOCUMENTS_VISIBLE});
  }
  if (interests.length) {
    context.push({type:'career_interest_domains', domains:interests.map(x => ({key:x.key,label:x.label,courseCodes:x.courseCodes}))});
  }
  return context;
}

module.exports = {
  SOURCE,
  COURSE_MAP,
  PROGRAMME_SECTIONS_VISIBLE_BUT_EMPTY,
  RULES,
  OBSERVED_FEES,
  PUBLICATION_CATALOG,
  DOWNLOADABLE_DOCUMENTS_VISIBLE,
  INTEREST_DOMAINS,
  course,
  conflicts,
  validateSelection,
  findInterest,
  publicationsFor,
  contextForQuery
};
