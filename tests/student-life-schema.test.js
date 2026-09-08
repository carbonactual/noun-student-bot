const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const sql = fs.readFileSync('supabase-student-ecosystem-v3.sql', 'utf8');
const executableSql = sql.split('\n').filter(line => !line.trim().startsWith('--')).join('\n');

test('student life schema contains events, groups, sports and excursions', () => {
  for (const table of ['student_events','student_event_participants','student_groups','student_group_memberships']) assert.match(executableSql, new RegExp(`create table if not exists ${table}\\b`));
  assert.match(executableSql, /event_type text not null/);
  assert.match(executableSql, /location text/);
  assert.match(executableSql, /verification_status text not null/);
});

test('governance schema supports open ballot publication without betting fields', () => {
  assert.match(executableSql, /student_governance_cycles/);
  assert.match(executableSql, /student_governance_candidates/);
  assert.match(executableSql, /student_ballot_publication/);
  assert.doesNotMatch(executableSql, /odds|wager|stake|payout/i);
});

test('skills and work schemas include skills acquisition and work pathways', () => {
  assert.match(executableSql, /student_skills/);
  assert.match(executableSql, /skill_opportunities/);
  assert.match(executableSql, /work_opportunities/);
  assert.match(executableSql, /skills text\[\] not null/);
  assert.match(executableSql, /apprenticeship/);
  for (const term of ['internship','employment','siwes','nysc']) assert.match(executableSql, new RegExp(term));
});
