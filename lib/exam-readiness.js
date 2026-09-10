function daysBetween(a, b) { const ms = new Date(a).getTime() - new Date(b).getTime(); return Number.isFinite(ms) ? Math.ceil(ms / 86400000) : null; }
function avg(scores) { const v = scores.filter(Number.isFinite); return v.length ? Math.round(v.reduce((a,b)=>a+b,0)/v.length) : null; }
function readiness(days, score) {
  if (days == null && score == null) return 'unknown';
  if (score != null && score < 50) return 'needs-attention';
  if (days != null && days <= 14 && (score == null || score < 70)) return 'needs-attention';
  if (days != null && days <= 30 && (score == null || score < 80)) return 'building';
  return 'on-track';
}
function buildExamReadiness({ now = new Date().toISOString(), courses = [], exams = [], practice = [] } = {}) {
  const examByCourse = new Map();
  for (const exam of exams) {
    const code = String(exam.course_code || exam.course || '').trim().toUpperCase();
    const date = exam.starts_at || exam.start_at || exam.exam_date || exam.date;
    if (code && date && !examByCourse.has(code)) examByCourse.set(code, { ...exam, date });
  }
  const scores = new Map();
  for (const p of practice) {
    const code = String(p.course_code || p.course || '').trim().toUpperCase();
    const score = Number(p.score ?? p.percentage);
    if (code && Number.isFinite(score)) scores.set(code, [...(scores.get(code) || []), score]);
  }
  const resultCourses = [...new Set(courses.map(c => String(c).trim().toUpperCase()).filter(Boolean))].map(course_code => {
    const exam = examByCourse.get(course_code);
    const practice_average = avg(scores.get(course_code) || []);
    const days_to_exam = exam ? daysBetween(exam.date, now) : null;
    return { course_code, exam_date: exam?.date || null, days_to_exam, practice_average, readiness: readiness(days_to_exam, practice_average), next_action: readiness(days_to_exam, practice_average) === 'needs-attention' ? 'Start a focused revision session and practice weak areas.' : 'Keep building with targeted practice.' };
  });
  resultCourses.sort((a,b) => (a.days_to_exam ?? 9999) - (b.days_to_exam ?? 9999));
  return { generated_at: new Date(now).toISOString(), courses: resultCourses, known_exam_count: resultCourses.filter(x => x.days_to_exam != null).length };
}
module.exports = { buildExamReadiness };
