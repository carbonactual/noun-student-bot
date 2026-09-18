const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/cibn-catalog');

function responseMock() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    end() { return this; }
  };
}

test('catalog endpoint exposes October 2026 MCP timetable and selection rules', () => {
  const req = { method: 'GET', headers: { origin: 'https://mcp-bot-eight.vercel.app' } };
  const res = responseMock();
  handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://mcp-bot-eight.vercel.app');
  assert.equal(res.body.catalog_version, '2026-10-official-timetable');
  const mf403 = res.body.courses.find(x => x.code === 'MF403');
  const mf404 = res.body.courses.find(x => x.code === 'MF404');
  assert.equal(mf403.date, '2026-10-07');
  assert.equal(mf403.time, '09:00-12:00');
  assert.equal(mf404.date, '2026-10-07');
  assert.equal(mf404.time, '14:00-17:00');
  assert.ok(res.body.selection_rules.mcp.electiveCodes.includes('MF403'));
  assert.ok(res.body.selection_rules.mcp.electiveCodes.includes('MF404'));
});

test('catalog endpoint does not emit permissive CORS for unknown origin', () => {
  const req = { method: 'GET', headers: { origin: 'https://attacker.example' } };
  const res = responseMock();
  handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Access-Control-Allow-Origin'], undefined);
});

test('catalog endpoint validates programme-specific course selections', () => {
  const req = {
    method: 'POST',
    headers: { origin: 'https://mcp-bot-eight.vercel.app' },
    body: { program: 'ACIB', level: 'Chartered Banker', codes: ['805','806'] }
  };
  const res = responseMock();
  handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.mode, 'selection-validation');
  assert.ok(res.body.warnings.some(x => /select only one/i.test(x)));
  assert.equal(res.body.errors.length, 0);
});

test('catalog endpoint exposes session-cap conflicts without inventing numeric limits', () => {
  const req = {
    method: 'POST',
    headers: { origin: 'https://mcp-bot-eight.vercel.app' },
    body: { program: 'E-Payments', codes: ['701','702','801'] }
  };
  const res = responseMock();
  handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.sameDisplayedSession.length > 0, true);
  assert.equal(res.body.errors.length, 0);
});
