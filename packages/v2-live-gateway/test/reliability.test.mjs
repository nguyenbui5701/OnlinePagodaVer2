import assert from 'node:assert/strict';
import test from 'node:test';
import { CommonMessageData, User, WebcastLikeMessage } from 'tiktok-live-proto/v3';
import { createIngress } from '../ingress.mjs';
import { Gateway } from '../gateway.mjs';
import { mapEvent } from '../mapper.mjs';
import { DemoEngine } from '../../v2-events/src/engine.ts';
import { presenceDefaults } from '../../v2-events/src/presence.ts';

const room = '9001';
const clock = Date.now();
const packet = (i, uid = '9223372036854775807') => ({
  common: { roomId: room, msgId: String(i), createTime: String(clock) }, user: { id: uid, nickname: 'Synthetic' },
});

test('pinned protobuf encodes Like with lossless stable identity and leaves unsafe or missing identity aggregate-only', () => {
  const empty = new Uint8Array();
  const input = packet(1);
  const raw = WebcastLikeMessage.decode(WebcastLikeMessage.encode({
    ...WebcastLikeMessage.decode(empty), count: 3,
    common: { ...CommonMessageData.decode(empty), ...input.common },
    user: { ...User.decode(empty), ...input.user },
  }).finish());
  assert.equal(raw.user.id, '9223372036854775807');
  const like = mapEvent('like', raw, room, clock, clock);
  const member = mapEvent('member', packet(2), room, clock, clock);
  assert.equal(like.viewer.userKey, member.viewer.userKey);
  assert.notEqual(mapEvent('member', packet(3, '9223372036854775806'), room, clock, clock).viewer.userKey, member.viewer.userKey);
  assert.equal(mapEvent('like', { ...packet(4, Number.MAX_SAFE_INTEGER + 1), count: 1 }, room, clock, clock).viewer, undefined);
  assert.equal(mapEvent('member', packet(5, Number.MAX_SAFE_INTEGER + 1), room, clock, clock), undefined);
  assert.equal(mapEvent('like', { ...packet(6, ''), count: 1 }, room, clock, clock).viewer, undefined);
});

test('bounded worker leaves IPC room for identities, accounts filtered/overflow and fails closed on final saturation', () => {
  const sent = [];
  const callbacks = [];
  const ingress = createIngress((message, done) => { sent.push(message); callbacks.push(done); return true; }, () => {});
  ingress.receive('member', packet(1), undefined, clock, clock);
  ingress.receive('member', { ...packet(2), common: { roomId: '9999' } }, room, clock, clock);
  ingress.receive('member', packet(3, ''), room, clock, clock);
  ingress.receive('member', { ...packet(4), common: { roomId: room } }, room, clock, clock);
  ingress.receive('member', { ...packet(4), common: { roomId: room, msgId: '88', createTime: String(clock - 10000) } }, room, clock, clock);
  for (let i = 10; i < 240; i++) ingress.receive('roomUser', { ...packet(i), total: '24' }, room, clock, clock);
  ingress.receive('member', packet(250), room, clock, clock);
  ingress.flush();
  const report = sent.at(-1).counts;
  assert.equal(sent.filter(m => m.event?.type === 'member').length, 1);
  assert.equal(report.noRoom, 1);
  assert.equal(report.wrongRoom, 1);
  assert.equal(report.identity, 1);
  assert.equal(report.message, 1);
  assert.equal(report.time, 1);
  assert.equal(report.ipcPressure, 22);
  assert.equal(report.roomUser + report.member, report.mapped + 5);
  assert.equal(report.mapped, report.handoff + report.ipcPressure + report.ipcError);
  for (let i = 300; i < 350; i++) ingress.receive('gift', { ...packet(i), giftId: '4',
    groupId: String(i), gift: { type: 1 }, repeatCount: 1, repeatEnd: 1 }, room, clock, clock);
  assert.equal(sent.at(-1).code, 'GIFT_DELIVERY_FAILED');
  assert.equal(sent.at(-1).ingressIncomplete, true);
  assert.equal(sent.length, 257);
  ingress.receive('member', packet(355), room, clock, clock);
  ingress.flush();
  assert.equal(sent.length, 257, 'terminal fault marks the last receipt incomplete');
  callbacks.forEach(done => done());
});

const settings = (autoJoinLike, autoJoinChat = true) => ({ autoJoinLike, autoJoinChat, autoJoinMember: true });

