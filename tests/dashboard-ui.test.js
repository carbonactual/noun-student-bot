const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('dashboard/index.html', 'utf8');

test('public NOUN BOT landing page presents the student-first product', () => {
  assert.match(source, /Your <span class="accent">AI academic companion\.<\/span>/);
  assert.match(source, /What it helps with/);
  assert.match(source, /How it works/);
  assert.match(source, /Join NOUN BOT/);
  assert.match(source, /Personalised support/);
  assert.match(source, /Prepare with confidence/);
  assert.match(source, /Stay on track/);
});

test('public landing page does not expose private student data', () => {
  assert.match(source, /We do not display your details publicly/i);
  assert.doesNotMatch(source, /matric number|password_hash|service_role_key/i);
});

test('public landing page has accessible responsive structure', () => {
  assert.match(source, /lang="en"/);
  assert.match(source, /name="full_name"/);
  assert.match(source, /type="email"/);
  assert.match(source, /aria-label|role="status"/);
  assert.match(source, /@media\(max-width:850px\)/);
});
