import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('.carbon-actual/product-inheritance.json', 'utf8'));
const productReadme = await readFile('README.md', 'utf8');

test('NOUN BOT is explicitly subordinate to InstituteGPT', () => {
  assert.match(productReadme, /under InstituteGPT/i);
  assert.match(manifest.abba_role, /InstituteGPT/i);
  assert.equal(manifest.constitutional_compliance, true);
});

test('NOUN academic continuity covers all canonical stages', () => {
  for (const stage of ['certificate', 'undergraduate', 'postgraduate diploma', "master's", 'PhD']) {
    assert.match(manifest.identity_model, new RegExp(stage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});

test('NOUN retains evidence and privacy boundaries', () => {
  assert.match(manifest.provenance_model, /source, authority, freshness/i);
  assert.match(manifest.security_model, /private academic data/i);
});
