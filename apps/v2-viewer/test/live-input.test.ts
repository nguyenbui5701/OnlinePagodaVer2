import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeLivePoll, type LivePacket } from '../src/live-controls.ts';
import { SliceDriver } from '../src/slice-driver.ts';

const scope = { roomEpoch: 1, connection: 1, atMs: 0 };
const open = { ...scope, type: 'session', action: 'open' } satisfies LivePacket;
const viewer = (id: number) => ({ userKey: 'local:' + id, name: 'Viewer ' + id });
const gift = (id: number) => ({ ...scope, type: 'gift', phase: 'final', giftId: '5655',
  count: 1, eventId: 'gift:' + id, viewer: viewer(id) } satisfies LivePacket);

test('LIVE starts offline and reuses existing Camera and seat rules for received events', () => {
  const driver = new SliceDriver('live');
  assert.equal(driver.update(10_000).state.connected, false);
  driver.enqueueLive([open, { ...scope, type: 'chat', eventId: 'chat:1', viewer: viewer(1), chatText: 'xin chào' },
    { ...scope, type: 'member', eventId: 'member:1', viewer: viewer(1) }]);
  assert.equal(driver.update(10_100).state.avatars.length, 0);
  driver.enqueueLive([gift(1), gift(2), gift(3), gift(4), gift(1)]);
  const result = driver.update(10_200);
  assert.equal(result.state.confirmedGiftCount, 4);
  assert.equal(result.state.avatars.length, 3);
  assert.equal(result.actor?.seatId, 'seat-1');
  assert.equal(result.overlay?.displayName, 'Viewer 4');
  assert.equal(driver.update(11_260).state.camera.mode, 'GIFT_FOCUS');
  assert.equal(driver.update(17_110).actor?.seatId, 'seat-2');
  assert.equal(driver.trace.length, 0);
});

test('local link loss keeps already received final gifts and disconnects the same scope', () => {
  const driver = new SliceDriver('live');
  driver.enqueueLive([open, gift(1)]);
  driver.loseLiveSource();
  const state = driver.update(100).state;
  assert.equal(state.confirmedGiftCount, 1);
  assert.equal(state.connected, false);
  assert(!driver.enqueueLive(Array.from({ length: 257 }, () => gift(1))));
  assert(!new SliceDriver('idle').enqueueLive([open]));
});

test('gateway response requires the exact protocol and contiguous delivery cursor', () => {
  const sample = { version: '0.2.0', status: 'CONNECTED_NO_EVENTS', reason: '', viewerCount: 0, dropped: 0,
    counters: { chat: 0, member: 0, like: 0, giftFinal: 0, giftProgress: 0, room: 0 }, entries: [{ seq: 1, event: open }] };
  assert.equal(decodeLivePoll(sample, 0).entries.length, 1);
  assert.throws(() => decodeLivePoll(sample, 1), /LIVE_PROTOCOL/);
  assert.throws(() => decodeLivePoll({ ...sample, version: '0.1.0' }, 0), /LIVE_PROTOCOL/);
});