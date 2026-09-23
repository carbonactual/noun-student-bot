const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('student/index.html', 'utf8');
const has = (value) => assert.ok(source.includes(value), 'missing marker: '+value);

test('student space keeps the home simple and student-centered', () => {
  for (const marker of ['Academic pulse', 'Your priorities', 'Your profile', 'Study Lab', 'Add notes / material', 'Study guide', '10-question practice', 'Flashcards', 'Explain simply', '25-minute plan', 'Quiz me', 'ABBA', 'Learn', 'Prepare', 'Plan', 'Get help', 'Ask ABBA']) has(marker);
  for (const removed of ['Your courses', 'Deadlines & events', 'Past-question matches', 'Human support']) assert.ok(!source.includes(removed), 'unexpected marker: '+removed);
});

test('student space keeps intelligence and AI underneath the simpler surface', () => {
  for (const mode of ['tutor', 'tutorial', 'practice', 'revision']) has('data-mode="'+mode+'"');
  for (const endpoint of ['/api/student-intelligence', '/api/ai-study']) has(endpoint);
  has('Your student context');
  has('source_text');
  has('18000');
  has('application/pdf');
  has('image/png');
  has('audio/mpeg');
  has('data-motion-tilt');
  has('motion-progress');
  has('pointer-glow');
  has('startViewTransition');
  has('AbortController');
  has('45000');
  has('1500000');
  assert.ok(!source.includes('course_momentum'));
  assert.ok(!source.includes('support_recommendations'));
});

test('student space does not expose raw student records', () => {
  assert.ok(!/password_hash|waec_result|neco_result/.test(source));
});

test('student space keeps motion resilient and accessible', () => {
  has('prefers-reduced-motion');
  has('window.matchMedia');
  has('IntersectionObserver');
  has('dragover');
  has('material-file');
  has('Remove ');
});

test('student space uses rounded sans typography and accessible responsive behavior', () => {
  has('ui-rounded');
  has('system-ui');
  assert.ok(!/Iowan Old Style|Palatino Linotype|Book Antiqua|Georgia,serif/i.test(source));
  has('aria-label');
  has('prefers-reduced-motion');
  has('@media(max-width:900px)');
  has('@media(max-width:620px)');
});
