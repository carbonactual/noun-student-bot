const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('NOUN BOT stays below the Vercel Hobby serverless-function ceiling',()=>{
  const apiDir=path.join(__dirname,'..','api');
  const files=fs.readdirSync(apiDir).filter(name=>/^.+\.(js|mjs|ts)$/.test(name));
  assert.ok(files.length<=11, 'Function budget exceeded: '+files.length+' API functions found; keep at least one spare slot.');
});
