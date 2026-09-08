const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('dashboard/index.html', 'utf8');

test('public NOUN BOT landing page presents the student-first product', () => {
  assert.match(source, /Your <span class="accent">AI academic companion<\/span>/);
  assert.match(source, /Learn/);
  assert.match(source, /Prepare/);
  assert.match(source, /Plan/);
  assert.match(source, /Get help/);
  assert.match(source, /Ask ABBA/);
});

test('public landing page uses a modern rounded sans typography system', () => {
  assert.match(source, /ui-rounded/);
  assert.match(source, /system-ui/);
  assert.doesNotMatch(source, /Iowan Old Style|Palatino Linotype|Book Antiqua|Georgia,serif/i);
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
  assert.match(source, /prefers-reduced-motion/);
});
