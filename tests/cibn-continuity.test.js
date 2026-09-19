const test = require('node:test');
const assert = require('node:assert/strict');
const {
  newSessionId,
  safeSessionId,
  compactContext
} = require('../lib/cibn-continuity');

test('CIBN session IDs are opaque, namespaced and resumable',()=>{
  const id=newSessionId();
  assert.match(id,/^cibn-session-[a-f0-9-]{20,100}$/);
  assert.equal(safeSessionId(id),id);
  assert.equal(safeSessionId('not-a-cibn-session'),null);
});

test('CIBN context is compacted without exposing unrelated event fields',()=>{
  const rows=[{
    event_type:'cibn.conversation.message',
    occurred_at:'2026-09-19T00:00:00.000Z',
    actor_ref:'candidate',
    payload:{question:'What is MCP?',answer:null,private_field:'omit'}
  }];
  const compact=compactContext(rows);
  assert.deepEqual(compact[0],{
    event_type:'cibn.conversation.message',
    occurred_at:'2026-09-19T00:00:00.000Z',
    actor:'candidate',
    payload:{
      question:'What is MCP?',
      answer:null,
      service:null,
      reason:null,
      status:null,
      channel:null,
      request_id:null
    }
  });
});
