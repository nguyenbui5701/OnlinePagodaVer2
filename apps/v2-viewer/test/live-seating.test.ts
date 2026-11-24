import assert from 'node:assert/strict';
import test from 'node:test';
import { presenceDefaults } from '../../../packages/v2-events/src/presence.ts';
import { AudioDirector, type Cue } from '../src/audio/director.ts';
import { SliceDriver, timing } from '../src/slice-driver.ts';
import type { LivePacket } from '../src/live-receiver.ts';

test('LIVE Overlay stages settings ahead of events, preserves consuming ACK and binds new donor alias to the reused seat', () => {
  const driver = new SliceDriver('live', [], true, true);
  const old = new SliceDriver('live', [], true);
  const scope = { roomEpoch: 55, connection: 1, atMs: 0 };
  const session: LivePacket = { ...scope, type: 'session', action: 'open' };
  const member = (key: string, name: string): LivePacket => ({
    ...scope, eventId: key, type: 'member', viewer: { userKey: key, name },
  });
  const gift = (phase: 'progress' | 'final'): LivePacket => ({
    ...scope, eventId: phase, type: 'gift', viewer: { userKey: 'donor', name: 'Lam Mây' },
    giftId: '5655', streakId: 'group', phase, count: 2,
  });
  const queue = (packets: LivePacket[], start: number, target = driver) =>
    assert(target.enqueueLive(packets.map((event, i) => ({ seq: start + i, event }))));
  const prepared: Cue[] = [];
  const director = new AudioDirector(timing.focusHoldMs, {
    sfx() {}, voice() { return 'started'; }, cut() {}, prepare(cue) { prepared.push(cue); },
  }, true);
  director.enable(true);
  const frame = (atMs: number) => {
    const result = driver.update(atMs);
    director.frame(result.state, result.audio!.epoch, result.audio!.records, result.actor);
    return result.state;
  };
  driver.stagePresence({ revision: 2, settings: { ...presenceDefaults, autoJoinMember: false }, warning: '' });
  queue([session, member('not-seated', 'Ẩn')], 1);
  assert.equal(driver.liveReceipt.ack, 0);
  assert.equal(frame(0).avatars.length, 0);
  assert.equal(driver.liveReceipt.ack, 2);
  assert.equal(driver.presenceApplied?.revision, 2);
  driver.stagePresence({ revision: 3, settings: presenceDefaults, warning: '' });
  queue([member('a', 'An Lam'), member('b', 'Bình Mây'), member('c', 'Chi Mây'), gift('progress')], 3);
  const passive = frame(100).avatars[0];
  assert.equal(prepared.length, 0);
  assert.equal(driver.liveReceipt.ack, 6);
  queue([gift('final')], 7);
  const after = frame(150);
  assert.equal(driver.liveReceipt.ack, 7);
  assert.equal(after.confirmedGiftCount, 2);
  const cue = prepared[0];
  const current = after.avatars.find(actor => actor.seatId === passive.seatId)!;
  assert.equal(cue.binding?.actorId, current.actorId);
  assert.notEqual(current.actorId, passive.actorId);
  assert.equal(cue.binding?.seatId, passive.seatId);
  assert.deepEqual(cue.liveIdentity, { roomEpoch: 55, connection: 1, seq: 7, count: 2, alias: 'Lam Mây' });
  queue([session, member('a', 'An Lam')], 1, old);
  assert.equal(old.update(100).state.avatars.length, 0);
});
