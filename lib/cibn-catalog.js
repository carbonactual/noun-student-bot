// CIBN BOT — screenshot-grounded operational catalog.
// Source hierarchy:
//   1) Current official CIBN pages / current CIBN publications
//   2) Owner-supplied CIBN portal screenshots from 17 Sep 2026
//   3) Owner-supplied commercial product observations
//
// Important: a portal guard on one programme is NOT a universal CIBN rule.
// A displayed timetable slot is NOT automatically a clash; use the programme's
// actual selection rule and the official session-duration rule.

const SOURCE = {
  OFFICIAL_EXAMS: 'cibn_official_examinations_overview_current',
  OFFICIAL_MCP: 'cibn_official_mcp_page_current',
  OFFICIAL_EPAYMENTS: 'cibn_official_e_payment_programme_current',
  OFFICIAL_CIB: 'cibn_official_certificate_in_banking_current',
  OFFICIAL_FEE_TABLE: 'cibn_official_fee_schedule_current',
  OFFICIAL_MCP_FORM_2019: 'cibn_official_mcp_form_2019',
  OFFICIAL_TIMETABLE_RULE: 'cibn_official_february_2026_timetable_rule',
  PORTAL: 'owner_portal_screenshot_2026-09-17',
  MEMBERSHIP_LETTER: 'owner_cibn_membership_letter_2026-09-17',
  DIGITAL_STOREFRONT: 'owner_cibn_digital_screenshots_2026-09-17',
  UNKNOWN_PORTAL_GUARD: 'portal_guard_scope_not_unique_in_source_package'
};

function row(program, level, code, name, date, time, type, opts = {}) {
  return {
    program, level: level || null, code, name,
    date: date || null, time: time || null,
    type: type || 'course',
    elective: type === 'elective',
    selectionRule: opts.selectionRule || null,
    source: opts.source || SOURCE.PORTAL,
    authority: opts.authority || 'portal_observation',
    note: opts.note || null
  };
}

