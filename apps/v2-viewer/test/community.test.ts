import assert from 'node:assert/strict';
import test from 'node:test';
import { communitySlots, heroSlots } from '../src/community-layout.ts';
import { occupancy } from '../src/community-presentation.ts';
import { parseScenario, SliceDriver } from '../src/slice-driver.ts';

test('twelve seeded visual slots keep original seats and clear the root and each other', () => {
  const slots = communitySlots(9, 0, 0);
  assert.deepEqual(slots, communitySlots(9, 0, 0));
  assert.notDeepEqual(slots, communitySlots(71, 0, 0));
  assert.deepEqual(slots.slice(0, 3).map(({ decorId: _decorId, ...seat }) => seat), heroSlots);
  for (const seed of [0, 9, 71, 0xffffffff]) {
    const layout = communitySlots(seed, 0, 0);
    assert.equal(layout.length, 12);
    assert.equal(new Set(layout.map(slot => slot.decorId)).size, 12);
    assert.ok(layout.slice(3).every(slot => /^visual-/.test(slot.id)));
    for (const [i, { position: [x, y, z] }] of layout.entries()) {
      assert.equal(y, 0.065);
      assert.ok(Math.hypot(x, z) > 9);
      for (const slot of layout.slice(0, i)) {
        assert.ok(Math.hypot(x - slot.position[0], z - slot.position[2]) > 2.9);
      }
    }
  }
});

test('community binds actual members by seat and keeps visual density out of the room count', () => {
  const slots = communitySlots(9, 0, 0);
  const driver = new SliceDriver(parseScenario('community'));
  assert.equal(driver.update(0).state.viewerCount, 0);
  const initial = driver.update(2000).state;
  assert.equal(initial.viewerCount, 41);
  assert.ok(occupancy(slots, initial.avatars).every(slot => slot.kind === 'DECORATIVE_ANONYMOUS'));
  const arrived = driver.update(8300).state;
  const [an] = arrived.avatars;
  assert.equal(an.displayName, 'An');
  assert.deepEqual(occupancy(slots, arrived.avatars)[0],
    { kind: 'REAL_OCCUPIED', slotId: 'seat-1', seatId: 'seat-1', actorId: an.actorId });
  assert.equal(arrived.viewerCount, 41);
  assert.equal(driver.trace.find(log => log.atMs === 8250)?.disposition, 'duplicate');
  const disconnected = driver.update(12700).state;
  assert.equal(disconnected.connected, false);
  assert.equal(disconnected.avatars.length, 3);
  const live = driver.update(13300).state;
  assert.equal(live.connected, true);
  assert.deepEqual(live.avatars.map(actor => actor.seatId), ['seat-1', 'seat-2', 'seat-3']);
  assert.equal(live.avatars[0].actorId, an.actorId);
  assert.equal(driver.trace.filter(log => log.disposition === 'stale').length, 2);
});

test('gift reserves a real member past TTL, excess gift is text-only, room change drops old identity', () => {
  const driver = new SliceDriver('community');
  const slots = communitySlots(9, 0, 0);
  let at = 0;
  const step = (end: number) => {
    for (; at < end; at += 10) driver.update(at);
    return driver.update(end);
  };
  const focus = step(17400);
  assert.equal(focus.actor?.displayName, 'An');
  assert.equal(focus.actor?.seatId, 'seat-1');
  assert.equal(focus.overlay?.displayName, 'Duyên');
  assert.equal(focus.overlay?.actorId, undefined);
  assert.ok(driver.trace.some(log => log.effects.some(effect => effect.type === 'focusSkipped' && effect.reason === 'no-seat')));
  assert.equal(focus.state.confirmedGiftCount, 3);
  assert.equal(step(21300).actor?.actorId, focus.actor?.actorId);
  const released = step(22300);
  assert.equal(released.actor, undefined);
  assert.ok(occupancy(slots, released.state.avatars).every(slot => slot.kind === 'DECORATIVE_ANONYMOUS'));
  assert.equal(released.state.viewerCount, 41);
  const switched = step(41200);
  assert.equal(switched.state.roomSessionId, 'demo-2');
  assert.equal(switched.state.confirmedGiftCount, 0);
  assert.equal(switched.state.viewerCount, 0);
  assert.equal(driver.trace.find(log => log.atMs === 40100)?.disposition, 'stale');
  const newMember = step(47350);
  assert.equal(newMember.state.avatars[0].seatId, 'seat-1');
  assert.notEqual(newMember.state.avatars[0].actorId, focus.actor?.actorId);
  assert.equal(newMember.state.viewerCount, 19);
  assert.equal(step(66000).state.avatars.length, 0);
});
