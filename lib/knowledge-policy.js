const AUTHORITY_WEIGHT = { A: 1, B: 0.85, C: 0.65, D: 0.25 };

function freshnessScore(retrievedAt, maxAgeHours = 168) {
  if (!retrievedAt) return 0;
  const age = Math.max(0, (Date.now() - new Date(retrievedAt).getTime()) / 3600000);
  return Math.max(0, 1 - age / maxAgeHours);
}

function claimScore({ authorityClass='D', verified=false, retrievedAt, confidence=0 }) {
  const authority = AUTHORITY_WEIGHT[authorityClass] || 0;
  const freshness = freshnessScore(retrievedAt);
  return Math.min(1, authority * 0.45 + (verified ? 0.3 : 0) + freshness * 0.15 + Math.max(0, Math.min(1, confidence)) * 0.1);
}

function canAnswer(claim, threshold = 0.7) {
  return Boolean(claim && claim.review_status === 'approved' && claim.verified && Number(claim.score ?? claim.confidence ?? 0) >= threshold);
}

function buildEvidence(claim, document, source) {
  return { claimId: claim.id, claim: claim.claim, sourceId: source.id, sourceName: source.name, url: source.url, authorityClass: source.authority_class, documentId: document.id, retrievedAt: document.retrieved_at, effectiveAt: document.effective_at || null };
}

module.exports = { freshnessScore, claimScore, canAnswer, buildEvidence };