const COURSE_MAP = [
  // Banking Professional / ACIB — October 2026 portal timetable
  row('ACIB', 'Diploma', '601', 'Economics of Banking & Finance', '2026-10-06', '14:00-17:00', 'core'),
  row('ACIB', 'Diploma', '602', 'Customer Service & Relationship Management', '2026-10-06', '14:00-17:00', 'core'),
  row('ACIB', 'Diploma', '603', 'Banking Law and Regulation', '2026-10-07', '09:00-12:00', 'core'),
  row('ACIB', 'Diploma', '604', 'Ethics, Corporate Governance & Professionalism', '2026-10-08', '14:00-17:00', 'core'),

  row('ACIB', 'Intermediate Professional', '701', 'Digital Banking', '2026-10-06', '09:00-12:00', 'core'),
  row('ACIB', 'Intermediate Professional', '702', 'Enterprise Risk Management', '2026-10-06', '09:00-12:00', 'core'),
  row('ACIB', 'Intermediate Professional', '703', 'Fintech', '2026-10-08', '14:00-17:00', 'core'),
  row('ACIB', 'Intermediate Professional', '704', 'Finance in the Global Market', '2026-10-07', '14:00-17:00', 'core'),

  row('ACIB', 'Chartered Banker', '801', 'Corporate Financial Services', '2026-10-06', '09:00-12:00', 'core'),
  row('ACIB', 'Chartered Banker', '802', 'Bank Management and Strategy', '2026-10-07', '09:00-12:00', 'core'),
  row('ACIB', 'Chartered Banker', '803', 'Lending and Credit Management', '2026-10-08', '09:00-12:00', 'core'),
  row('ACIB', 'Chartered Banker', '804', 'Applied Banking', '2026-10-06', '14:00-17:00', 'core'),
  row('ACIB', 'Chartered Banker', '805', 'Bank Audit and Compliance', '2026-10-08', '14:00-17:00', 'elective'),
  row('ACIB', 'Chartered Banker', '806', 'Agency Banking', '2026-10-08', '14:00-17:00', 'elective'),
  row('ACIB', 'Chartered Banker', '807', 'Infrastructure Finance', '2026-10-08', '14:00-17:00', 'elective'),
  row('ACIB', 'Chartered Banker', '808', 'SME’s Finance', '2026-10-08', '14:00-17:00', 'elective'),
  row('ACIB', 'Chartered Banker', '809', 'Agricultural & Rural Banking', '2026-10-08', '14:00-17:00', 'elective'),
  row('ACIB', 'Chartered Banker', '810', 'Human Resource Management', '2026-10-08', '14:00-17:00', 'elective'),
  row('ACIB', 'Chartered Banker', '811', 'Central Banking/Deposit Insurance System', '2026-10-08', '14:00-17:00', 'elective'),
  row('ACIB', 'Chartered Banker', '812', 'Public Sector Finance', '2026-10-08', '14:00-17:00', 'elective'),
  row('ACIB', 'Chartered Banker', '813', 'Experiential Learning Module', '2026-10-09', '09:00-12:00', 'core'),

  // MCP — current portal timetable
  row('MCP', 'Microfinance I', 'MF301', 'The Evolution Management and Regulation of Microfinancing', '2026-10-06', '09:00-12:00', 'core', {source: SOURCE.PORTAL}),
  row('MCP', 'Microfinance I', 'MF302', 'Financial Analysis and Performance Monitoring in Microfinance Institutions', '2026-10-06', '09:00-12:00', 'core', {source: SOURCE.PORTAL}),
  row('MCP', 'Microfinance I', 'MF303', 'Product Development and Marketing Management', '2026-10-06', '14:00-17:00', 'core', {source: SOURCE.PORTAL}),
  row('MCP', 'Microfinance II', 'MF401', 'Risk Management and Internal Control in Microfinance Institutions', '2026-10-07', '09:00-12:00', 'core', {source: SOURCE.PORTAL}),
  row('MCP', 'Microfinance II', 'MF402', 'Ethics and Corporate Governance', '2026-10-07', '14:00-17:00', 'core', {source: SOURCE.PORTAL}),
  row('MCP', 'Microfinance II', 'MF403', 'Digital Finance in Microfinance Institution', '2026-10-06', '09:00-12:00', 'elective', {source: SOURCE.PORTAL}),
  row('MCP', 'Microfinance II', 'MF404', 'Small and Medium Enterprises Management and Development', '2026-10-07', '14:00-17:00', 'elective', {source: SOURCE.PORTAL}),

  // Professional e-Payment — current portal timetable
  row('E-Payments', 'E-Payment I', 'EP101', 'Introduction to Electronic Payments', '2026-10-06', '09:00-12:00', 'core'),
  row('E-Payments', 'E-Payment I', 'EP102', 'E-Payment Operations', '2026-10-06', '09:00-12:00', 'core'),
  row('E-Payments', 'E-Payment I', 'EP103', 'E-Payment Regulation', '2026-10-06', '14:00-17:00', 'core'),
  row('E-Payments', 'E-Payment I', 'EP104', 'E-Payment Operations Simulation Lab & Experiential Learning', '2026-10-07', '09:00-12:00', 'core'),
  row('E-Payments', 'E-Payment II', 'EP201', 'The Business of Digital Financial Services & Innovation', '2026-10-08', '09:00-12:00', 'core'),
  row('E-Payments', 'E-Payment II', 'EP202', 'Digital Identity', '2026-10-08', '09:00-12:00', 'core'),
  row('E-Payments', 'E-Payment II', 'EP203', 'E-Payment Technology and Operations', '2026-10-06', '14:00-17:00', 'core'),
  row('E-Payments', 'E-Payment II', 'EP204', 'The Regulatory Environment for DFS', '2026-10-07', '14:00-17:00', 'core'),
  row('E-Payments', 'E-Payment II', 'EP205', 'E-Payment Security, Audit & Compliance', '2026-10-07', '14:00-17:00', 'core'),
  row('E-Payments', 'E-Payment II', 'EP206', 'Financial Inclusion', '2026-10-09', '09:00-12:00', 'core'),
  row('E-Payments', 'E-Payment II', 'EP207', 'E-Payment Operations Simulation Lab & Experiential Learning', '2026-10-07', '09:00-12:00', 'core'),

  // Agency Banking — all 12 visible selected in owner portal screenshot
  row('Agency Banking', 'CAB1', 'CAB101', 'Agency Banking Law & Regulations', '2026-10-06', '09:00-12:00', 'core'),
  row('Agency Banking', 'CAB1', 'CAB102', 'Customer Service & Agency Banking Relationship Mgt', '2026-10-07', '09:00-12:00', 'core'),
  row('Agency Banking', 'CAB1', 'CAB103', 'Financial Inclusion', '2026-10-06', '09:00-12:00', 'core'),
  row('Agency Banking', 'CAB1', 'CAB104', 'Operating Models, Channels & Services', '2026-10-07', '09:00-12:00', 'core'),
  row('Agency Banking', 'CAB2', 'CAB201', 'Entrepreneurship & Innovation', '2026-10-06', '14:00-17:00', 'core'),
  row('Agency Banking', 'CAB2', 'CAB202', 'Contemporary Issues in Agency Banking', '2026-10-06', '14:00-17:00', 'core'),
  row('Agency Banking', 'CAB2', 'CAB203', 'Risk, Control & Reconciliation', '2026-10-07', '14:00-17:00', 'core'),
  row('Agency Banking', 'CAB2', 'CAB204', 'Digital Financial Services', '2026-10-07', '14:00-17:00', 'core'),
  row('Agency Banking', 'CAB3', 'CAB301', 'Ethics, Corporate Governance & Professionalism', '2026-10-07', '09:00-12:00', 'core'),
  row('Agency Banking', 'CAB3', 'CAB302', 'Micro & SME Finance', '2026-10-07', '09:00-12:00', 'core'),
  row('Agency Banking', 'CAB3', 'CAB303', 'Agency Performance Management', '2026-10-08', '09:00-12:00', 'core'),
  row('Agency Banking', 'CAB3', 'CAB304', 'Experiential Learning/Multi-Disciplinary Case Study', '2026-10-08', '09:00-12:00', 'core'),

  // Other Certification catalogue — October 2026 portal
  row('Certification Programme', 'Non-Interest Banking', 'CNB101', 'Principles of Non-Interest Banking and Finance', '2026-10-07', '14:00-17:00', 'course'),
  row('Certification Programme', 'Non-Interest Banking', 'CNB102', 'Non-Interest Financial Institutions and Products', '2026-10-08', '09:00-12:00', 'course'),
  row('Certification Programme', 'Non-Interest Banking', 'CNB103', 'Financial Reporting in Non-Interest Banking and Finance', '2026-10-08', '09:00-12:00', 'course'),
  row('Certification Programme', 'Non-Interest Banking', 'CNB104', 'Management of Non-Interest Financial Institutions', '2026-10-07', '14:00-17:00', 'course'),
  row('Certification Programme', 'Non-Interest Banking', 'CNB105', 'Ethics and Corporate Governance', '2026-10-07', '14:00-17:00', 'course'),

  row('Certification Programme', 'Public Sector', 'CPS101', 'Public Sector', '2026-10-06', '14:00-17:00', 'course'),
  row('Certification Programme', 'Public Sector', 'CPS102', 'Public Finance', '2026-10-06', '14:00-17:00', 'course'),
  row('Certification Programme', 'Public Sector', 'CPS103', 'Credit Risk Management', '2026-10-07', '14:00-17:00', 'course'),
  row('Certification Programme', 'Public Sector', 'CPS104', 'Public Debt Management', '2026-10-07', '14:00-17:00', 'course'),

  row('Certification Programme', 'Loan Processing and Documentation', 'CLPD101', 'Banking Law, Ethics and Corporate Governance', '2026-10-07', '09:00-12:00', 'course'),
  row('Certification Programme', 'Loan Processing and Documentation', 'CLPD102', 'Practice of Banking', '2026-10-07', '09:00-12:00', 'course'),
  row('Certification Programme', 'Loan Processing and Documentation', 'CLPD103', 'Mortgage Finance', '2026-10-07', '09:00-12:00', 'course'),
  row('Certification Programme', 'Loan Processing and Documentation', 'CLPD104', 'Property Law', '2026-10-07', '09:00-12:00', 'course'),

  row('Certification Programme', 'Deposit Insurance System Certification', 'CFDIS101', 'Banking Regulation, Law & Supervision', '2026-10-07', '09:00-12:00', 'course'),
  row('Certification Programme', 'Deposit Insurance System Certification', 'CFDIS102', 'Fundamentals of Deposit Insurance', '2026-10-07', '09:00-12:00', 'course'),
  row('Certification Programme', 'Deposit Insurance System Certification', 'CFDIS103', 'Banking Practice & Credit Management', '2026-10-07', '09:00-12:00', 'course'),
  row('Certification Programme', 'Deposit Insurance System Certification', 'CFDIS104', 'Practice of Deposit Insurance System in Nigeria', '2026-10-07', '09:00-12:00', 'course'),

  row('Certification Programme', 'Banking Operations', 'CBO101', 'Domestic Operations', '2026-10-06', '14:00-17:00', 'course'),
  row('Certification Programme', 'Banking Operations', 'CBO102', 'Foreign Operations', '2026-10-06', '14:00-17:00', 'course'),

  row('Certification Programme', 'Digital Banking', 'CDB101', 'Fundamentals in Digital Banking', '2026-10-06', '14:00-17:00', 'course'),
  row('Certification Programme', 'Digital Banking', 'CDB102', 'E-Commerce, Internet Laws and Data Security', '2026-10-06', '09:00-12:00', 'course'),
  row('Certification Programme', 'Digital Banking', 'CDB103', 'Disruptive Innovation', '2026-10-06', '09:00-12:00', 'course'),
  row('Certification Programme', 'Digital Banking', 'CDB104', 'Information, System Audit and Cyber Security', '2026-10-07', '09:00-12:00', 'course'),
  row('Certification Programme', 'Digital Banking', 'CDB105', 'Data Analytics in Banking', '2026-10-07', '09:00-12:00', 'course'),
  row('Certification Programme', 'Digital Banking', 'CDB106', 'Digital Banking Trends', '2026-10-07', '14:00-17:00', 'course'),
  row('Certification Programme', 'Digital Banking', 'CDB107', 'Payment Systems', '2026-10-07', '14:00-17:00', 'course'),

  row('Certification Programme', 'Reporting and Compliance', 'CRC101', 'Audit', '2026-10-07', '09:00-12:00', 'course'),
  row('Certification Programme', 'Reporting and Compliance', 'CRC102', 'Compliance', '2026-10-07', '09:00-12:00', 'course'),
  row('Certification Programme', 'Reporting and Compliance', 'CRC103', 'Management Control and Financial Reporting', '2026-10-08', '09:00-12:00', 'course'),
  row('Certification Programme', 'Reporting and Compliance', 'CRC104', 'Risk Management', '2026-10-08', '09:00-12:00', 'course'),

  row('Certification Programme', 'Sustainable Banking', 'CSB101', 'Fundamentals of Sustainable Banking', '2026-10-07', '09:00-12:00', 'course'),
  row('Certification Programme', 'Sustainable Banking', 'CSB102', 'Business Case for Environmental and Social Risk Management', '2026-10-07', '14:00-17:00', 'course'),
  row('Certification Programme', 'Sustainable Banking', 'CSB103', 'Environmental & Social Management System', '2026-10-07', '14:00-17:00', 'course'),
  row('Certification Programme', 'Sustainable Banking', 'CSB104', 'Local Environment and Social Principles, Regulation and Standards', '2026-10-07', '14:00-17:00', 'course'),
  row('Certification Programme', 'Sustainable Banking', 'CSB105', 'Regional and International Environmental and Social Principles and Standards', '2026-10-07', '09:00-12:00', 'course'),
  row('Certification Programme', 'Sustainable Banking', 'CSB106', 'Environmental and Social Risk and Impacts for Financing Products', '2026-10-07', '09:00-12:00', 'course'),
  row('Certification Programme', 'Sustainable Banking', 'CSB107', 'Environmental and Social Opportunities', '2026-10-07', '14:00-17:00', 'course'),
  row('Certification Programme', 'Sustainable Banking', 'CSB108', 'Sustainable Banking Practices', '2026-10-07', '14:00-17:00', 'course')
];

