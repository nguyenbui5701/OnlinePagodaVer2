import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { presenceDefaults } from '../../v2-events/src/presence.ts';
import { Gateway } from '../gateway.mjs';
import { AudioSettingsStore, PresenceSettingsStore, SettingsStore } from '../settings.mjs';
import { createGatewayServer } from '../server.mjs';

test('presence patches persist separately and reject invalid, stale and corrupt settings', async t => {
  const tmp = await mkdtemp(join(tmpdir(), 'pagoda-presence-'));
  t.after(() => rm(tmp, { recursive: true, force: true }));
  const path = join(tmp, 'presence-settings.json');
  const presence = new PresenceSettingsStore(path);
  assert.deepEqual(presence.snapshot, { settings: presenceDefaults, revision: 1, warning: 'MISSING' });
  for (const fields of [{ idleSeconds: 5 }, { idleSeconds: 1801 }, { idleSeconds: 6.5 }, { autoJoinChat: 'false' }, { slots: 12 }]) {
    assert.equal(presence.patch(1, fields), 'INVALID_SETTINGS');
  }
  assert.equal(presence.patch(1, { idleSeconds: 1800 }), undefined);
  assert.equal(presence.patch(1, { autoJoinChat: false }), 'SETTINGS_CONFLICT');
  assert.equal(presence.patch(2, { autoJoinChat: false }), undefined);
  assert.deepEqual(await readdir(tmp), ['presence-settings.json']);
  assert.deepEqual(new PresenceSettingsStore(path).snapshot, presence.snapshot);
  await writeFile(path, '{"version":0}');
  assert.deepEqual(new PresenceSettingsStore(path).snapshot, { settings: presenceDefaults, revision: 1, warning: 'INVALID' });
});

test('presence heartbeat is owner-only and bad metadata cannot interrupt ACK or alter audio/visual revisions', async t => {
  const tmp = await mkdtemp(join(tmpdir(), 'pagoda-presence-http-'));
  t.after(() => rm(tmp, { recursive: true, force: true }));
  let deliver;
  const gateway = new Gateway((_, callback) => { deliver = callback; return () => {}; });
  const presence = new PresenceSettingsStore(join(tmp, 'presence.json'));
  const server = createGatewayServer({ gateway, presence, settings: new SettingsStore(join(tmp, 'visual.json')),
    audio: new AudioSettingsStore(join(tmp, 'audio.json')) });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); return new Promise(done => server.close(done)); });
  const post = (route, body = {}) => fetch('http://127.0.0.1:' + server.address().port + route, {
    method: 'POST', headers: { Origin: 'http://127.0.0.1:5189', 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const client = 'a'.repeat(32);
  const other = 'b'.repeat(32);
  const stats = { revision: 1, occupied: 0, waiting: 0, dropped: 0 };
  assert.equal((await post('/attach', { client, revision: 1 })).status, 204);
  assert.equal((await post('/poll', { client: other, ack: 0, ready: true, presence: stats })).status, 409);
  const first = await (await post('/poll', { client, ack: 0, ready: true, presence: stats })).json();
  assert.equal(first.presenceDesired.settings.autoJoinMember, true);
  assert.equal((await post('/operate', { action: 'connect', username: 'fixture' })).status, 204);
  deliver({ type: 'connected', room: '55' });
  const pending = await (await post('/poll', { client, ack: 0, ready: true, presence: stats })).json();
  assert.equal(pending.entries[0].seq, 1);
  assert.equal((await post('/patch-presence', { revision: 1, patch: { seatExpiryEnabled: false } })).status, 200);
  const conflict = await post('/patch-presence', { revision: 1, patch: { idleSeconds: 8 } });
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).presence.revision, 2);
  const reply = await post('/poll', { client, ack: 1, ready: true, presence: { ...stats, occupied: 4 } });
  assert.equal(reply.status, 200);
  assert.equal(gateway.acknowledged, 1);
  const applied = { ...stats, revision: 2, occupied: 3, waiting: 1 };
  assert.equal((await post('/poll', { client, ack: 1, ready: true, presence: applied })).status, 200);
  const status = await (await post('/status')).json();
  assert.deepEqual(status.presenceApplied, applied);
  assert.equal(status.presenceDesired.revision, 2);
  assert.equal(status.appliedRevision, 1);
  assert.equal(status.audioDesired.revision, 1);
  gateway.release();
  assert.equal((await (await post('/status')).json()).presenceApplied, null);
});
