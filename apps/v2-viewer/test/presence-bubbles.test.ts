import assert from 'node:assert/strict';
import test from 'node:test';
import { avatarInitial } from '../src/avatar-badge.ts';
import { chatAnimation, giftToken } from '../src/presence-bubbles.ts';
import { SliceDriver } from '../src/slice-driver.ts';
import { presenceDemo } from '../src/presence-demo.ts';

test('chat has a bounded readable dwell followed by rising and fading', () => {
  for (const [length, dwell] of [[0, 1000], [120, 2000]]) {
    assert.equal(chatAnimation(-1, length), undefined);
    assert.equal(chatAnimation(dwell - 1, length)?.phase, 'read');
    assert.deepEqual(chatAnimation(dwell, length), { phase: 'float', scale: 1, rise: 0, opacity: 1 });
    const mid = chatAnimation(dwell + 450, length)!;
    assert.equal(mid.rise, 29);
    assert.equal(mid.opacity, 0.5);
    assert.ok(mid.scale < 1);
    assert.equal(chatAnimation(dwell + 900, length), undefined);
  }
});

test('initials and gift type mapping use local fallback only', () => {
  assert.equal(avatarInitial('🌸 ánh'), 'Á');
  assert.equal(avatarInitial('🌸'), '•');
  assert.equal(giftToken('rose'), 'rosette');
  assert.equal(giftToken('lantern'), 'lantern');
  assert.equal(giftToken('constructor'), 'neutral');
});

test('driver relays accepted chat and clears it at disconnect, TTL and room changes', () => {
  const events = presenceDemo(true, false);
  const driver = new SliceDriver('community', events);
  assert.equal(driver.update(8400).chat?.seatId, 'seat-1');
  assert.equal(driver.update(8500).chat?.eventId, 'bubble-short');
  assert.equal(driver.update(11300).chat, undefined);
  assert.equal(driver.update(12500).chat, undefined);
  assert.equal(driver.update(13400).chat?.seatId, 'seat-2');
  assert.equal(driver.update(14200).chat?.seatId, undefined);
  assert.equal(driver.update(40100).chat, undefined);
  const offline = new SliceDriver('offline', events).update(45000);
  assert.equal(offline.chat, undefined);
  assert.equal(offline.state.avatars.length, 0);
  assert.equal(offline.state.connected, false);
});
