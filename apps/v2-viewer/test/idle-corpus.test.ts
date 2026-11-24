import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { loadIdleCorpus } from '../src/audio/idle-corpus.ts';

const pcm = Buffer.alloc(4800);
pcm.writeInt16LE(1000, 60);
const manifest = () => ({
  version: 1, source: 'gTTS 2.5.4 / vi', format: 'pcm_s16le', sampleRate: 24000, channels: 1,
  clips: Array.from({ length: 12 }, (_, i) => ({ id: 'wish-' + String(i + 1).padStart(2, '0'),
    bytes: pcm.length, durationSec: .1, sha256: createHash('sha256').update(pcm).digest('hex') })),
});
const base = 'http://127.0.0.1:5189/overlay/';
const signal = AbortSignal.timeout(5000);

test('local corpus loads and checks every clip with same-origin root paths from /overlay/', async () => {
  const paths: string[] = [];
  const result = await loadIdleCorpus(signal, base, async (input, options) => {
    const url = new URL(String(input));
    assert.equal(url.origin, new URL(base).origin);
    assert.equal(options?.redirect, 'error');
    assert(url.pathname.startsWith('/audio/vi-gtts-demo-v1/'));
    paths.push(url.pathname);
    return url.pathname.endsWith('/manifest.json') ? Response.json(manifest()) : new Response(pcm);
  });
  assert.equal(paths.length, 13);
  assert.equal(result.size, 12);
  assert.equal(result.get('wish-01')?.[30], 1000 / 32768);
});

test('missing corpus, duplicate/path IDs, hash mismatch and overflow do not expose partial speech', async () => {
  await assert.rejects(loadIdleCorpus(signal, base, async () => new Response(null, { status: 404 })), /fetch/);
  for (const id of ['wish-01', '../arbitrary']) {
    const invalid = manifest();
    invalid.clips[1].id = id;
    await assert.rejects(loadIdleCorpus(signal, base, async () => Response.json(invalid)), /manifest/);
  }
  for (const [clip, error] of [[Buffer.alloc(pcm.length), /integrity/], [Buffer.alloc(pcm.length + 2), /size/]] as const) {
    await assert.rejects(loadIdleCorpus(signal, base, async input => String(input).endsWith('/manifest.json') ?
      Response.json(manifest()) : new Response(clip)), error);
  }
});