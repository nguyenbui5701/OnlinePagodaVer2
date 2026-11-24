import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { request } from 'node:http';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { DemoEngine } from '../../v2-events/src/engine.ts';
import { fault } from '../errors.mjs';
import { Gateway } from '../gateway.mjs';
import { mapEvent } from '../mapper.mjs';
import { createGatewayServer } from '../server.mjs';

const room = '1000';
const client = 'a'.repeat(32);
const packet = (id = '1001', user = '9007199254740999') => ({
  user: { id: user, nickname: 'An', avatarThumb: { urlList: ['https://example.com'] } },
  common: { msgId: id, roomId: room, createTime: String(Date.now()) },
});
const gift = (id, repeatEnd, count, user, groupId = '2020') => ({
  ...packet(id, user), giftId: '5655', groupId, orderId: id,
  toUser: { id: '54321' }, repeatEnd, repeatCount: count, gift: { type: 1 },
});

test('maps modern provider shapes with sanitized display text and no avatar URLs', () => {
  const raw = packet();
  assert.deepEqual(mapEvent('roomUser', { common: raw.common, total: '23' }, room, Date.now()).count, 23);
  assert.equal(mapEvent('like', { ...raw, count: 3 }, room, Date.now()).count, 3);
  const chat = mapEvent('chat', { ...raw, content: '<b>xin</b> chào\u202e' }, room, Date.now());
  assert.equal(chat.chatText, 'xin chào');
  assert(!('avatarUrl' in chat.viewer));
  const member = mapEvent('member', { ...raw, user: { ...raw.user, nickname: 'Tâm' } }, room, Date.now());
  assert.equal(member.viewer.userKey, chat.viewer.userKey);
  assert.equal(mapEvent('chat', { ...raw, content: '<b></b>' }, room, Date.now()), undefined);
  assert.equal(mapEvent('member', raw, '2000', Date.now()), undefined);
  assert.equal(mapEvent('member', raw, room, Date.now() + 6000), undefined);
});

test('gift progress and final use a stable group with separate packet IDs', () => {
  const a = mapEvent('gift', gift('1001', 0, 1), room, Date.now());
  const b = mapEvent('gift', gift('1001', 1, 5), room, Date.now());
  const replay = mapEvent('gift', gift('1002', 1, 5), room, Date.now());
  assert.equal(a.phase, 'progress');
  assert.equal(b.phase, 'final');
  assert.equal(a.streakId, b.streakId);
  assert.notEqual(a.eventId, b.eventId);
  assert.deepEqual(replay, b);
  assert.equal(mapEvent('gift', { ...gift('2001', 1, 5, '7', ''), orderId: undefined }, room, Date.now()), undefined);
  const nonCombo = { ...gift('2001', 0, 1), gift: { type: 2 } };
  assert.equal(mapEvent('gift', nonCombo, room, Date.now()).phase, 'final');
});

function localGateway() {
  let send;
  const gateway = new Gateway((_username, handle) => { send = handle; return () => {}; });
  return { gateway, receive: message => send(message) };
}

test('scopes reconnect, deduplicates gifts and publishes them to the Event Engine', () => {
  const { gateway, receive } = localGateway();
  try {
    assert(gateway.connect(client, 'allowed'));
    assert.equal(gateway.poll(client, 0).status, 'CONNECTING');
    receive({ type: 'connected', room });
    assert.equal(gateway.poll(client, 0).status, 'CONNECTED_NO_EVENTS');
    const send = (kind, raw) => receive({ type: 'event', event: mapEvent(kind, raw, room, Date.now()) });
    send('member', packet('7'));
    send('chat', { ...packet('8'), content: 'xin chào' });
    send('gift', gift('101', 0, 1));
    send('gift', gift('102', 1, 5));
    send('gift', gift('103', 1, 5));
    const engine = new DemoEngine();
    const result = gateway.poll(client, 0);
    assert.equal(result.status, 'EVENTS_VERIFIED');
    assert.equal(result.counters.giftFinal, 1);
    for (const { event } of result.entries) engine.ingest({ ...event, atMs: 0 });
    assert.equal(engine.snapshot().avatars.length, 1);
    assert.equal(engine.snapshot().confirmedGiftCount, 5);
    const cursor = result.entries.at(-1).seq;
    assert.equal(gateway.poll(client, cursor + 1), undefined);
    gateway.disconnect(client);
    const next = gateway.poll(client, cursor);
    const end = next.entries[0];
    engine.ingest({ ...end.event, atMs: 0 });
    assert.equal(end.event.action, 'disconnect');
    gateway.poll(client, end.seq);
    assert(gateway.connect(client, 'allowed'));
    receive({ type: 'connected', room });
    send('gift', gift('124', 1, 5));
    const resumed = gateway.poll(client, end.seq);
    assert.equal(resumed.entries.length, 1);
    assert.equal(resumed.entries[0].event.action, 'reconnect');
    assert.equal(resumed.entries[0].event.connection, 2);
    assert.equal(resumed.entries[0].event.roomEpoch, result.entries[0].event.roomEpoch);
    engine.ingest({ ...resumed.entries[0].event, atMs: 1 });
    assert.equal(engine.snapshot().confirmedGiftCount, 5);
  } finally { gateway.release(); }
});

