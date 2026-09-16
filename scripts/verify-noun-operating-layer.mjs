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

const manifest = JSON.parse(fs.readFileSync('architecture/product-manifests/noun-bot.json', 'utf8'));
if (manifest.abba_role && !manifest.abba_role.includes('ABBA')) throw new Error('NOUN manifest lost ABBA responsibility');
if (manifest.constitutional_compliance !== true) throw new Error('NOUN manifest is not constitutionally marked compliant');

const sql = fs.readFileSync('supabase-noun-operating-layer.sql', 'utf8');
for (const marker of ['noun_events', 'noun_pulses', 'noun_human_escalations', 'row level security']) {
  if (!sql.toLowerCase().includes(marker.toLowerCase())) throw new Error(`Missing SQL conformance marker: ${marker}`);
}

if (process.env.BASE_URL) {
  const url = `${process.env.BASE_URL.replace(/\/$/, '')}/api/health`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Production health returned HTTP ${response.status}`);
  const body = await response.json();
  if (body.name !== 'ABBA Being Agent') throw new Error('Unexpected production agent identity');
}

console.log(JSON.stringify({ ok: true, checked: requiredFiles.length, live: Boolean(process.env.BASE_URL), conformance: 'operating-layer-contracts-present' }, null, 2));
