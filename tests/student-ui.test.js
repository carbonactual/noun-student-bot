const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('student/index.html', 'utf8');

test('student space is centered on the academic day', () => {
  assert.match(source, /Academic pulse/);
  assert.match(source, /What needs your attention/);
  assert.match(source, /Learn/);
  assert.match(source, /Prepare/);
  assert.match(source, /Plan/);
  assert.match(source, /Get help/);
  assert.match(source, /Ask ABBA/);
});

test('student space retains the core AI study modes and live APIs', () => {
  assert.match(source, /data-mode="tutor"/);
  assert.match(source, /data-mode="tutorial"/);
  assert.match(source, /data-mode="practice"/);
  assert.match(source, /data-mode="revision"/);
  assert.match(source, /\/api\/student-intelligence/);
  assert.match(source, /\/api\/ai-study/);
});

test('student space uses rounded sans typography and accessible responsive behavior', () => {
  assert.match(source, /ui-rounded/);
  assert.match(source, /system-ui/);
  assert.doesNotMatch(source, /Iowan Old Style|Palatino Linotype|Book Antiqua|Georgia,serif/i);
  assert.match(source, /aria-label/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /@media\(max-width:(900|620)px\)/);
});