const SELECTION_RULES = {
  acibDiploma: {
    programme: 'ACIB',
    level: 'Diploma',
    rule: 'Four subjects are listed at Diploma level.',
    source: SOURCE.OFFICIAL_EXAMS,
    authority: 'official_cibn'
  },
  acibIntermediate: {
    programme: 'ACIB',
    level: 'Intermediate Professional',
    rule: 'Four subjects are listed at Intermediate Professional level.',
    source: SOURCE.OFFICIAL_EXAMS,
    authority: 'official_cibn'
  },
  acibCharteredBanker: {
    programme: 'ACIB',
    level: 'Chartered Banker',
    officialRule: 'Five core subjects plus eight electives; current CIBN overview says select only one elective.',
    portalGuard: 'Owner portal screenshot says maximum of three elective courses.',
    electiveCodes: ['805','806','807','808','809','810','811','812'],
    coreCodes: ['801','802','803','804','813'],
    source: SOURCE.OFFICIAL_EXAMS,
    portalSource: SOURCE.PORTAL,
    authority: 'official_rule_plus_portal_observation',
    action: 'Treat one elective as the current programme rule. Do not advise two or three electives merely because the portal guard says maximum three; flag the discrepancy.'
  },
  mcp: {
    programme: 'MCP',
    level: 'Microfinance II',
    coreCodes: ['MF401','MF402'],
    electiveCodes: ['MF403','MF404'],
    currentPortalObservation: 'MF403 and MF404 are both visibly marked Elective on the October 2026 portal screen.',
    olderOfficialFormRule: 'CIBN MCP form states candidates choose any one of the two elective courses.',
    source: SOURCE.PORTAL,
    supportingSource: SOURCE.OFFICIAL_MCP_FORM_2019,
    authority: 'portal_observation_with_older_official_form_support',
    action: 'Present MF403/MF404 as the elective pair; state the one-of-two rule with its older form provenance rather than pretending the current page states it.'
  },
  certification: {
    programme: 'Certification Programme',
    totalMaxCourses: 5,
    rule: 'Portal alert on this broad Certification Examination selection screen says: Amount Cannot Be Zero Or You Cannot Register More Than Five(5) Courses.',
    source: SOURCE.PORTAL,
    authority: 'portal_observation',
    action: 'Scope this max-five rule only to the Certification Programme selection context shown in the screenshot.'
  },
  ePayments: {
    programme: 'E-Payments',
    totalMaxCourses: null,
    rule: 'No numeric maximum is visible in the October 2026 screenshot. Eleven courses are shown selected, but the portal rejects the combination with an Examination Time-Table Clashes warning.',
    source: SOURCE.PORTAL,
    authority: 'portal_observation',
    action: 'Do not invent a numeric maximum. Validate the actual combination against the session timetable.'
  },
  agencyBanking: {
    programme: 'Agency Banking',
    totalMaxCourses: null,
    rule: 'Twelve courses are visibly selected on the October 2026 Agency Banking registration screen; no numeric maximum warning is visible.',
    source: SOURCE.PORTAL,
    authority: 'portal_observation',
    action: 'Do not invent a numeric maximum.'
  },
  otherCertificationSections: {
    programme: 'Certification Programme',
    note: 'Certified Risk Manager 1, 2 and 3; Ethics & Corporate Governance; and Banking Law, Regulation & Supervision appear as section headings with no course rows visible in this screenshot package.',
    source: SOURCE.PORTAL
  }
};

