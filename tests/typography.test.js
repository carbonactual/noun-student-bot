const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

for (const file of ['dashboard/index.html', 'student/index.html']) {
  test(`${file} uses the NOUN typography system`, () => {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /--font:/);
    assert.match(source, /ui-rounded/);
    assert.match(source, /system-ui/);
    assert.doesNotMatch(source, /Iowan Old Style|Palatino Linotype|Book Antiqua|Georgia,serif/i);
    assert.doesNotMatch(source, /font-family:Inter,ui-sans-serif,system-ui/);
  });
}
