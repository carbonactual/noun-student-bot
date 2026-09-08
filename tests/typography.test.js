const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

for (const file of ['dashboard/index.html', 'student/index.html']) {
  test(`${file} uses the NOUN typography system`, () => {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /--font-display/);
    assert.match(source, /--font-body/);
    assert.doesNotMatch(source, /font-family:Inter,ui-sans-serif,system-ui/);
  });
}