const SESSION_RULE = {
  rule: 'Candidates cannot combine courses exceeding 3-hour duration at a particular session.',
  source: SOURCE.OFFICIAL_TIMETABLE_RULE,
  authority: 'official_cibn',
  implication: 'Two courses sharing the same displayed 9am–12pm or 2pm–5pm session are not automatically a clash. A true clash requires the programme/course duration and total session load to exceed the permitted limit or an observed portal rejection.'
};

const OBSERVED_PORTAL_ERRORS = [
  {
    programme: 'Certification Programme',
    message: 'Amount Cannot Be Zero Or You Cannot Register More Than Five(5) Courses',
    source: SOURCE.PORTAL,
    scope: 'broad certification selection screen'
  },
  {
    programme: 'E-Payments',
    message: 'Examination Time-Table Clashes - You Cannot write Course Combination! Click Cancel to go Back and Adjust',
    source: SOURCE.PORTAL,
    scope: 'selection of all displayed E-Payment I + II courses'
  },
  {
    programme: 'Banking Professional',
    message: 'old subject to new syllabus mapping link returned HTTP 404 in the owner screenshot journey',
    source: SOURCE.PORTAL,
    scope: 'mapping link'
  }
];

const OBSERVED_FEES = [
  {item:'MCP October 2026 exam fee', amount:32500, currency:'NGN', source:SOURCE.PORTAL, authority:'portal_observation'},
  {item:'ACIB Diploma 4-subject portal/cart example', amount:41000, currency:'NGN', source:SOURCE.PORTAL, authority:'portal_observation'},
  {item:'ACIB Intermediate 4-subject portal/cart example', amount:87250, currency:'NGN', source:SOURCE.PORTAL, authority:'portal_observation', note:'Current CIBN fee table separately publishes ₦67,250 for four subjects; keep both as dated evidence with official current fee table preferred for institutional fee answers.'},
  {item:'ACIB Chartered Banker selected portal/cart example', amount:135000, currency:'NGN', source:SOURCE.PORTAL, authority:'portal_observation', note:'Example selection total, not universal level price.'},
  {item:'Agency Banking selected portal/cart example', amount:20750, currency:'NGN', source:SOURCE.PORTAL, authority:'portal_observation'},
  {item:'E-Payments all-displayed-courses portal/cart example', amount:271000, currency:'NGN', source:SOURCE.PORTAL, authority:'portal_observation', note:'Combination was rejected for timetable clash; not a valid universal total.'},
  {item:'Life Annual Subscription Payment screen example', amount:270000, currency:'NGN', source:SOURCE.PORTAL, authority:'portal_observation', note:'Do not equate to Student Member annual subscription without identifying the membership category.'},
  {item:'Student Member annual subscription in membership registration letter', amount:5000, currency:'NGN', source:SOURCE.MEMBERSHIP_LETTER, authority:'membership_letter'}
];

