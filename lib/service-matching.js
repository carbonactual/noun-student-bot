const VERIFICATION_SCORE = Object.freeze({
  qualification_verified: 30,
  institution_verified: 28,
  identity_verified: 20,
  unverified: 0,
  suspended: -100
});

function norm(value) { return String(value || '').trim().toLowerCase(); }
function list(value) { return Array.isArray(value) ? value.map(norm).filter(Boolean) : []; }

function rankProviders(request = {}, providers = []) {
  const wantedCategory = norm(request.category);
  const wantedSkills = list(request.skills);
  const wantedLocation = norm(request.location);
  const results = [];

  for (const provider of providers || []) {
    const safetyFlags = list(provider.safety_flags);
    if (safetyFlags.length || norm(provider.verification_status) === 'suspended') continue;
    if (provider.public_profile === false) continue;
    if (provider.available === false) continue;

    let score = 0;
    const reasons = [];
    const providerSkills = list(provider.skills);

    if (wantedCategory && norm(provider.category) === wantedCategory) {
      score += 40;
      reasons.push('Category match');
    }

    const matchedSkills = wantedSkills.filter(skill => providerSkills.includes(skill));
    if (matchedSkills.length) {
      score += Math.min(25, matchedSkills.length * 10);
      reasons.push(`Skill match: ${matchedSkills.join(', ')}`);
    }

    const verification = norm(provider.verification_status);
    score += VERIFICATION_SCORE[verification] || 0;
    if ((VERIFICATION_SCORE[verification] || 0) > 0) reasons.push(`Verification: ${verification}`);

    if (wantedLocation && norm(provider.location) === wantedLocation) {
      score += 15;
      reasons.push('Location match');
    } else if (wantedLocation && provider.remote_available && request.remote_ok !== false) {
      score += 8;
      reasons.push('Remote-compatible');
    }

    if (provider.available === true) reasons.push('Available');

    results.push({
      id: provider.id,
      score: Number(score.toFixed(3)),
      reasons,
      safety_flags: safetyFlags
    });
  }

  return results.sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));
}

module.exports = { rankProviders };
