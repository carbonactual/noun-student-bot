const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('automation module contains the service-intelligence actions', () => {
  const source = fs.readFileSync('api/automation.js', 'utf8');
  assert.match(source, /expireStale/);
  assert.match(source, /recordDemand/);
  assert.match(source, /action==='expire'/);
  assert.match(source, /action==='demand'/);
  assert.match(source, /req\.method==='GET'/);
});

test('legacy service-intelligence route rewrites to automation', () => {
  const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  assert.ok(config.rewrites.some(r => r.source === '/api/service-intelligence' && r.destination === '/api/automation'));
});

test('legacy service-intelligence function is removed from the API surface', () => {
  assert.equal(fs.existsSync('api/service-intelligence.js'), false);
});
