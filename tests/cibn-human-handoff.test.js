const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('CIBN human handoff normalizes Nigerian phone numbers', () => {
  const { normalizePhone } = require('../lib/human-abba');
  assert.equal(normalizePhone('0704 648 1828'), '2347046481828');
});

test('CIBN chat exposes explicit human mode handoff', async () => {
  const chat = fs.readFileSync(path.join(__dirname, '..', 'lib', 'cibn-chat.js'), 'utf8');
  assert.match(chat, /mode === 'service'/);
  assert.match(chat, /queueHumanAbba/);
});

test('CIBN service requests are the ABBA handoff path', () => {
  const chat = fs.readFileSync(path.join(__dirname, '..', 'lib', 'cibn-chat.js'), 'utf8');
  const helper = fs.readFileSync(path.join(__dirname, '..', 'lib', 'human-abba.js'), 'utf8');
  assert.match(chat, /mode === 'service'/);
  assert.match(chat, /human ABBA service team/);
  assert.match(helper, /collection: 'cibn_service_requests'/);
  assert.match(helper, /route: 'service_request'/);
});
