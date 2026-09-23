import fs from 'node:fs';

const requiredFiles = [
  'lib/student-context-kernel.js',
  'lib/event-continuity.js',
  'lib/evidence.js',
  'lib/opportunity-engine.js',
  'lib/human-escalation.js',
  'lib/pulse.js',
  'lib/noun-orchestrator.js',
  'lib/abba-runtime.js',
  'lib/abba-contract.js',
  'supabase-noun-operating-layer.sql',
  'tests/noun-operating-layer.test.js'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing required operating-layer artifact: ${file}`);
}

const sql = fs.readFileSync('supabase-noun-operating-layer.sql', 'utf8');
for (const marker of ['noun_events', 'noun_pulses', 'noun_human_escalations', 'row level security']) {
  if (!sql.toLowerCase().includes(marker.toLowerCase())) throw new Error(`Missing SQL conformance marker: ${marker}`);
}

const orchestrator = fs.readFileSync('lib/noun-orchestrator.js', 'utf8');
if (!orchestrator.includes('invokeAbba') || !orchestrator.includes('persistContinuity')) {
  throw new Error('NOUN orchestration contract is missing ABBA or continuity integration');
}

if (process.env.BASE_URL) {
  const root = `${process.env.BASE_URL.replace(/\/$/, '')}/`;
  const page = await fetch(root, { headers: { Accept: 'text/html' } });
  if (!page.ok) throw new Error(`Production surface returned HTTP ${page.status}`);
  const healthBase = (process.env.HEALTH_BASE_URL || process.env.BASE_URL).replace(/\/$/, '');
  const url = `${healthBase}/api/health`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Production health returned HTTP ${response.status}`);
  const body = await response.json();
  if (body.name !== 'ABBA Being Agent') throw new Error('Unexpected production agent identity');
}

console.log(JSON.stringify({ ok: true, checked: requiredFiles.length, live: Boolean(process.env.BASE_URL), conformance: 'operating-layer-contracts-present' }, null, 2));
