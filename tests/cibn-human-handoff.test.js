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
  assert.match(chat, /mode === 'human'/);
  assert.match(chat, /queueHumanAbba/);
});

test('CIBN landing uses ABBA-controlled human support, not direct WhatsApp navigation', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', '..', 'mcp-bot', 'index.html'), 'utf8');
  assert.match(html, /humanSupportTop/);
  assert.match(html, /mode:'human'/);
  assert.match(html, /Contact human ABBA/);
  assert.doesNotMatch(html, /<a class="human" href="https:\/\/wa\.me\//);
});