for (const enabled of [false, true]) {
  test(`identified Like flood (admission ${enabled}) and repeated Chat leave an IPC lane for Member`, () => {
    const sent = [], held = [];
    const ingress = createIngress((message, done) => { sent.push(message); held.push(done); return true; }, () => assert.fail('IPC fault'));
    ingress.configurePresence(settings(enabled));
    // Same user may be mentioned by both sources; an in-flight Like/Chat is not a Member.
    for (let i = 1; i <= 250; i++) ingress.receive('like', { ...packet(i, String(i)), count: 1 }, room, clock, clock);
    assert.equal(sent.length, enabled ? 216 : 208);
    for (let i = 251; i < 300; i++) ingress.receive('chat', { ...packet(i, '1'), content: 'Synthetic' }, room, clock, clock);
    assert.equal(sent.filter(x => x.event.type === 'chat').length, 1);
    ingress.receive('member', packet(300, '1'), room, clock, clock);
    assert.equal(sent.at(-1).event.type, 'member');
    const delivered = sent.length;
    for (const done of held.splice(0)) done();
    ingress.receive('chat', { ...packet(299, '1'), content: 'Synthetic retry' }, room, clock, clock);
    ingress.flush();
    const report = sent.at(-1).counts;
    assert.equal(report.handoff, delivered + 1);
    assert.equal(report.ipcPressure, 301 - report.handoff);
    assert.equal(report.mapped, report.handoff + report.ipcPressure + report.ipcError);
  });

  test(`Gateway Like admission ${enabled} has a separate cap from new Member and Gift Final`, t => {
    let now = clock;
    t.mock.method(Date, 'now', () => now);
    const gateway = new Gateway(() => {});
    try {
      gateway.configurePresence(settings(enabled));
      gateway.claim('owner', 'overlay');
      gateway.connected(room, 'fixture');
      for (let i = 1; i <= 240; i++) {
        now += 201; // Exercise the lane even when aggregate Like throttling is not hit.
        gateway.accept({ type: 'like', count: 1, eventId: 'like:' + i,
          viewer: { userKey: String(i), name: 'Synthetic' } }, 'fixture');
      }
      assert.equal(gateway.queue.length, enabled ? 200 : 192);
      assert.equal(Boolean(gateway.queue.at(-1).event.viewer), enabled);
      gateway.accept({ type: 'member', eventId: 'member:1', viewer: { userKey: '1', name: 'Synthetic' } }, 'fixture');
      gateway.accept({ type: 'gift', phase: 'final', eventId: 'gift:1' }, 'fixture');
      assert.deepEqual(gateway.queue.slice(-2).map(({ event }) => event.type), ['member', 'gift']);
      assert.equal(gateway.flow.mapped, gateway.flow.queued + gateway.flow.pressure);
    } finally { gateway.release(); }
  });
}

test('offered Chat repeats cannot use admission reserve and disabled Chat cannot stand in for a Member', () => {
  const gateway = new Gateway(() => {});
  try {
    gateway.claim('owner', 'overlay');
    gateway.connected(room, 'fixture');
    const chat = (id, userKey) => ({ type: 'chat', eventId: 'chat:' + id, chatText: 'Synthetic',
      viewer: { userKey, name: 'Synthetic' } });
    gateway.accept(chat(1, 'offered'), 'fixture');
    const offered = gateway.poll('owner', 0, true).entries;
    const original = structuredClone(offered);
    gateway.configurePresence(settings(false, false));
    gateway.accept(chat(2, 'member'), 'fixture');
    for (let i = 3; i <= 192; i++) gateway.accept(chat(i, 'repeat'), 'fixture');
    const member = { type: 'member', eventId: 'member:1', viewer: { userKey: 'member', name: 'Synthetic' } };
    gateway.accept(member, 'fixture');
    assert.equal(gateway.queue.at(-1).event.eventId, member.eventId);
    // Exercise both settings with the same offered Chat still awaiting ACK.
    gateway.configurePresence(settings(false));
    const retry = chat(193, 'offered');
    gateway.accept(retry, 'fixture');
    assert.equal(gateway.flow.pressure, 2);
    assert.deepEqual(offered, original);
    assert.equal(gateway.acknowledge('owner', 3), false, 'cannot ACK beyond the offered prefix');
    gateway.configurePresence(settings(false, false));
    const engine = new DemoEngine({ maxAvatars: 3 }, true);
    engine.configurePresence({ ...presenceDefaults, ...settings(false, false) });
    const finals = ['a', 'b', 'c'].map(userKey => ({ type: 'gift', phase: 'final', count: 2, giftId: '4',
      eventId: 'gift:' + userKey, viewer: { userKey, name: 'Synthetic' } }));
    finals.forEach(event => gateway.accept(event, 'fixture'));
    const delivered = [];
    while (gateway.queue.length) {
      const batch = gateway.poll('owner', gateway.acknowledged, true).entries;
      for (const { seq, event } of batch) {
        assert.equal(seq, delivered.length + 1);
        delivered.push(event.eventId);
        assert.notEqual(engine.ingest({ ...event, atMs: seq }).disposition, 'rejected');
        if (event.eventId === member.eventId)
          assert.equal(engine.presenceCounts.occupied, 1, 'only the enabled Member acquires a seat before gifts');
      }
      assert(gateway.acknowledge('owner', batch.at(-1).seq));
    }
    assert(delivered.includes(member.eventId));
    assert(!delivered.includes(retry.eventId));
    assert.deepEqual(delivered.slice(-3), finals.map(event => event.eventId));
    assert.equal(engine.snapshot().confirmedGiftCount, 6);
    gateway.configurePresence(settings(false));
    gateway.accept(retry, 'fixture');
    assert.equal(gateway.queue[0].event.eventId, retry.eventId);
    assert.equal(gateway.flow.mapped, gateway.flow.queued + gateway.flow.pressure);
    assert.equal(gateway.flow.entries, gateway.flow.consumed + gateway.queue.length);
  } finally { gateway.release(); }
});

