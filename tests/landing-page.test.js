const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('index.html', 'utf8');

test('public root is a NOUN landing page, not an automatic dashboard redirect', () => {
  assert.doesNotMatch(source, /http-equiv=["']refresh/i);
  assert.doesNotMatch(source, /location\.replace\(/i);
  assert.doesNotMatch(source, /location\.href\s*=\s*["']\/dashboard\//i);
  assert.match(source, /<main id=["']main["']/i);
  assert.match(source, /NOUN BOT/i);
});

test('landing page gives applicants and students equal entry paths', () => {
  assert.match(source, /New to NOUN/i);
  assert.match(source, /Already a NOUN student/i);
  assert.match(source, /Create your NOUN space/i);
  assert.match(source, /I already have NOUN access/i);
  assert.match(source, /name=["']status["']/i);
});

test('onboarding is tailored to the NOUN academic path', () => {
  for (const label of ['Certificate','Undergraduate','Postgraduate Diploma',"Master's",'PhD / Doctoral']) {
    assert.ok(source.includes(label), `missing study level: ${label}`);
  }
  for (const field of ['faculty','programme','full-name','email','phone','state']) {
    assert.match(source, new RegExp(`id=["']${field}["']`, 'i'), `missing onboarding field: ${field}`);
  }
  assert.match(source, /Faculty\/area/i);
  assert.match(source, /Programme/i);
  assert.match(source, /study-centre details/i);
});

test('AI is visible and interactive on the public landing page', () => {
  assert.match(source, /Your academic AI companion/i);
  assert.match(source, /Ask NOUN BOT/i);
  assert.match(source, /id=["']ai-input["']/i);
  assert.match(source, /id=["']ask-ai["']/i);
  assert.match(source, /data-prompt=/i);
  assert.match(source, /id=["']ai-response["']/i);
});

test('landing page uses Motion with a reduced-motion fallback', () => {
  assert.match(source, /cdn\.jsdelivr\.net\/npm\/motion@12\.23\.12\/\+esm/i);
  assert.match(source, /animate\(/i);
  assert.match(source, /inView\(/i);
  assert.match(source, /prefers-reduced-motion/i);
});

test('landing page removes ecosystem grammar from the public experience', () => {
  for (const phrase of ['Audubon Continuum','Carbon Actual rails','learner operating layer','ecosystem','habitat']) {
    assert.doesNotMatch(source, new RegExp(phrase.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i'), `old public grammar remains: ${phrase}`);
  }
  assert.match(source, /A product of InstituteGPT/i);
});

test('trust boundaries remain explicit and dashboard route stays operational', () => {
  assert.match(source, /href=["']\/dashboard\//i);
  assert.match(source, /does not take examinations or submit graded work/i);
  assert.match(source, /Official NOUN decisions, records and consequential submissions stay with/i);
  assert.match(source, /source of record/i);
});
