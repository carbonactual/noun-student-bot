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

test('landing page communicates the ecosystem position and full capability scope', () => {
  for (const phrase of [
    'learner operating layer',
    'InstituteGPT',
    'study, progression, research',
    'Research + projects',
    'Student services',
    'Skills + careers',
    'Student economy',
    'Financial access intelligence',
    'Governance + participation',
    'WhatsApp',
    'Audubon Continuum',
    'Carbon Actual'
  ]) {
    assert.ok(source.includes(phrase), `missing landing-page phrase: ${phrase}`);
  }
});

test('landing page includes the motion choreography and accessibility fallback', () => {
  assert.match(source, /cdn\.jsdelivr\.net\/npm\/motion@12\.23\.12\/\+esm/i);
  assert.match(source, /animate\(/i);
  assert.match(source, /inView\(/i);
  assert.match(source, /scroll\(/i);
  assert.match(source, /prefers-reduced-motion/i);
});

test('landing page preserves the operational dashboard and trust boundaries', () => {
  assert.match(source, /href=["']\/dashboard\//i);
  assert.match(source, /practice is not the live exam/i);
  assert.match(source, /does not take examinations or impersonate students/i);
  assert.match(source, /does not originate credit, move money or execute investments/i);
  assert.match(source, /Private learner data remains private/i);
});
