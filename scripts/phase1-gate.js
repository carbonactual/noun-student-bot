const fs=require('fs');
const required=[
 'supabase-phase1.sql','supabase-phase1-rls.sql','supabase-phase1-verify.sql','supabase-phase1-finalize.sql',
 'lib/tenant-context.js','lib/tenant-data.js','docs/PHASE1_EXECUTION.md','docs/CARBON_ACTUAL_PLATFORM_BOUNDARY.md'
];
const missing=required.filter(p=>!fs.existsSync(p));
if(missing.length){console.error('PHASE1 BLOCKED: missing files',missing);process.exit(1);}
const context=fs.readFileSync('lib/tenant-context.js','utf8');
const data=fs.readFileSync('lib/tenant-data.js','utf8');
for(const token of ['tenantId','scopeQuery','assertTenantRow']) if(!context.includes(token)&&!data.includes(token)){console.error(`PHASE1 BLOCKED: missing security primitive ${token}`);process.exit(1);}
console.log('PHASE1 CODE GATE: PASS');
console.log('Database execution/verification is required before production completion.');
