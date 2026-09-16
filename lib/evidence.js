const DAY = 86400000;
const AUTHORITY = Object.freeze({
  1: 'official_noun',
  2: 'official_courseware',
  3: 'official_news',
  4: 'verified_secondary',
  5: 'external'
});

function freshnessState(retrievedAt) {
  if (!retrievedAt) return 'unknown';
  const age = (Date.now() - new Date(retrievedAt).getTime()) / DAY;
  if (!Number.isFinite(age)) return 'unknown';
  if (age < 7) return 'fresh';
  if (age < 30) return 'current';
  if (age < 180) return 'stale';
  return 'expired';
}

function normalizeEvidence(row = {}) {
  const tier = Number(row.authority_tier || row.source_tier || 5);
  const authority = AUTHORITY[tier] || 'external';
  const freshness = row.freshness_state || freshnessState(row.retrieved_at || row.verified_at);
  const verification = row.verification_state || row.verification_status || (tier <= 3 ? 'verified' : 'unverified');
  return {
    title: String(row.title || row.claim || row.name || row.question || 'Evidence').slice(0, 500),
    url: row.url || row.source_url || null,
    authority_tier: tier,
    authority,
    verification_state: verification,
    freshness_state: freshness,
    retrieved_at: row.retrieved_at || row.verified_at || null,
    effective_date: row.effective_date || null,
    expiry_date: row.expiry_date || null,
    source_type: row.source_type || row.kind || 'unknown'
  };
}

function evidenceDecision(rows = []) {
  const evidence = rows.map(normalizeEvidence).filter(Boolean);
  if (!evidence.length) return { decision: 'escalate', reason: 'no-evidence', evidence };
  const authoritativeFresh = evidence.some(e => e.authority_tier <= 2 && ['fresh', 'current'].includes(e.freshness_state) && ['verified', 'official'].includes(e.verification_state));
  const authoritativeAny = evidence.some(e => e.authority_tier <= 3 && ['verified', 'official'].includes(e.verification_state));
  if (authoritativeFresh) return { decision: 'answer', reason: 'authoritative-fresh-evidence', evidence };
  if (authoritativeAny && !evidence.some(e => e.freshness_state === 'expired')) return { decision: 'answer-with-caveat', reason: 'authoritative-but-aging-evidence', evidence };
  return { decision: 'escalate', reason: 'insufficient-or-stale-authority', evidence };
}

module.exports = { AUTHORITY, normalizeEvidence, evidenceDecision, freshnessState };
