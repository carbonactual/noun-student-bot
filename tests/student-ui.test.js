const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('student/index.html', 'utf8');

test('student space is centered on the academic day', () => {
  for (const marker of ['Academic pulse', 'Your priorities', 'Your courses', 'Deadlines & events', 'Past-question matches', 'Human support', 'Ask ABBA']) {
    assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('student space retains the core AI study modes and live APIs', () => {
  for (const mode of ['tutor', 'tutorial', 'practice', 'revision']) assert.match(source, new RegExp(`data-mode="${mode}"`));
  assert.match(source, /\/api\/student-intelligence/);
  assert.match(source, /\/api\/ai-study/);
});

test('student space surfaces actionable intelligence without exposing raw student records', () => {
  for (const marker of ['course_momentum', 'support_recommendations', 'deadlines', 'events', 'practice', 'priorities']) assert.match(source, new RegExp(marker));
  assert.doesNotMatch(source, /password_hash|waec_result|neco_result/);
});

test('student space uses rounded sans typography and accessible responsive behavior', () => {
  assert.match(source, /ui-rounded/);
  assert.match(source, /system-ui/);
  assert.doesNotMatch(source, /Iowan Old Style|Palatino Linotype|Book Antiqua|Georgia,serif/i);
  assert.match(source, /aria-label/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /@media\(max-width:(920|620)px\)/);
});
