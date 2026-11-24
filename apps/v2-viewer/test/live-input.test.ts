import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeLivePoll, type LiveEntry, type LivePacket } from '../src/live-controls.ts';
import { SliceDriver } from '../src/slice-driver.ts';

const scope = { roomEpoch: 1, connection: 1, atMs: 0 };
const open = { ...scope, type: 'session', action: 'open' } satisfies LivePacket;
const batch = (start: number, ...events: LivePacket[]): LiveEntry[] => events.map((event, i) => ({ seq: start + i, event }));
const viewer = (id: number) => ({ userKey: 'local:' + id, name: 'Viewer ' + id });
const gift = (id: number) => ({ ...scope, type: 'gift', phase: 'final', giftId: '5655',
  count: 1, eventId: 'gift:' + id, viewer: viewer(id) } satisfies LivePacket);

test('LIVE starts offline and reuses existing Camera and seat rules for received events', () => {
  const driver = new SliceDriver('live');
  assert.equal(driver.update(10_000).state.connected, false);
  driver.enqueueLive(batch(1, open, { ...scope, type: 'chat', eventId: 'chat:1', viewer: viewer(1), chatText: 'xin chào' },
    { ...scope, type: 'member', eventId: 'member:1', viewer: viewer(1) }));
  assert.equal(driver.update(10_100).state.avatars.length, 0);
  driver.enqueueLive(batch(4, gift(1), gift(2), gift(3), gift(4), gift(1)));
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
  driver.enqueueLive(batch(1, open, gift(1)));
  driver.loseLiveSource();
  const state = driver.update(100).state;
  assert.equal(state.confirmedGiftCount, 1);
  assert.equal(state.connected, false);
  assert(!driver.enqueueLive(batch(3, ...Array.from({ length: 49 }, () => gift(1)))));
  assert(!new SliceDriver('idle').enqueueLive(batch(1, open)));
});

test('gateway response requires the exact protocol and contiguous delivery cursor', () => {
  const sample = { version: '0.2.0', status: 'CONNECTED_NO_EVENTS', reason: '', viewerCount: 0, dropped: 0, deliveryUncertain: false,
    counters: { chat: 0, member: 0, like: 0, giftFinal: 0, giftProgress: 0, room: 0 }, entries: [{ seq: 1, event: open }] };
  assert.equal(decodeLivePoll(sample, 0).entries.length, 1);
  assert.throws(() => decodeLivePoll(sample, 1), /LIVE_PROTOCOL/);
  assert.throws(() => decodeLivePoll({ ...sample, version: '0.1.0' }, 0), /LIVE_PROTOCOL/);
});
test('repeated polls while frames are paused keep ACK at the consumed prefix and ingest once', () => {
  const driver = new SliceDriver('live');
  assert(driver.enqueueLive(batch(1, open)));
  driver.update(0);
  const pending = batch(2, gift(1), gift(1));
  for (let i = 0; i < 5; i++) {
    assert(driver.enqueueLive(pending));
    assert.deepEqual(driver.liveReceipt, { ack: 1, failed: false });
  }
  const consumed = driver.update(100);
  assert.equal(consumed.state.confirmedGiftCount, 1);
  assert.deepEqual(driver.liveReceipt, { ack: 3, failed: false });
  assert(driver.enqueueLive(pending));
  assert.equal(driver.update(200).state.confirmedGiftCount, 1);
});

test('a rejected final blocks ACK through a same-batch reconnect and does not replay the valid tail', () => {
  const driver = new SliceDriver('live');
  const pending = batch(1, open, { ...gift(1), connection: 2 },
    { ...scope, type: 'session', action: 'disconnect' },
    { ...scope, connection: 2, type: 'session', action: 'reconnect' },
    { ...gift(2), connection: 2 });
  assert(driver.enqueueLive(pending));
  const resumed = driver.update(100);
  assert(resumed.state.connected);
  assert.equal(resumed.state.confirmedGiftCount, 1);
  assert.deepEqual(driver.liveReceipt, { ack: 1, failed: true });
  assert(driver.enqueueLive(pending.slice(1)));
  assert.equal(driver.update(200).state.confirmedGiftCount, 1);
  assert.deepEqual(driver.liveReceipt, { ack: 1, failed: true });
});

test('an invalid final blocks the contiguous ACK even when its next sequence is accepted', () => {
  const driver = new SliceDriver('live');
  assert(driver.enqueueLive(batch(1, open, { ...gift(1), count: 0 }, gift(2))));
  assert.equal(driver.update(100).state.confirmedGiftCount, 1);
  assert.deepEqual(driver.liveReceipt, { ack: 1, failed: true });
});

test('the Engine session limit latches failure without acknowledging the rejected sequence', () => {
  const driver = new SliceDriver('live');
  assert(driver.enqueueLive(batch(1, open)));
  driver.update(0);
  for (let offset = 0; offset < 65_536; offset += 48) {
    const entries = Array.from({ length: Math.min(48, 65_536 - offset) }, (_, index) => ({
      ...scope, type: 'room' as const, eventId: 'room:' + (offset + index), count: 3,
    }));
    assert(driver.enqueueLive(batch(2 + offset, ...entries)));
    driver.update(offset + 1);
  }
  assert.deepEqual(driver.liveReceipt, { ack: 65_537, failed: false });
  assert(driver.enqueueLive(batch(65_538, gift(1))));
  assert.equal(driver.update(70_000).state.confirmedGiftCount, 0);
  assert.deepEqual(driver.liveReceipt, { ack: 65_537, failed: true });
});
