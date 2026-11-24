import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { Gateway } from '../gateway.mjs';
import { createGatewayServer } from '../server.mjs';
import { SettingsStore } from '../settings.mjs';
import { liveDefaults } from '../../../apps/v2-viewer/src/live-settings.ts';

async function tempSettings(t) {
  const directory = await mkdtemp(join(tmpdir(), 'pagoda-settings-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return { directory, path: join(directory, 'settings.json') };
}

test('settings allowlist, atomic save, conflict, reload and corrupt-file fallback', async t => {
  const { directory, path } = await tempSettings(t);
  const store = new SettingsStore(path);
  assert.deepEqual(store.snapshot, { revision: 1, settings: liveDefaults, warning: 'MISSING' });
  assert.equal(store.save(1, { ...liveDefaults, custom: 'invalid' }), 'INVALID_SETTINGS');
  assert.equal(store.save(1, { ...liveDefaults, profile: 'ultra' }), 'INVALID_SETTINGS');
  assert.equal(store.save(1, { ...liveDefaults, seed: 2 ** 32 }), 'INVALID_SETTINGS');
  const settings = { ...liveDefaults, seed: 71, tree: 'r16' };
  assert.equal(store.save(1, settings), undefined);
  assert.deepEqual(await readdir(directory), ['settings.json']);
  assert.equal(store.save(1, liveDefaults), 'SETTINGS_CONFLICT');
  assert.deepEqual(new SettingsStore(path).snapshot, { revision: 2, settings, warning: '' });
  await writeFile(path, '{ invalid');
  assert.deepEqual(new SettingsStore(path).snapshot, { revision: 1, settings: liveDefaults, warning: 'INVALID' });
  const blocked = new SettingsStore(join(path, 'settings.json'));
  assert.equal(blocked.save(1, settings), 'SETTINGS_WRITE_FAILED');
  assert.equal(blocked.snapshot.revision, 1);
});

const receiver = 'a'.repeat(32);
const other = 'b'.repeat(32);
async function loopback(t) {
  const { path } = await tempSettings(t);
  const worker = { launches: 0, stops: 0 };
  const gateway = new Gateway((_username, receive) => {
    worker.launches++;
    worker.receive = receive;
    return () => { worker.stops++; };
  });
  const server = createGatewayServer({ gateway, settings: new SettingsStore(path) });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); return new Promise(done => server.close(done)); });
  const post = (path, data = {}) => fetch('http://127.0.0.1:' + server.address().port + path, {
    method: 'POST', headers: { Origin: 'http://127.0.0.1:5189', 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return { post, gateway, worker };
}

test('operator stays separate from receiver, and saved settings wait through LIVE and ACK drain', async t => {
  const { post, gateway, worker } = await loopback(t);
  const connect = { action: 'connect', username: 'authorized' };
  let result = await post('/operate', connect);
  assert.equal(result.status, 409);
  assert.equal((await result.json()).reason, 'OVERLAY_NOT_READY');
  assert.equal(worker.launches, 0);

  const settings = { ...liveDefaults, seed: 71 };
  assert.equal((await post('/save-settings', { revision: 1, settings })).status, 200);
  assert.equal((await post('/attach', { client: receiver, revision: 0 })).status, 400);
  assert.equal((await post('/attach', { client: receiver, revision: 3 })).status, 400);
  assert.equal((await post('/attach', { client: receiver, revision: 2 })).status, 204);
  assert.equal((await post('/operate', connect)).status, 409, 'attach alone is not READY');
  assert.equal((await post('/poll', { client: receiver, ack: 0, ready: false })).status, 200);
  assert.equal((await post('/operate', connect)).status, 409);
  assert.equal(worker.launches, 0);
  assert.equal((await post('/poll', { client: receiver, ack: 0, ready: true })).status, 200);
  assert.equal((await post('/attach', { client: other, revision: 2 })).status, 409);
  assert.equal((await post('/connect', { client: other, username: 'authorized' })).status, 409);
  assert.equal((await post('/operate', connect)).status, 204);
  worker.receive({ type: 'connected', room: '42' });
  worker.receive({ type: 'event', event: { type: 'gift', eventId: 'fixtureGift', phase: 'final' } });
  assert.equal(worker.launches, 1);
  for (let i = 0; i < 3; i++) {
    const status = await (await post('/status')).json();
    assert.equal(status.counters.giftFinal, 1);
    assert.equal(status.appliedRevision, 2);
    assert(!('entries' in status));
  }
  assert.equal(gateway.acknowledged, 0);
  assert.equal(worker.stops, 0);
  assert.equal((await post('/save-settings', { revision: 2, settings: liveDefaults })).status, 200);
  result = await post('/apply', { revision: 3 });
  assert.equal((await result.json()).reason, 'APPLY_BLOCKED');

  assert.equal((await post('/operate', { action: 'disconnect' })).status, 204);
  const firstPoll = await (await post('/poll', { client: receiver, ack: 0, ready: false })).json();
  assert.equal(firstPoll.entries[1].event.phase, 'final');
  result = await post('/apply', { revision: 3 });
  assert.equal((await result.json()).reason, 'APPLY_BLOCKED');
  assert.equal((await post('/poll', { client: receiver, ack: firstPoll.entries.at(-1).seq, ready: true })).status, 200);
  assert.equal((await post('/apply', { revision: 3 })).status, 204);
  assert.equal((await post('/operate', connect)).status, 409);
  assert.equal((await (await post('/poll', { client: receiver, ack: firstPoll.entries.at(-1).seq, ready: true })).json()).applyPending, true);
  assert.equal((await post('/disconnect', { client: receiver, ack: firstPoll.entries.at(-1).seq, closing: true })).status, 204);
  assert.equal((await post('/attach', { client: other, revision: 3 })).status, 204);
  const final = await (await post('/status')).json();
  assert.equal(final.appliedRevision, 3);
  assert.equal(final.applyPending, false);
  assert.equal(final.overlayReady, false);
  assert.equal(final.deliveryUncertain, false);
});

test('dashboard polling cannot exhaust the Overlay budget or take a legacy lease', async t => {
  const { post } = await loopback(t);
  assert.equal((await post('/connect', { client: receiver, username: 'authorized' })).status, 204);
  assert.equal((await post('/attach', { client: other, revision: 1 })).status, 409);
  for (let i = 0; i < 240; i++) {
    if (i % 8 === 0) assert.equal((await post('/status')).status, 200);
    assert.equal((await post('/poll', { client: receiver, ack: 0 })).status, 200);
  }
  for (let i = 30; i < 75; i++) assert.equal((await post('/status')).status, 200);
  assert.equal((await post('/status')).status, 429);
  assert.equal((await post('/poll', { client: receiver, ack: 0 })).status, 200);
});