import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validWorldApplied } from '../../../apps/v2-viewer/src/live-settings.ts';
import { Gateway } from '../gateway.mjs';
import { AudioSettingsStore, PresenceSettingsStore, SettingsStore } from '../settings.mjs';
import { createGatewayServer } from '../server.mjs';

const success = { requestedTree: 'R18A', tree: 'R18A', requestedDensity: 'lush', density: 'lush', fallback: false, failures: [] };
const missing = { revision: 'R18A', code: 'MISSING' };
const corrupt = { revision: 'R17B', code: 'INTEGRITY' };
const single = { ...success, tree: 'R17B', fallback: true, failures: [missing] };
const double = { ...success, tree: 'R16', fallback: true, failures: [missing, corrupt] };

test('world status accepts only the failure codes and stages that match the applied tree', () => {
  for (const world of [success, single, double, { ...double, requestedTree: 'R17B', failures: [corrupt] },
    { ...single, failures: [{ ...missing, code: 'IMPORT' }] }]) assert.equal(validWorldApplied(world), true);

  for (const world of [null, [], { ...success, failures: [missing] }, { ...single, fallback: false },
    { ...double, failures: [missing] }, { ...double, failures: [corrupt, missing] },
    { ...double, failures: [missing, missing] }, { ...double, failures: [missing, corrupt, corrupt] },
    { ...single, requestedTree: 'R16' }, { ...single, failures: [null] },
    { ...single, failures: [{ ...missing, code: 'untrusted text' }] },
    { ...single, failures: [{ ...missing, detail: 'untrusted text' }] }]) assert.equal(validWorldApplied(world), false);
});

test('world status travels on owner poll and malformed telemetry leaves ACK, audio and presence intact', async t => {
  const tmp = await mkdtemp(join(tmpdir(), 'pagoda-world-http-'));
  let deliver;
  const gateway = new Gateway((_, callback) => { deliver = callback; return () => {}; });
  const server = createGatewayServer({ gateway, presence: new PresenceSettingsStore(join(tmp, 'presence.json')),
    settings: new SettingsStore(join(tmp, 'visual.json')), audio: new AudioSettingsStore(join(tmp, 'audio.json')) });
  t.after(async () => {
    gateway.release();
    server.closeAllConnections();
    await new Promise(done => server.close(done));
    await rm(tmp, { recursive: true, force: true });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const post = (route, body = {}) => fetch('http://127.0.0.1:' + server.address().port + route, {
    method: 'POST', headers: { Origin: 'http://127.0.0.1:5189', 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const status = async () => (await post('/status')).json();
  const client = 'a'.repeat(32);
  const audio = { revision: 1, state: 'UNAVAILABLE', thanks: 'UNAVAILABLE', wishes: 'UNAVAILABLE' };
  const presence = { revision: 1, occupied: 3, waiting: 64, dropped: 12345 };
  const poll = { client, ack: 0, ready: true, audio, presence };
  assert.equal((await post('/attach', { client, revision: 1 })).status, 204);
  assert.equal((await post('/poll', { ...poll, world: success })).status, 200);
  assert.deepEqual((await status()).world, success);
  assert.equal((await post('/operate', { action: 'connect', username: 'fixture' })).status, 204);
  deliver({ type: 'connected', room: '55' });
  for (const world of [single, double]) {
    const response = await post('/poll', { ...poll, world });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).entries[0].seq, 1);
    assert.deepEqual((await status()).world, world);
  }
  assert.equal((await post('/poll', { ...poll, client: 'b'.repeat(32), world: success })).status, 409);
  assert.equal((await post('/poll', { ...poll, world: { ...double, failures: 'x'.repeat(512) } })).status, 413);
  assert.deepEqual((await status()).world, double);
  assert.equal(gateway.acknowledged, 0);

  const response = await post('/poll', { ...poll, ack: 1, world: { ...single, failures: [corrupt] } });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).entries, []);
  assert.equal(gateway.acknowledged, 1);
  const final = await status();
  assert.equal(final.world, null);
  assert.equal(final.appliedRevision, 1);
  assert.deepEqual(final.audioApplied, audio);
  assert.deepEqual(final.presenceApplied, presence);
});
