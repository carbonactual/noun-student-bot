const { db, tenantId } = require('./knowledge');
const { buildCourseWorkspace } = require('./student-context');

function cleanPhone(value) { return String(value || '').replace(/\D/g, ''); }
function lower(value) { return String(value || '').toLowerCase(); }
function scoreMatch(query, value) {
  const q = new Set(lower(query).split(/[^a-z0-9]+/).filter(x => x.length > 2));
  const t = lower(value);
  let score = 0;
  for (const word of q) if (t.includes(word)) score += 1;
  return score;
}
function dateValue(row) {
  for (const key of ['due_date', 'event_date', 'start_at', 'starts_at', 'date', 'scheduled_at']) {
    if (row?.[key]) return new Date(row[key]);
  }
  return null;
}
function daysAway(row) {
  const d = dateValue(row);
  if (!d || Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}
async function safeRows(table, builder) {
  try {
    const result = await builder(db.from(table).select('*'));
    return result.data || [];
  } catch {
    return [];
  }
}
async function getStudent(phone) {
  const tid = await tenantId();
  const normalized = cleanPhone(phone);
  if (!normalized) return null;
  const { data } = await db.from('students').select('*').eq('tenant_id', tid).eq('phone', normalized).maybeSingle();
  return data || null;
}

async function buildStudentIntelligence(phone, question = '') {
  const tid = await tenantId();
  const normalized = cleanPhone(phone);
  if (!normalized) throw new Error('phone required');
  const student = await getStudent(normalized);
  if (!student) return {
    student: null, personalized: false, priorities: [], events: [], deadlines: [], practice: [],
    services: [], support_recommendations: [], course_momentum: [], course_workspace: [], recent_activity: [], insights: []
  };

  const legacyCourses = Array.isArray(student.courses) ? student.courses : [];
  const [enrolments, canonicalCourses] = await Promise.all([
    safeRows('student_course_enrolments', q => q.eq('tenant_id', tid).eq('student_phone', normalized).eq('status', 'active').order('updated_at', { ascending: false })),
    safeRows('courses', q => q.eq('tenant_id', tid).eq('active', true).limit(500))
  ]);
  const courseWorkspace = buildCourseWorkspace(enrolments, canonicalCourses);
  const courses = courseWorkspace.length ? courseWorkspace.map(x => x.course_code) : legacyCourses;
  const courseSet = new Set(courses.map(lower));
  const relevant = row => {
    if (!courses.length) return true;
    const blob = lower(JSON.stringify(row));
    return courses.some(c => blob.includes(lower(c)));
  };

  const [deadlines, events, activity, assessments, services, helpRequests, insights, courseContent] = await Promise.all([
    safeRows('deadlines', q => q.eq('tenant_id', tid).gte('due_date', new Date().toISOString().slice(0, 10)).order('due_date').limit(50)),
    safeRows('academic_events', q => q.eq('tenant_id', tid).limit(100)),
    safeRows('student_activity', q => q.eq('tenant_id', tid).eq('phone', normalized).order('created_at', { ascending: false }).limit(60)),
    safeRows('past_questions', q => q.eq('tenant_id', tid).limit(150)),
    safeRows('student_services', q => q.eq('tenant_id', tid).limit(60)),
    safeRows('help_requests', q => q.eq('tenant_id', tid).eq('phone', normalized).order('created_at', { ascending: false }).limit(20)),
    safeRows('insights', q => q.eq('tenant_id', tid).eq('phone', normalized).order('created_at', { ascending: false }).limit(20)),
    safeRows('course_content', q => q.eq('tenant_id', tid).limit(250))
  ]);

  const relevantDeadlines = deadlines.filter(relevant).slice(0, 12).map(x => ({
    type: 'deadline',
    urgency_days: daysAway(x),
    title: x.title || x.name || x.activity || 'Academic deadline',
    description: x.description || x.detail || x.course_code || 'Review this item.',
    course_code: x.course_code || x.course || null,
    due_date: x.due_date || null,
    ...x
  }));

  const relevantEvents = events.filter(relevant)
    .filter(x => ['verified', 'supplementary', 'active', 'published', 'scheduled'].includes(lower(x.status)) || !x.status)
    .sort((a, b) => (dateValue(a)?.getTime() || Infinity) - (dateValue(b)?.getTime() || Infinity))
    .slice(0, 12);

  const recentActivity = activity.map(x => ({
    event_type: x.event_type,
    course_code: x.course_code,
    topic: x.topic,
    created_at: x.created_at,
    metadata: x.metadata
  }));

  const momentumMap = new Map(courses.map(course => [lower(course), { course_code: course, activity_count: 0, last_topic: null, last_seen_at: null, label: 'Needs attention' }]));
  for (const item of recentActivity) {
    const code = lower(item.course_code);
    const entry = [...momentumMap.entries()].find(([key]) => code && key.includes(code) || code && code.includes(key));
    if (!entry) continue;
    const bucket = entry[1];
    bucket.activity_count += 1;
    if (!bucket.last_seen_at || new Date(item.created_at) > new Date(bucket.last_seen_at)) {
      bucket.last_seen_at = item.created_at;
      bucket.last_topic = item.topic || null;
    }
  }
  const courseMomentum = [...momentumMap.values()].map(x => ({
    ...x,
    label: x.activity_count >= 6 ? 'Strong momentum' : x.activity_count >= 2 ? 'In progress' : 'Needs attention'
  })).sort((a, b) => a.activity_count - b.activity_count);

  const practice = assessments
    .filter(relevant)
    .map(x => ({ ...x, _score: scoreMatch(question, JSON.stringify(x)) + (courses.some(c => lower(JSON.stringify(x)).includes(lower(c))) ? 2 : 0) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 12)
    .map(({ _score, ...x }) => x);

  const matchedServices = services.filter(relevant).slice(0, 12);
  const openRequests = helpRequests.filter(x => !['resolved', 'closed', 'completed'].includes(lower(x.status)));
  const supportRecommendations = matchedServices.slice(0, 6).map(x => ({
    title: x.name || x.title || x.service_name || 'Student support',
    description: x.description || x.detail || 'Relevant human support is available.',
    service_type: x.service_type || x.type || 'support',
    source_url: x.source_url || x.url || null
  }));

  const priorities = [
    ...relevantDeadlines.map(x => ({ ...x, priority_score: x.urgency_days == null ? 10 : x.urgency_days <= 2 ? 100 : x.urgency_days <= 7 ? 80 : 60 })),
    ...courseMomentum.filter(x => x.label === 'Needs attention').slice(0, 4).map(x => ({
      type: 'course', priority_score: 45, title: `Study ${x.course_code}`, description: x.last_topic ? `Continue with ${x.last_topic}.` : 'Start a focused study session for this course.', course_code: x.course_code
    })),
    ...(openRequests.length ? [{ type: 'support', priority_score: 70, title: 'Follow up on your support request', description: 'You have a support request that still needs attention.' }] : [])
  ].sort((a, b) => b.priority_score - a.priority_score).slice(0, 10);

  return {
    personalized: true,
    updated_at: new Date().toISOString(),
    student: {
      phone: normalized,
      full_name: student.full_name || null,
      study_level: student.study_level || student.level || null,
      programme_title: student.programme_title || null,
      level: student.level || null,
      faculty: student.faculty || null,
      department: student.department || null,
      courses
    },
    course_workspace: courseWorkspace,
    priorities,
    deadlines: relevantDeadlines,
    events: relevantEvents,
    practice,
    services: matchedServices,
    support_recommendations: supportRecommendations,
    course_momentum: courseMomentum,
    recent_activity: recentActivity,
    insights: insights.map(x => ({ title: x.title || x.name || 'Insight', detail: x.detail || x.description || null, created_at: x.created_at, type: x.type || x.insight_type || null }))
  };
}
module.exports = { buildStudentIntelligence, cleanPhone, getStudent };