const OFFICIAL_EXAM_FEES = {
  'ACIB Diploma': [17000, 23500, 31500, 41000],
  'ACIB Intermediate Professional': [27500, 40750, 54000, 67250],
  'ACIB Chartered Banker': [35000, 52000, 69000, 86000, 103000, 120000],
  'Microfinance Certification Programme': [8750, 13500, 18250, 23000, 27750, 32500],
  'Agency Banking Programme': [11250, 16000, 20750, 25500, 30250, 35000],
  'Certified E-Payments Associate (CePA)': [35000, 57000, 79000, 101000, 123000, 145000],
  'Certified E-Payments Professional (CePP)': [38000, 60000, 82000, 104000, 126000, 148000, 170000],
  'Certification Programme': [27500, 44500, 61500, 78500, 95500, 112000],
  'Fintech Foundation': [45000, 75000, 105000, 135000],
  'Fintech Intermediate': [60000, 90000, 120000]
};

const PUBLICATION_TITLES = [
  'Financial Reporting A Model...',
  'Management of Non-Interest Financial Institutions Study Pack',
  'Principles of Non-Interest Banking and Finance Module Study Pack',
  'Ethics and Corporate Governance Principles and Practices Study Pack',
  'Agency Performance Management Study Pack',
  'Digital Financial Services Study Pack',
  'CONTEMPORARY ISSUES IN AGENCY BANKING STUDY PACK',
  'Agency Banking Study Pack',
  'Module V - Ethics and Corporate Governance',
  'Agency Banking - Ethics and Corporate Governance Study Pack',
  'EXPERIENTIAL LEARNING MODULE',
  'The Business of DFS Innovation Study Pack',
  'E-Payments Technology & Operations Study Pack',
  'Digital Identity Study Pack',
  'THE REGULATORY ENVIRONMENT FOR DFS Study Pack',
  'Financial Inclusion Study Pack',
  'E-Payment Security Audit & Compliance Study Pack',
  'Study materials for PRACTICE OF BANKING STUDY PACK',
  'Study materials for Property Law Study Pack',
  'Study materials for Mortgage Finance Study Pack',
  'Study materials for Ethics and Corporate Governance Study Pack',
  'Study materials for Banking Law & Regulation Study Pack',
  'Study Pack for ENTREPRENEURSHIP & INNOVATION',
  'Study pack for Ethics Corporate Governance & Professionalism',
  'Study Pack for Risk Control and Reconciliation',
  'Study Pack for CUSTOMER SERVICE & AGENCY RELATIONSHIP MANAGEMENT',
  'Study Pack for AGENCY BANKING LAWS & REGULATIONS',
  'STUDY PACK FOR FINANCIAL INCLUSION',
  'Study pack for Operating Models, Channels & Services',
  'Study Pack - Infrastructure Finance',
  'EXPERIENTIAL LEARNING MODULE',
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
  'Study Pack-CUSTOMER SERVICE & RELATIONSHIP MGT',
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
];

