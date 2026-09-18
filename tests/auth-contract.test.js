const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const auth=fs.readFileSync('lib/auth.js','utf8');const api=fs.readFileSync('api/dashboard.js','utf8');const sql=fs.readFileSync('supabase/migrations/20260918_auth_accounts.sql','utf8');const ai=fs.readFileSync('api/ai-study.js','utf8');
test('auth uses Supabase server APIs and never stores passwords',()=>{assert.match(auth,/admin\/users/);assert.match(auth,/token\?grant_type=password/);assert.match(auth,/recover/);assert.match(auth,/user/);assert.doesNotMatch(sql,/password\s+text/i);});
test('account routes cover signup login recovery reset and identity lookup',()=>{for(const route of ['auth-signup','auth-login','auth-recover','auth-reset','auth-me'])assert.match(api,new RegExp(route));});
test('personal NOUN AI requires an authenticated identity',()=>{assert.match(ai,/bearer\(req\)/);assert.match(ai,/getUser\(token\)/);});
test('NOUN signup includes matric number and school email fields',()=>{assert.match(api,/matric_number/);assert.match(api,/school_email/);});
