const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('auth/index.html', 'utf8');

test('NOUN BOT signup uses progressive disclosure', () => {
  assert.match(source, /Step 1 of 2/);
  assert.match(source, /Step 2 of 2/);
  assert.match(source, /id="step1"/);
  assert.match(source, /id="step2"/);
  assert.match(source, /id="next"/);
  assert.match(source, /id="backStep"/);
});

test('NOUN BOT signup preserves canonical backend field names', () => {
  for (const marker of [
    'name="full_name"',
    'name="email"',
    'name="phone"',
    'name="matric_number"',
    'name="school_email"',
    'name="password"',
    'name="password_confirm"'
  ]) {
    assert.ok(source.includes(marker), 'missing ' + marker);
  }
});

test('NOUN BOT auth has sign in, recovery and safe next-path handling', () => {
  assert.match(source, /auth-login/);
  assert.match(source, /auth-recover/);
  assert.match(source, /auth-reset/);
  assert.match(source, /nextPath/);
  assert.match(source, /!raw\.startsWith\('\/\/'\)/);
});

test('NOUN BOT auth has accessible motion-aware UI', () => {
  assert.match(source, /role="tablist"/);
  assert.match(source, /role="status"/);
  assert.match(source, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(source, /autocomplete="new-password"/);
});
