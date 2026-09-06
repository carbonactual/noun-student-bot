function buildOeiLearnerContext(student = {}, context = {}) {
  return {
    id: String(student.phone || student.id || context.id || 'unknown'),
    identity: { full_name: student.full_name || student.name || null },
    goals: context.goals || [],
    learningHistory: context.learningHistory || [],
    relationships: [
      ...(context.programmes || []).map((id) => ({ type: 'enrols-in', target: id })),
      ...(context.courses || []).map((id) => ({ type: 'studies', target: id })),
    ],
    skills: context.skills || [],
    opportunities: context.opportunities || [],
    institution: 'noun',
  };
}

function routeThroughOei(intent, nounAdapter) {
  if (!nounAdapter) return { routed: false, reason: 'NOUN adapter unavailable' };
  const workflow = nounAdapter.workflows?.[intent] || null;
  return workflow ? { routed: true, workflow, adapterId: nounAdapter.id } : { routed: false, reason: 'OEI adapter has no workflow for intent' };
}

module.exports = { buildOeiLearnerContext, routeThroughOei };
