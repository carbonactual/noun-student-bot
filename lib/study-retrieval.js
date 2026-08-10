/**
 * Read-only academic retrieval layer.
 * It may read course_content but must never mutate students, registrations,
 * deadlines, checklists, or other authoritative academic state.
 */

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3);
}

function scoreChunk(query, chunk) {
  const queryTerms = [...new Set(tokenize(query))];
  const haystack = `${chunk.course_code || ''} ${chunk.module_title || ''} ${chunk.content || ''}`.toLowerCase();
  let score = 0;
  for (const term of queryTerms) {
    if (haystack.includes(term)) score += 1;
    if (String(chunk.module_title || '').toLowerCase().includes(term)) score += 2;
    if (String(chunk.course_code || '').toLowerCase() === term) score += 4;
  }
  return score;
}

async function retrieveCourseEvidence({ supabase, query, courses = [], limit = 4 }) {
  if (!supabase || !query || !Array.isArray(courses) || !courses.length) return [];
  const allowedCourses = [...new Set(courses.map((c) => String(c).trim().toUpperCase()).filter(Boolean))].slice(0, 20);
  if (!allowedCourses.length) return [];

  const { data, error } = await supabase
    .from('course_content')
    .select('id,course_code,module_title,content')
    .in('course_code', allowedCourses);

  if (error) throw error;
  return (data || [])
    .map((chunk) => ({ ...chunk, score: scoreChunk(query, chunk) }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(limit, 8)));
}

function buildGroundingContext(evidence) {
  return (evidence || []).map((item, index) =>
    `[SOURCE ${index + 1}] ${item.course_code} — ${item.module_title}\n${item.content}`
  ).join('\n\n');
}

module.exports = { retrieveCourseEvidence, buildGroundingContext, scoreChunk };
