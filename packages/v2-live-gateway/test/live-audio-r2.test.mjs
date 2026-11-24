import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { audioDefaults } from '../../../apps/v2-viewer/src/live-audio-settings.ts';
import { spokenAlias } from '../../../apps/v2-viewer/src/audio/live-alias.ts';
import { AudioSettingsStore, SettingsStore } from '../settings.mjs';
import { createGatewayServer } from '../server.mjs';
import { Gateway } from '../gateway.mjs';
import { LiveVoice } from '../live-voice.mjs';

const settings = { ...audioDefaults, master: { enabled: true, volume: 93 },
  giftThanks: { enabled: true, volume: 85 }, namedEnabled: true, namedVariety: false };
const client = 'f'.repeat(32);
const pcm = Buffer.alloc(4800);
pcm.writeInt16LE(2200, 10);

test('R2 migrates legacy audio and commits independent patches with a priority mute fence', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'pagoda-audio-r2-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, 'audio-settings.json');
  await writeFile(path, JSON.stringify({ version: 1, revision: 4, settings: { ...audioDefaults, idleSeconds: 35 } }));
  const audio = new AudioSettingsStore(path);
  assert.equal(audio.snapshot.settings.namedEnabled, undefined);
  assert.equal(audio.snapshot.settings.idleSeconds, 35);
  const gateway = new Gateway();
  const server = createGatewayServer({ gateway, audio, settings: new SettingsStore(join(directory,'visual.json')) });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); return new Promise(done => server.close(done)); });
  const post = (route, body = {}) => fetch('http://127.0.0.1:' + server.address().port + route, {
    method: 'POST', headers: { Origin: 'http://127.0.0.1:5189', 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const oldFence = audio.desired.muteFence;
  const change = (patch, revision = audio.snapshot.revision, fence = oldFence) =>
    post('/patch-audio', { revision, fence, patch });
  assert.equal((await change({ idleSeconds: 3 })).status, 400);
  assert.equal((await change({ 'water.volume': 31 })).status, 200);
  assert.equal((await change({ 'wind.enabled': false }, 4)).status, 409);
  assert.equal((await change({ 'wind.enabled': false })).status, 200);
  assert.equal(audio.snapshot.settings.water.volume, 31);
  assert.equal(audio.snapshot.settings.idleSeconds, 35);
  let status;
  for (let i = 0; i < 76; i++) status = (await post('/status')).status;
  assert.equal(status, 429);
  const staleOn = { revision: audio.snapshot.revision, patch: { 'master.enabled': true }, fence: oldFence };
  assert.equal((await post('/mute-audio')).status, 200);
  const late = await post('/patch-audio', staleOn);
  assert.equal((await late.json()).reason, 'STALE_ENABLE');
  assert.equal((await change({ 'master.enabled': true })).status, 409, 'rebasing cannot reuse the old intent');
  assert.equal(new AudioSettingsStore(path).snapshot.settings.master.enabled, false);
  assert.equal((await change({ 'master.enabled': true }, undefined, audio.desired.muteFence)).status, 200);
  assert.equal(new AudioSettingsStore(path).snapshot.settings.master.enabled, true);
  assert.equal(gateway.sequence, 0);
});

test('R2 priority mute remains in RAM and reports UNSAVED when persistence fails', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'pagoda-audio-r2-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, 'audio-settings.json');
  const audio = new AudioSettingsStore(path);
  assert.equal(audio.save(1, settings), undefined);
  audio.path = join(path, 'not-a-directory.json');
  const before = audio.desired;
  const off = audio.mute();
  assert.equal(off.settings.master.enabled, false);
  assert.equal(off.warning, 'UNSAVED');
  assert.equal(audio.patch(off.revision, before.muteFence, { 'master.enabled': true }), 'STALE_ENABLE');
  audio.path = path;
  const saved = audio.mute();
  assert.equal(saved.warning, '');
  assert.equal(new AudioSettingsStore(path).snapshot.settings.master.enabled, false);
});

const ready = { owner: client, receiver: 'overlay', online: true, overlayReady: true, offered: 200,
  roomEpoch: 77, connection: 1, audioApplied: { state: 'READY' } };
const data = (seq, alias = 'An Lam') => ({ client, seq, roomEpoch: 77, connection: 1, alias, count: 2 });
const row = (seq, actor = 'actorA', name = 'An Lam') => ({ seq, event: {
  viewer: { name, userKey: actor }, count: 2, giftId: '5655', roomEpoch: 77, connection: 1,
}});

test('R2 name provenance, cache isolation across same-name actors, expiry/reset and unsafe aliases', async () => {
  let calls = 0;
  const voice = new LiveVoice(() => ({ run: async () => { calls++; return pcm; }, close() {} }));
  const request = (input, gateway = ready) => voice.request(gateway, settings, input, new AbortController().signal);
  assert.equal(spokenAlias('Nguyễn An'), 'Nguyễn An');
  for (const unsafe of ['🪷', 'https.com', 'An 0912345678', 'abc@def', 'An\tLam', 'Khách TikTok']) assert.equal(spokenAlias(unsafe), undefined);
  voice.remember(row(1), settings);
  await assert.rejects(request(data(1, 'Another Name')), /receipt/);
  await assert.rejects(request({ ...data(1), count: 3 }), /receipt/);
  await assert.rejects(request(data(1), { ...ready, offered: 0 }), /receipt/);
  await assert.rejects(request(data(1), { ...ready, owner: 'another' }), /session/);
  assert.equal((await request(data(1))).mode, 'cold');
  await assert.rejects(request(data(1)), /receipt/);
  voice.remember(row(2, 'actorB'), settings);
  assert.equal((await request(data(2))).mode, 'warm');
  voice.remember(row(3), settings);
  assert.equal((await request(data(3))).mode, 'cache');
  voice.remember(row(4, 'actorA', 'An Mây'), settings);
  assert.equal((await request(data(4, 'An Mây'))).mode, 'warm');
  assert.equal(calls, 3);
  voice.reset();
  await assert.rejects(request(data(3)), /receipt/);
  assert.equal(voice.cache.size, 0);
});

test('R2 mute aborts active and waiting synthesis, and provider refusal cools down without retry', async () => {
  let calls = 0;
  const voice = new LiveVoice(() => ({
    run: (_, signal) => new Promise((_, reject) => {
      calls++;
      signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
    }), close() {},
  }));
  for (let seq = 1; seq <= 6; seq++) voice.remember(row(seq), settings);
  const request = seq => voice.request(ready, settings, data(seq), new AbortController().signal);
  const active = Array.from({length:5}, (_, index) => request(index + 1));
  await assert.rejects(request(6), /busy/);
  const settled = Promise.allSettled(active);
  voice.update({ ...settings, master: { ...settings.master, enabled: false } });
  assert((await settled).every(item => item.status === 'rejected'));
  assert.equal(calls, 1);
  let now = 1;
  const refused = new LiveVoice(() => ({
    run: async () => { throw new Error('service-unreachable'); }, close() {},
  }), () => now);
  refused.remember(row(1), settings);
  await assert.rejects(refused.request(ready, settings, data(1), new AbortController().signal), /service-unreachable/);
  assert.equal(refused.status(settings), 'UNAVAILABLE');
  now += 60_001;
  assert.equal(refused.status(settings), 'PENDING');
});
