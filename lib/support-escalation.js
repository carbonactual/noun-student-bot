const CATEGORIES = ['Academic','Registration','Course registration','Examinations','Results','Fees/payment','Study centre','Technical','Portal access','Programme info','Documents','Graduation','Complaints','Emergency/help'];
function classifySupportRequest(text = '') {
  const t = String(text).toLowerCase();
  if (/result|grade|score|transcript/.test(t)) return 'Results';
  if (/portal|login|password|access|sign in/.test(t)) return 'Portal access';
  if (/register|registration|course reg/.test(t)) return 'Registration';
  if (/exam|examination|tma|test/.test(t)) return 'Examinations';
  if (/fee|payment|school fee/.test(t)) return 'Fees/payment';
  if (/study centre|centre/.test(t)) return 'Study centre';
  if (/complaint|complain/.test(t)) return 'Complaints';
  return 'Academic';
}
function buildSupportCase({ phone, category, description, course_code = null, urgency = 'normal' } = {}) {
  const selected = CATEGORIES.includes(category) ? category : classifySupportRequest(description);
  return { student_phone: String(phone || '').replace(/\D/g,''), category: selected, description: String(description || '').trim(), course_code: course_code || null, urgency, status:'OPEN', resolution:null, created_at:new Date().toISOString() };
}
module.exports = { CATEGORIES, classifySupportRequest, buildSupportCase };