test('backpressure prioritizes final gifts and makes hard overflow explicit', () => {
  const { gateway, receive } = localGateway();
  try {
    gateway.connect(client, 'allowed');
    receive({ type: 'connected', room });
    for (let i = 0; i < 500; i++) receive({ type: 'event', event: { type: 'chat', eventId: 'c:' + i } });
    assert(gateway.dropped > 0);
    for (let i = 0; i < 45; i++) receive({ type: 'event',
      event: { type: 'gift', phase: 'final', eventId: 'g:' + i } });
    assert.equal(gateway.status, 'DEGRADED');
    assert.equal(gateway.reason, 'GIFT_DELIVERY_FAILED');
    assert.equal(gateway.queue.filter(item => item.event.phase === 'final').length, 32);
    assert.equal(gateway.queue.at(-1).event.action, 'disconnect');
    assert(gateway.queue.length <= 257);
  } finally { gateway.release(); }
});

test('provider denial and rate limits stop attempts with allowlisted reasons', () => {
  assert.equal(fault({ cause: { response: { status: 402, authorization: 'private' } } }), 'PAID_ROUTE');
  assert.equal(fault({ statusCode: 403 }), 'ACCESS_DENIED');
  const { gateway, receive } = localGateway();
  try {
    gateway.connect(client, 'allowed');
    receive({ type: 'fault', code: 'RATE_LIMITED' });
    assert.equal(gateway.reason, 'RATE_LIMITED');
    assert.equal(gateway.retry, undefined);
    assert.equal(gateway.connect(client, 'allowed'), false);
  } finally { gateway.release(); }
});

test('HTTP accepts only authenticated, bounded requests from the Viewer origin', async t => {
  const token = 'b'.repeat(64);
  const { gateway } = localGateway();
  const server = createGatewayServer({ token, gateway });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); return new Promise(done => server.close(done)); });
  const url = 'http://127.0.0.1:' + server.address().port;
  const post = (path, data, extra = {}) => fetch(url + path, { method: 'POST', body: JSON.stringify(data),
    headers: { Origin: 'http://127.0.0.1:5189', Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json', ...extra } });
  const input = { client, username: 'authorized' };
  assert.equal((await post('/connect', input, { Authorization: 'Bearer wrong' })).status, 401);
  assert.equal((await post('/connect', input, { Origin: 'http://other.invalid' })).status, 403);
  const foreignHost = await new Promise((resolve, reject) => {
    request(url + '/connect', { headers: { Host: 'other.invalid', Origin: 'http://127.0.0.1:5189' } },
      response => { response.resume(); resolve(response.statusCode); }).on('error', reject).end();
  });
  assert.equal(foreignHost, 403);
  assert.equal((await post('/connect', { ...input, username: 'https://other.invalid' })).status, 400);
  assert.equal((await post('/connect', { ...input, value: 'x'.repeat(300) })).status, 413);
  assert.equal((await post('/connect', input)).status, 204);
  assert.equal((await post('/connect', { ...input, client: 'c'.repeat(32) })).status, 409);
  assert.equal((await post('/poll', { client, ack: 9 })).status, 409);
  assert.equal((await post('/poll', { client, ack: 0 })).status, 200);
});

test('actual pinned connector loads in a real isolated worker without opening a room', async t => {
  const child = fork(fileURLToPath(new URL('../worker.mjs', import.meta.url)), [], {
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  });
  t.after(() => child.kill());
  const [message] = await once(child, 'message', { signal: AbortSignal.timeout(5000) });
  assert.deepEqual(message, { type: 'ready' });
});