const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('index.html', 'utf8');

test('public NOUN BOT landing page is focused on one clear student journey', () => {
  assert.match(source, /Study at NOUN,/);
  assert.match(source, /at your pace/);
  assert.match(source, /Learn/);
  assert.match(source, /Prepare/);
  assert.match(source, /Plan/);
  assert.match(source, /Get help/);
  assert.match(source, /Ask ABBA/);
  assert.match(source, /Create my student space/);
});

test('public landing page uses product imagery rather than feature-card overload', () => {
  assert.match(source, /assets\/promo\/noun-bot-ad-tailored\.jpg/);
  assert.match(source, /assets\/promo\/noun-bot-ad-hero\.jpg/);
  assert.match(source, /assets\/promo\/noun-bot-ad-menu\.jpg/);
  assert.match(source, /assets\/promo\/noun-bot-ad-social-proof\.jpg/);
  assert.match(source, /loading="lazy"/);
});

test('public landing page uses purposeful motion with reduced-motion support', () => {
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /@keyframes/);
  assert.match(source, /prefers-reduced-motion/);
});

test('public landing page does not expose private student data', () => {
  assert.match(source, /Official NOUN sources prioritized/i);
  assert.doesNotMatch(source, /password_hash|service_role_key/i);
});

test('public landing page has accessible responsive structure', () => {
  assert.match(source, /lang="en"/);
  assert.match(source, /aria-label="NOUN BOT product preview"/);
  assert.match(source, /@media\(max-width:850px\)/);
  assert.match(source, /focus-visible/);
});
