const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('dashboard/index.html', 'utf8');

test('admin dashboard presents the living ecosystem view', () => {
  assert.match(source, /Omni/);
  assert.match(source, /Value given/);
  assert.match(source, /Pulse received/);
  assert.match(source, /Flows/);
  assert.match(source, /Opportunities/);
  assert.match(source, /NOUN BOT/);
  assert.match(source, /RITES/);
  assert.match(source, /NGIN/);
});

test('admin dashboard preserves privacy-safe operational data language', () => {
  assert.match(source, /Privacy-safe/i);
  assert.doesNotMatch(source, /phone number|email address|matric number/i);
});

test('admin dashboard has responsive navigation and ecosystem sections', () => {
  assert.match(source, /aria-label="Primary navigation"/);
  assert.match(source, /id="ecosystem"/);
  assert.match(source, /id="pulse"/);
  assert.match(source, /id="flows"/);
  assert.match(source, /id="opportunities"/);
});
