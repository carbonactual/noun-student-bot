const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const sql = fs.readFileSync('supabase-student-ecosystem-v3.sql', 'utf8');

test('student life schema contains events, groups, sports and excursions', () => {
  for (const table of ['student_events','student_event_participants','student_groups','student_group_memberships']) {
    assert.match(sql, new RegExp(`create table if not exists ${table}\\b`));
  }
  assert.match(sql, /event_type text not null/);
  assert.match(sql, /location text/);
  assert.match(sql, /verification_status text not null/);
});

test('governance schema supports open ballot publication without wagering', () => {
  assert.match(sql, /student_governance_cycles/);
  assert.match(sql, /student_governance_candidates/);
  assert.match(sql, /student_ballot_publication/);
  assert.doesNotMatch(sql, /odds|wager|stake|payout/i);
});

test('skills and work schemas include skills acquisition, apprenticeship, internship, employment, SIWES and NYSC', () => {
  assert.match(sql, /skill_opportunities/);
  assert.match(sql, /work_opportunities/);
  for (const term of ['skills_acquisition','apprenticeship','internship','employment','siwes','nysc']) {
    assert.match(sql, new RegExp(term));
  }
});
