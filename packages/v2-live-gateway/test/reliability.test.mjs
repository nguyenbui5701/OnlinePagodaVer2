import assert from 'node:assert/strict';
import test from 'node:test';
import { CommonMessageData, User, WebcastLikeMessage } from 'tiktok-live-proto/v3';
import { createIngress } from '../ingress.mjs';
import { Gateway } from '../gateway.mjs';
import { mapEvent } from '../mapper.mjs';

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
  assert.equal(sent.length, 257);
  callbacks.forEach(done => done());
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
