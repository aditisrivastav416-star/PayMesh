import assert from 'node:assert/strict';
import { test } from 'node:test';
import agent from '../dist/index.js';

test('DeepSeek is used only for temporary Gemini failures', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = globalThis.process.env.DEEPSEEK_API_KEY;
  const calls = [];
  globalThis.process.env.DEEPSEEK_API_KEY = 'test-key';
  try {
    globalThis.fetch = async (url) => {
      calls.push(String(url));
      return calls.length === 1
        ? new globalThis.Response('', { status: 503 })
        : new globalThis.Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: '{"item":"notebook","reason":"requested"}',
                  },
                },
              ],
            }),
          );
    };
    assert.equal(
      (await agent.choose('buy a notebook', 'gemini-key')).item,
      'notebook',
    );
    assert.equal(calls.length, 2);
    calls.length = 0;
    globalThis.fetch = async (url) => {
      calls.push(String(url));
      return new globalThis.Response('', { status: 401 });
    };
    await assert.rejects(
      agent.choose('buy a notebook', 'bad-key'),
      /Gemini request failed \(401\)/,
    );
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined)
      delete globalThis.process.env.DEEPSEEK_API_KEY;
    else globalThis.process.env.DEEPSEEK_API_KEY = originalKey;
  }
});