test('disabled Chat is activity at IPC and a failed handoff releases the same identity for retry', () => {
  const sent = [], held = [];
  const ingress = createIngress((message, done) => { sent.push(message); held.push(done); return true; }, () => assert.fail('IPC fault'));
  ingress.configurePresence(settings(false, false));
  for (let i = 1; i <= 230; i++) ingress.receive('chat', { ...packet(i, String(i)), content: 'Synthetic' }, room, clock, clock);
  assert.equal(sent.length, 208);
  ingress.receive('member', packet(231, '1'), room, clock, clock);
  assert.equal(sent.at(-1).event.type, 'member');
  held.pop()(Error('synthetic IPC rejection'));
  ingress.receive('member', packet(231, '1'), room, clock, clock);
  assert.equal(sent.at(-1).event.type, 'member');
  ingress.flush();
  const report = sent.at(-1).counts;
  assert.deepEqual([report.mapped, report.handoff, report.ipcError, report.ipcPressure], [232, 209, 1, 22]);
});

test('initial and changed policy reach the worker and terminal IPC advertises an incomplete receipt once', () => {
  let receive, exitWorker, initial;
  const applied = [];
  const gateway = new Gateway((_, handle, exit, policy) => {
    receive = handle;
    exitWorker = exit;
    initial = policy;
    return Object.assign(() => {}, { configurePresence: policy => applied.push(policy) });
  });
  try {
    gateway.configurePresence(settings(false, false));
    assert(gateway.connect('owner', 'fixture'));
    assert.deepEqual(initial, settings(false, false));
    receive({ type: 'connected', room });
    gateway.configurePresence(settings(true));
    gateway.configurePresence(settings(true));
    assert.deepEqual(applied, [settings(true)]);
    receive({ type: 'fault', code: 'GIFT_DELIVERY_FAILED', ingressIncomplete: true });
    exitWorker(2);
    assert.equal(gateway.statusSnapshot().presenceDiagnostics.ingressIncomplete, 1);
    assert.equal(gateway.status, 'DEGRADED');
    assert.equal(gateway.queue.at(-1).event.action, 'disconnect');
  } finally { gateway.release(); }
});

test('drops under pressure are retryable after ACK, unique identities get reserve, opted-in likes are rate limited', () => {
  const gateway = new Gateway(() => {});
  try {
    gateway.claim('owner', 'overlay');
    gateway.connected(room, 'fixture');
    const chat = (n, key = 'first') => ({ type: 'chat', viewer: { userKey: key, name: 'Synthetic' }, eventId: 'chat:' + n });
    for (let i = 0; i < 198; i++) gateway.accept(chat(i), 'fixture');
    assert.equal(gateway.queue.length, 192);
    assert.equal(gateway.flow.pressure, 7);
    gateway.accept(chat(900, 'other'), 'fixture');
    assert(gateway.queue.some(entry => entry.event.eventId === 'chat:900'));
    while (gateway.queue.length) {
      const result = gateway.poll('owner', gateway.acknowledged, true);
      if (result.entries.length) gateway.acknowledge('owner', result.entries.at(-1).seq);
    }
    gateway.accept(chat(197), 'fixture');
    assert(gateway.queue.some(entry => entry.event.eventId === 'chat:197'));
    const like = (no, key) => ({ eventId: 'like:' + no, type: 'like', count: 1, viewer: { userKey: key, name: 'Synthetic' } });
    gateway.accept(like(1, 'new'), 'fixture');
    assert.equal(gateway.queue.at(-1).event.viewer, undefined);
    gateway.configurePresence({ autoJoinMember: true, autoJoinChat: true, autoJoinLike: true });
    gateway.accept(like(2, 'new'), 'fixture');
    assert.equal(gateway.queue.at(-1).event.viewer.userKey, 'new');
    gateway.accept(like(3, 'new'), 'fixture');
    assert.equal(gateway.queue.at(-1).event.eventId, 'like:2');
    gateway.accept(like(4, 'another'), 'fixture');
    assert.equal(gateway.queue.at(-1).event.viewer.userKey, 'another');
    assert.equal(gateway.flow.mapped, gateway.flow.dedup + gateway.flow.queued + gateway.flow.coalesced +
      gateway.flow.pressure + gateway.flow.throttled + gateway.flow.overflow + gateway.flow.invalid);
    assert.equal(gateway.flow.entries, gateway.flow.consumed + gateway.queue.length);
  } finally { gateway.release(); }
});
