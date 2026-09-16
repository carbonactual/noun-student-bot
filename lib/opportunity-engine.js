function tokens(value) {
  return new Set(String(value || '').toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 2));
}

function overlap(a, b) {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let hits = 0;
  for (const item of left) if (right.has(item)) hits += 1;
  return hits / Math.max(left.size, right.size);
}

function scoreOpportunity(student = {}, opportunity = {}) {
  const programme = overlap(student.programme_title, (opportunity.programme_tags || []).join(' '));
  const skills = overlap((student.skills || []).join(' '), (opportunity.skills || []).join(' '));
  const interests = overlap((student.interests || []).join(' '), `${opportunity.type || ''} ${opportunity.tags || ''} ${opportunity.title || ''}`);
  const location = student.location && opportunity.location ? (String(student.location).toLowerCase() === String(opportunity.location).toLowerCase() ? 0.15 : 0) : 0;
  const verified = ['verified', 'official'].includes(String(opportunity.verification_status || '').toLowerCase()) ? 0.25 : 0;
  return programme * 0.3 + skills * 0.3 + interests * 0.15 + location + verified;
}

function publicOpportunity(opportunity, score) {
  return {
    id: opportunity.id || null,
    title: opportunity.title || opportunity.name || 'Opportunity',
    type: opportunity.type || opportunity.category || 'opportunity',
    organisation: opportunity.organisation || opportunity.provider || null,
    location: opportunity.location || null,
    deadline: opportunity.deadline || null,
    source_url: opportunity.source_url || opportunity.url || null,
    verification_status: opportunity.verification_status || null,
    match_score: Number(score.toFixed(4))
  };
}

function rankOpportunities(student = {}, opportunities = [], limit = 12) {
  return opportunities
    .map(item => ({ item, score: scoreOpportunity(student, item) }))
    .filter(({ item }) => ['verified', 'official'].includes(String(item.verification_status || '').toLowerCase()))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item, score }) => publicOpportunity(item, score));
}

module.exports = { scoreOpportunity, rankOpportunities, publicOpportunity };
