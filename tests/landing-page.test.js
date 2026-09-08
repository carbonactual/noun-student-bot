const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('index.html', 'utf8');

test('public root is a landing page, not an automatic dashboard redirect', () => {
  assert.doesNotMatch(source, /http-equiv=["']refresh/i);
  assert.doesNotMatch(source, /location\.replace\(/i);
  assert.doesNotMatch(source, /location\.href\s*=\s*["']\/dashboard\//i);
  assert.match(source, /<main id=["']main["']/i);
  assert.match(source, /NOUN BOT/i);
});

test('landing page covers the canonical NOUN academic pathway', () => {
  for (const label of [
    'Certificate',
    'Undergraduate',
    'Postgraduate Diploma',
    "Master's",
    'PhD / Doctoral'
  ]) {
    assert.ok(source.includes(label), `missing academic pathway: ${label}`);
  }
});

test('landing page communicates product position and core capabilities', () => {
  for (const phrase of [
    'student operating layer',
    'InstituteGPT',
    'study, progression, research',
    'Skills + careers',
    'Financial access intelligence',
    'Governance + participation',
    'WhatsApp'
  ]) {
    assert.ok(source.includes(phrase), `missing landing-page phrase: ${phrase}`);
  }
});

test('landing page preserves the operational dashboard and trust boundaries', () => {
  assert.match(source, /href=["']\/dashboard\//i);
  assert.match(source, /Mock assessments support learning; they are not live exams\./i);
  assert.match(source, /does not impersonate a student or take examinations/i);
  assert.match(source, /do not originate credit, move money or execute investments/i);
  assert.match(source, /Private academic information is not exposed/i);
});