const PUBLICATION_CATALOG = PUBLICATION_TITLES.map((title, i) => ({
  number: i + 1,
  title,
  priceNGN: i < 61 ? 2000 : i < 69 ? 1000 : i < 74 ? 500 : 1000,
  source: SOURCE.PORTAL,
  authority: 'portal_observation'
}));

const DOWNLOADABLE_DOCUMENTS_VISIBLE = [
  'OCTOBER 2023 DIET EXAMINERS REPORT',
  "APRIL 2026 EXAMINER'S REPORT",
  'OCTOBER 2022 EXAMINERS REPORT'
].map(title => ({title, type:'downloadable', source:SOURCE.PORTAL}));

const PORTAL_FIELDS = [
  'Other Name','Membership Category','Membership Status','Email Address','Mobile',
  'Qualification(s)','State of Residence','Last Examination','Company','Last Exam Center',
  'MTSP Training Centre','CIBN Branch','Linkage Institution','Examination Center',
  'Method of Study','Payment Currency','Syllabus'
];

const METHOD_OF_STUDY_OPTIONS = [
  'CIBN Accredited Lecture Centre',
  'Not Accredited Lecture Centre',
  'Private study Only'
];

const PORTAL_SECTIONS = [
  'My Applications','My Accounts','ePayments','Downloads','Communications','eLibrary'
];

const PROGRAMME_SECTIONS_VISIBLE_BUT_EMPTY = [
  'Certified Risk Manager 1',
  'Certified Risk Manager 2',
  'Certified Risk Manager 3',
  'Ethics & Corporate Governance',
  'Banking Law, Regulation & Supervision'
].map(name => ({name, source:SOURCE.PORTAL, status:'heading visible; no course rows visible in source package'}));

const INTEREST_DOMAINS = [
  {key:'operations', label:'Operations', match:/operations?|domestic operations|foreign operations|settlement|process/i, courseCodes:['CBO101','CBO102','EP102','EP203','EP104','EP207','CAB104']},
  {key:'credit', label:'Credit / Lending', match:/credit|lending|loan|facility|borrow|collateral/i, courseCodes:['803','CFDIS103','CPS103','CAB203','MF302']},
  {key:'audit', label:'Audit', match:/audit|assurance|control testing/i, courseCodes:['805','EP205','CRC101','CDB104','CAB203']},
  {key:'risk', label:'Risk', match:/risk|enterprise risk|liquidity|market risk/i, courseCodes:['702','MF401','CAB203','CRC104','803','704']},
  {key:'compliance', label:'Compliance / Regulation', match:/compliance|regulation|regulatory|aml|governance/i, courseCodes:['603','805','EP103','EP204','EP205','CRC102','CFDIS101','CNB105']},
  {key:'digital', label:'Digital Banking / Fintech', match:/digital|fintech|cyber|data analytics|payment systems/i, courseCodes:['701','703','CDB101','CDB102','CDB103','CDB104','CDB105','CDB106','CDB107','EP201','EP202','EP203','EP205']},
  {key:'agency', label:'Agency Banking', match:/agency|agent banking|agent network/i, courseCodes:['806','CAB101','CAB102','CAB103','CAB104','CAB201','CAB202','CAB203','CAB204','CAB301','CAB302','CAB303','CAB304']},
  {key:'treasury', label:'Treasury / Global Markets', match:/treasury|foreign exchange|fx|money market|global market/i, courseCodes:['704','801']},
  {key:'sme', label:'SME / Enterprise', match:/sme|small business|enterprise/i, courseCodes:['808','MF404','CAB302']},
  {key:'agriculture', label:'Agriculture / Rural Banking', match:/agri|agricultural|rural/i, courseCodes:['809']},
  {key:'hr', label:'Human Resources', match:/human resource|hr|people management/i, courseCodes:['810']},
  {key:'publicSector', label:'Public Sector Finance', match:/public sector|government finance|public debt/i, courseCodes:['812','CPS101','CPS102','CPS104']},
  {key:'nonInterest', label:'Non-Interest Banking', match:/non.?interest|islamic finance|sharia/i, courseCodes:['CNB101','CNB102','CNB103','CNB104','CNB105']},
  {key:'depositInsurance', label:'Central Banking / Deposit Insurance', match:/deposit insurance|central banking|ndic/i, courseCodes:['811','CFDIS101','CFDIS102','CFDIS104']},
  {key:'customerService', label:'Customer Service / Relationship', match:/customer service|relationship management|customer experience/i, courseCodes:['602','CAB102']},
  {key:'sustainable', label:'Sustainable Banking / ESG', match:/sustainable|esg|environmental|social risk/i, courseCodes:['CSB101','CSB102','CSB103','CSB104','CSB105','CSB106','CSB107','CSB108']}
];

