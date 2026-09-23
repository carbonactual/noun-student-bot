const test = require('node:test');
const assert = require('node:assert/strict');
const { invokeAbba } = require('../lib/abba-runtime');

test('ABBA runtime posts the canonical request envelope', async () => {
  let captured;
  const result = await invokeAbba({ requestId: 'r1', utterance: 'hello' }, {
    runtimeUrl: 'https://abba.example.test/orchestrate',
    runtimeKey: 'secret',
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return { ok: true, status: 200, json: async () => ({ requestId: 'r1', answer: 'Hello from ABBA' }) };
    }
  });
  assert.equal(result.answer, 'Hello from ABBA');
  assert.equal(captured.url, 'https://abba.example.test/orchestrate');
  assert.equal(captured.options.headers.Authorization, 'Bearer secret');
});


test('ABBA runtime preserves recent learning continuity in the Gemini prompt', async () => {
  let captured;
  const result = await invokeAbba({
    requestId: 'r3',
    message: 'Continue from where we stopped.',
    course: 'ACC301',
    context: {
      learningMode: 'tutor',
      learningHistory: [
        { question: 'What is a trial balance?', answer: 'It is a statement used to check debit and credit equality.' }
      ]
    },
    evidence: { normalized: [], live_facts: [], decision: { decision: 'answer' } }
  }, {
    runtimeUrl: '',
    geminiKey: 'secret',
    fetchImpl: async (url, options) => {
      captured = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Continue with the next step.' }] } }]
        })
      };
    }
  });
  assert.equal(result.answer, 'Continue with the next step.');
  const prompt = captured.contents[0].parts[0].text;
  assert.match(prompt, /RECENT STUDY CONTEXT/);
  assert.match(prompt, /What is a trial balance/);
  assert.match(prompt, /debit and credit equality/);
});

test('ABBA runtime fails closed when no runtime is configured', async () => {
  await assert.rejects(() => invokeAbba({ requestId: 'r2', utterance: 'hello' }, { runtimeUrl: '' }), /Gemini engine unavailable: no GEMINI_API_KEY/);
});
