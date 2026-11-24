import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { request } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createVoiceServer, maxBytes } from './worker.mjs';
import { boundedProcess, demoEnabled } from './process.mjs';

const origin = 'http://127.0.0.1:5189';
const template = { nameId: 'an', gift: 'rose', count: 1 };
const samples = Buffer.alloc(4800);
samples.writeInt16LE(1000, 60);
const token = randomBytes(32).toString('hex');

async function fixture(t, run, clock) {
  const server = createVoiceServer({ token, run, clock });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  const port = server.address().port;
  assert.equal(server.address().address, '127.0.0.1');
  return (data = template, options = {}) => new Promise((resolve, reject) => {
    const raw = JSON.stringify(data);
    const req = request({ host: '127.0.0.1', port, path: options.path ?? '/demo-voice', method: options.method ?? 'POST',
      signal: options.signal, headers: { Origin: origin, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(raw), ...options.headers } }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end(raw);
  });
}

test('worker defaults to OFF and rejects malformed local boundary requests', async t => {
  assert.equal(demoEnabled({}), false);
  assert.equal(demoEnabled({ V2_GTTS_DEMO_ENABLED: 'true' }), false);
  assert.equal(demoEnabled({ V2_GTTS_DEMO_ENABLED: '1' }), true);
  const send = await fixture(t);
  const valid = await send();
  assert.equal(valid.status, 503);
  assert.equal(valid.body.length, 0);
  assert.equal((await send(template, { headers: { Host: 'foreign.invalid' } })).status, 403);
  const foreign = await send(template, { headers: { Origin: 'http://foreign.invalid' } });
  assert.equal(foreign.status, 403);
  assert.equal(foreign.headers['access-control-allow-origin'], undefined);
  assert.equal((await send(template, { method: 'GET' })).status, 405);
  assert.equal((await send(template, { headers: { Authorization: 'Bearer incorrect' } })).status, 401);
  assert.equal((await send(template, { headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await send({ ...template, count: 9 })).status, 400);
  assert.equal((await send({ ...template, text: 'arbitrary' })).status, 400);
  assert.equal((await send({ ...template, nameId: 'unknown' })).status, 400);
  assert.equal((await send({ ...template, nameId: 'x'.repeat(400) })).status, 413);
  const preflight = await send(template, { method: 'OPTIONS', headers: {
    'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization, content-type',
  } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers['access-control-allow-origin'], origin);
  assert.equal(preflight.headers['access-control-allow-credentials'], undefined);
  assert.equal((await send(template, { method: 'OPTIONS', headers: {
    'Access-Control-Request-Method': 'DELETE', 'Access-Control-Request-Headers': 'authorization',
  } })).status, 403);
});

test('static fixture cache keeps exact synthetic template and count, expires and evicts at 32', async t => {
  let now = 0;
  let runs = 0;
  const send = await fixture(t, async () => { runs++; return samples; }, () => now);
  const first = await send();
  assert.deepEqual(first.body, samples);
  assert.equal(first.headers['content-type'], 'application/octet-stream');
  await send();
  assert.equal(runs, 1);
  await send({ ...template, count: 2 });
  assert.equal(runs, 2);
  now = 901000;
  await send();
  assert.equal(runs, 3);
  let i = 0;
  for (const nameId of ['an', 'binh', 'chi', 'duyen']) for (const gift of ['rose', 'lantern']) for (let count = 3; count <= 8; count++) {
    if (++i % 20 === 0) now += 60_001;
    assert.equal((await send({ nameId, gift, count })).status, 200);
  }
  const previous = runs;
  assert.equal((await send()).status, 200);
  assert.equal(runs, previous + 1);
});

test('one active job, at most four queued, aborted work releases the slot', async t => {
  let starter;
  let starts = 0;
  let active = 0;
  let maxActive = 0;
  const began = new Promise(resolve => { starter = resolve; });
  let finish;
  const send = await fixture(t, (_data, signal) => new Promise((resolve, reject) => {
    starts++;
    maxActive = Math.max(++active, maxActive);
    signal.addEventListener('abort', () => { active--; reject(new Error('aborted')); }, { once: true });
    if (starts === 1) starter();
    else {
      active--;
      resolve(samples);
    }
    finish = resolve;
  }));
  const controller = new AbortController();
  const first = send(template, { signal: controller.signal });
  first.catch(() => {});
  await began;
  const queued = Array.from({ length: 4 }, (_, i) => send({ ...template, count: 2 + i }));
  const extra = queued.concat(send({ ...template, count: 8 }));
  await new Promise(resolve => setTimeout(resolve, 70));
  assert.equal(starts, 1);
  controller.abort();
  await assert.rejects(first);
  const results = await Promise.all(extra);
  assert.equal(results.filter(r => r.status === 429).length, 1);
  assert.equal(results.filter(r => r.status === 200).length, 4);
  assert.equal(maxActive, 1);
  assert(finish);
});

test('oversized, silent and malformed PCM are not returned', async t => {
  const samplesFor = { 1: Buffer.alloc(maxBytes + 2), 2: Buffer.alloc(4800), 3: Buffer.alloc(4801) };
  const send = await fixture(t, ({ count }) => samplesFor[count]);
  for (const count of [1, 2, 3]) assert.equal((await send({ ...template, count })).status, 502);
});

test('authenticated request rate limit is bounded', async t => {
  const send = await fixture(t, undefined, () => 1);
  for (let i = 0; i < 30; i++) assert.equal((await send()).status, 503);
  assert.equal((await send()).status, 429);
});

test('local bounded child handles timeout and oversized output', async () => {
  await assert.rejects(boundedProcess(process.execPath, ['-e', 'setInterval(()=>{},1000)'], '', AbortSignal.timeout(250)), /synthesis-failed/);
  await assert.rejects(boundedProcess(process.execPath, ['-e', 'process.stdout.write(Buffer.alloc(193000))'], '', AbortSignal.timeout(1500)), /synthesis-failed/);
});

test('Python opt-in is forwarded explicitly and absent dependencies fail locally', async () => {
  const disabled = { ...process.env, V2_GTTS_DEMO_ENABLED: '0' };
  const enabled = { ...disabled, V2_GTTS_DEMO_ENABLED: '1', FFMPEG_PATH: 'missing-test-ffmpeg' };
  const python = process.env.TTS_PYTHON || 'python';
  const args = [new URL('./synthesize.py', import.meta.url)].map(fileURLToPath);
  await assert.rejects(boundedProcess(python, args, 'invalid', AbortSignal.timeout(2500), disabled), /disabled/);
  await assert.rejects(boundedProcess(python, args, JSON.stringify(template), AbortSignal.timeout(2500), enabled),
    /dependency-unavailable/);
});

test('an upstream refusal preserves fallback and prevents subsequent upstream calls', async t => {
  let calls = 0;
  const send = await fixture(t, async () => {
    calls++;
    throw new Error('service-http-failure');
  });
  assert.equal((await send()).status, 502);
  assert.equal((await send({ ...template, count: 2 })).status, 502);
  assert.equal(calls, 1);
});