const PROGRAMME_DIRECTORY = [
  {key:'ACIB', name:'Associationship / Banking Professional Examination', levels:['Diploma','Intermediate Professional','Chartered Banker']},
  {key:'MCP', name:'Micro-Finance Certification Program', levels:['Microfinance I','Microfinance II']},
  {key:'CIB', name:'Certificate in Banking', levels:['CIB I','CIB II','CIB III']},
  {key:'E-Payments', name:'Professional e-Payment Certification', levels:['CePA','CePP','CePS']},
  {key:'Agency Banking', name:'Agency Banking Certification', levels:['CAB1','CAB2','CAB3']},
  {key:'Certification Programme', name:'Other Certification Programmes', levels:['multiple specialist sections']},
  {key:'Exemption', name:'Exemption Application', levels:['Non-member probable exemption checker','Member application']},
  {key:'Resources', name:'CIBN publications, Downloads, eLibrary, Digital storefront and CCPD', levels:[]}
];

function course(code) {
  const key = String(code || '').toLowerCase();
  return COURSE_MAP.find(x => String(x.code).toLowerCase() === key) || null;
}

function coursesFor(programme, level) {
  return COURSE_MAP.filter(x =>
    (!programme || x.program === programme) &&
    (!level || x.level === level)
  );
}

function sameDisplayedSession(codes) {
  const rows = (codes || []).map(course).filter(Boolean);
  const groups = new Map();
  for (const item of rows) {
    if (!item.date || !item.time) continue;
    const key = item.date + '|' + item.time;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([slot, items]) => ({
      slot,
      courses: items.map(x => ({code:x.code,name:x.name})),
      status: 'same_displayed_session',
      warning: 'Do not call this a clash from the timestamp alone; confirm duration/selection rule.'
    }));
}

function confirmedClashes() {
  return OBSERVED_PORTAL_ERRORS.filter(x => /Time-Table Clashes/i.test(x.message));
}

function selectionRuleFor(programme, level) {
  if (/^ACIB$/i.test(programme) && /Chartered Banker/i.test(level || '')) return SELECTION_RULES.acibCharteredBanker;
  if (/^ACIB$/i.test(programme) && /Diploma/i.test(level || '')) return SELECTION_RULES.acibDiploma;
  if (/^ACIB$/i.test(programme) && /Intermediate/i.test(level || '')) return SELECTION_RULES.acibIntermediate;
  if (/^MCP$/i.test(programme)) return SELECTION_RULES.mcp;
  if (/^Certification Programme$/i.test(programme)) return SELECTION_RULES.certification;
  if (/^E-Payments$/i.test(programme)) return SELECTION_RULES.ePayments;
  if (/^Agency Banking$/i.test(programme)) return SELECTION_RULES.agencyBanking;
  return null;
}

function validateSelection(codes, {program='', level=''} = {}) {
  const rows = (codes || []).map(course).filter(Boolean);
  const result = {
    errors: [],
    warnings: [],
    sameDisplayedSession: sameDisplayedSession(codes),
    courses: rows,
    selectionRule: selectionRuleFor(program, level)
  };

  if (/^ACIB$/i.test(program) && /Chartered Banker/i.test(level || '')) {
    const electiveCount = rows.filter(x => x.elective).length;
    if (electiveCount > 3) result.errors.push(SELECTION_RULES.acibCharteredBanker.portalGuard);
    if (electiveCount > 1) result.warnings.push('Current official CIBN overview says select only one Chartered Banker elective; the portal screenshot separately displayed a maximum-three technical guard.');
  }

  if (/^Certification Programme$/i.test(program) && rows.length > 5) {
    result.errors.push(SELECTION_RULES.certification.rule);
  }

  if (/^MCP$/i.test(program)) {
    const electiveCount = rows.filter(x => x.elective && /^MF40/.test(x.code)).length;
    if (electiveCount > 1) result.warnings.push('MCP II shows two elective courses. CIBN’s older official MCP form says choose any one; confirm the current October 2026 rule before submitting.');
  }

  return result;
}

function findInterest(message) {
  const text = String(message || '');
  return INTEREST_DOMAINS.filter(x => x.match.test(text));
}

function publicationsFor(message) {
  const text = String(message || '').toLowerCase().trim();
  if (!/(handout|publication|study pack|syllabus|examiner|mcp manual|materials|book|download)/i.test(text)) return [];
  const words = text.split(/[^a-z0-9]+/i).filter(x => x.length > 3);
  const excluded = new Set(['handout','publication','publications','study','pack','packs','syllabus','examiner','examiners','materials','material','book','books','download','downloads','price','prices','cost','costs','show','list','give','find','the','their','from','cibn']);
  const terms = words.filter(x => !excluded.has(x));
  const matches = PUBLICATION_CATALOG.filter(p => terms.some(t => p.title.toLowerCase().includes(t)));
  return (matches.length ? matches : PUBLICATION_CATALOG).slice(0, 20);
}

function officialFee(program, count) {
  const rows = OFFICIAL_EXAM_FEES[program];
  const n = Number(count);
  return rows && Number.isInteger(n) && n > 0 && n <= rows.length ? rows[n - 1] : null;
}

function contextForQuery(message, focusCourse='') {
  const q = String(message || '');
  const lower = q.toLowerCase();
  const selected = focusCourse ? course(focusCourse) : null;
  const interests = findInterest(q);
  const publications = publicationsFor(q);
  const codes = [...new Set((q.toUpperCase().match(/\b(?:60\d|70\d|80\d|MF30\d|MF40\d|EP\d{3}|CAB\d{3}|CNB\d{3}|CPS\d{3}|CLPD\d{3}|CFDIS\d{3}|CBO\d{3}|CDB\d{3}|CRC\d{3}|CSB\d{3})\b/g) || []))];
  const directCourses = codes.map(course).filter(Boolean);
  const relevant = [...directCourses, ...(selected ? [selected] : [])].filter((x,i,a) => a.findIndex(y => y.code === x.code) === i);
  const ctx = [];

  if (relevant.length) ctx.push({
    type:'course_records',
    courses:relevant,
    authority:'portal_observation_for_October_2026_timetable'
  });

  if (/(clash|conflict|same time|timetable|schedule|register|selection|elective)/i.test(lower)) {
    ctx.push({
      type:'selection_rules',
      rules:[SELECTION_RULES.acibCharteredBanker,SELECTION_RULES.mcp,SELECTION_RULES.certification,SELECTION_RULES.ePayments,SELECTION_RULES.agencyBanking],
      sessionRule:SESSION_RULE
    });
    if (codes.length) ctx.push({type:'same_displayed_session_analysis', data:sameDisplayedSession(codes)});
  }

  if (/(fee|price|cost|amount|payment|subscription|charge)/i.test(lower)) {
    ctx.push({type:'official_fee_schedule', source:SOURCE.OFFICIAL_FEE_TABLE, fees:OFFICIAL_EXAM_FEES});
    ctx.push({type:'observed_portal_fees', fees:OBSERVED_FEES});
  }

  if (/(handout|publication|study pack|syllabus|examiner|mcp manual|materials|book|download)/i.test(lower)) {
    ctx.push({type:'publication_catalog', count:PUBLICATION_CATALOG.length, items:publications});
    ctx.push({type:'downloadable_documents', items:DOWNLOADABLE_DOCUMENTS_VISIBLE});
  }

  if (/(exemption|exempt|failed)/i.test(lower)) {
    ctx.push({
      type:'exemption_boundaries',
      rules:[
        'Portal says a candidate cannot be exempted from a subject they attempted and failed.',
        'Portal says exemption processes must be completed before the last examination paper.',
        'Portal exemption evidence upload shown is one PDF not larger than 2MB.'
      ],
      source:SOURCE.PORTAL
    });
  }

  if (/(field|area|interest|operations|credit|audit|risk|compliance|digital|agency|treasury|sme|agri|hr|public sector|non.?interest|deposit insurance|customer service|sustainable)/i.test(lower)) {
    ctx.push({
      type:'professional_interest_discovery',
      domains:interests.length ? interests.map(x => ({key:x.key,label:x.label,courseCodes:x.courseCodes})) : INTEREST_DOMAINS.map(x => ({key:x.key,label:x.label,courseCodes:x.courseCodes})),
      promptWhenNeeded:'Ask one short question about the candidate’s work or area of interest, then map it to relevant CIBN courses.'
    });
  }

  if (/(portal|my home|application|account|download|elibrary|e-library|communication|epayment|payment)/i.test(lower)) {
    ctx.push({type:'portal_navigation', sections:PORTAL_SECTIONS, fields:PORTAL_FIELDS, methodOfStudyOptions:METHOD_OF_STUDY_OPTIONS});
  }

  ctx.push({type:'programme_directory', programmes:PROGRAMME_DIRECTORY});
  return ctx;
}

module.exports = {
  SOURCE,
  COURSE_MAP,
  SELECTION_RULES,
  SESSION_RULE,
  OBSERVED_PORTAL_ERRORS,
  OBSERVED_FEES,
  OFFICIAL_EXAM_FEES,
  PUBLICATION_CATALOG,
  DOWNLOADABLE_DOCUMENTS_VISIBLE,
  PORTAL_FIELDS,
  METHOD_OF_STUDY_OPTIONS,
  PORTAL_SECTIONS,
  INTEREST_DOMAINS,
  PROGRAMME_DIRECTORY,
  PROGRAMME_SECTIONS_VISIBLE_BUT_EMPTY,
  course,
  coursesFor,
  sameDisplayedSession,
  confirmedClashes,
  selectionRuleFor,
  validateSelection,
  findInterest,
  publicationsFor,
  officialFee,
  contextForQuery
};

