import assert from 'node:assert/strict';
import test from 'node:test';
import { Vector3 } from 'three';
import { protocolVersion, type Effect, type Snapshot } from '../../../packages/v2-events/src/protocol.ts';
import { createAmbientFx } from '../src/ambient-fx.ts';
import { fxProfiles, giftTiming } from '../src/fx-profiles.ts';
import { createGiftFx, GiftFxLifecycle } from '../src/gift-fx.ts';
import { SliceDriver } from '../src/slice-driver.ts';

function event(atMs: number, options: {
  room?: string; revision?: number; phase?: 'observed' | 'confirmed'; actorId?: string; requestId?: string;
} = {}) {
  const { room = 'demo-1', revision = atMs, phase = 'confirmed', actorId = 'actor-1', requestId = 'req-1' } = options;
  const binding = { actorId, seatId: 'seat-1' };
  const state: Snapshot = {
    atMs, revision, version: protocolVersion, connected: true, roomSessionId: room,
    viewerCount: 0, confirmedGiftCount: 1,
    avatars: [{ ...binding, displayName: 'An', visible: true, revision, appearanceVariant: 'meditator_base' }],
    camera: { mode: 'GIFT_FOCUS', activeActorId: actorId, activeRequestId: requestId, pendingGivers: 0 },
    focus: { actorId, requestId, roomSessionId: room, giftId: 'rose', giftCount: 1, confirmation: phase,
      firstSeenAtMs: 0, expiresAtMs: atMs + 5000 },
  };
  const ack: Extract<Effect, { type: 'giftFx' }> = {
    type: 'giftFx', actorId, requestId, atMs, displayName: 'An', giftId: 'rose',
    confirmation: phase, giftCount: phase === 'observed' ? 0 : 1, dedicatedFocus: true, anchor: 'giftFx',
  };
  return { state, ack, binding };
}

test('existing queue plays a provisional A halo, then exactly one confirmed A/B/C celebration', () => {
  const driver = new SliceDriver('capacity');
  const visual = new GiftFxLifecycle();
  const actors: string[] = [];
  for (let frame = 0; frame <= 66 * 60; frame++) {
    const atMs = Math.round(frame / 60 * 1000);
    const { state, active, actor, overlay } = driver.update(atMs);
    const cue = visual.update(state, active, actor);
    if (cue?.phase === 'confirmed' && actors.at(-1) !== cue.seatId) actors.push(cue.seatId);
    if (!actor) assert.equal(cue, undefined);
    if (overlay) assert.notEqual(cue?.actorId, overlay.actorId || 'unassigned');
  }
  assert.deepEqual(actors, ['seat-1', 'seat-2', 'seat-3']);
  assert.deepEqual(visual.starts, { observed: 1, confirmed: 3 });
  assert.equal(visual.ledgerSize, 3);
  assert.equal(driver.update(66100).state.confirmedGiftCount, 8);
});

test('observed and confirmed phases follow typed ack, mode and exact actor/seat identity', () => {
  const visual = new GiftFxLifecycle();
  const observed = event(100, { phase: 'observed' });
  observed.state.camera.mode = 'GIFT_TRANSITION';
  assert.equal(visual.update(observed.state, observed.ack, { ...observed.binding, seatId: 'seat-2' }), undefined);
  assert.equal(visual.update(observed.state, observed.ack, observed.binding)?.phase, 'observed');
  const held = event(250, { phase: 'observed' });
  assert.equal(visual.update(held.state, held.ack, held.binding)?.startedAtMs, 100);

  const final = event(300);
  final.state.camera.mode = 'GIFT_TRANSITION';
  assert.equal(visual.update(final.state, final.ack, final.binding)?.phase, 'observed');
  final.state.camera.mode = 'GIFT_FOCUS';
  assert.equal(visual.update(final.state, final.ack, final.binding)?.phase, 'confirmed');
  assert.equal(visual.update(final.state, final.ack, final.binding)?.startedAtMs, 300);
  assert.deepEqual(visual.starts, { observed: 1, confirmed: 1 });
});

test('missing seat, expired request and overlay never receive spatial FX', () => {
  const visual = new GiftFxLifecycle();
  const { state, ack, binding } = event(100);
  assert.equal(visual.update(state, { ...ack, dedicatedFocus: false, anchor: 'overlay' }, binding), undefined);
  assert.equal(visual.update(state, ack, undefined), undefined);
  state.focus!.expiresAtMs = 100;
  assert.equal(visual.update(state, ack, binding), undefined);
  assert.equal(visual.ledgerSize, 0);
});

test('return shortens a live fade and the next actor owns the only cue', () => {
  const visual = new GiftFxLifecycle();
  const first = event(100);
  visual.update(first.state, first.ack, first.binding);
  const returning = { ...first.state, atMs: 400, revision: 400, focus: undefined,
    camera: { mode: 'CINE_RETURN' as const, pendingGivers: 0 } };
  const visible = visual.update(returning);
  assert.ok(visible && visible.opacity > 0);
  const faded = visual.update({ ...returning, atMs: 510, revision: 510 });
  assert.ok(faded && faded.opacity < visible.opacity);
  const next = event(550, { actorId: 'actor-2', requestId: 'req-2' });
  assert.equal(visual.update(next.state, next.ack, next.binding)?.actorId, next.binding.actorId);
  const nextReturn = { ...returning, atMs: 800, revision: 800 };
  visual.update(nextReturn);
  assert.equal(visual.update({ ...nextReturn, atMs: 800 + giftTiming.exitFadeMs, revision: 1200 }), undefined);
});

test('disconnect clears visuals, reconnect avoids replay and room epoch rejects old revision', () => {
  const visual = new GiftFxLifecycle();
  const first = event(100);
  visual.update(first.state, first.ack, first.binding);
  assert.equal(visual.update({ ...first.state, connected: false, atMs: 180, revision: 180 }, first.ack, first.binding), undefined);
  const reconnect = event(190);
  assert.equal(visual.update(reconnect.state, reconnect.ack, reconnect.binding), undefined);
  const next = event(200, { room: 'demo-2' });
  assert.equal(visual.update(next.state, next.ack, next.binding)?.roomSessionId, 'demo-2');
  assert.equal(visual.ledgerSize, 1);
  assert.equal(visual.update(first.state, first.ack, first.binding), undefined);
  assert.equal(visual.update(next.state, next.ack, next.binding)?.roomSessionId, 'demo-2');
  assert.equal(visual.starts.confirmed, 2);
});

test('visual ledger is bounded and has no eviction replay', () => {
  const visual = new GiftFxLifecycle();
  for (let i = 0; i < 290; i++) {
    const gift = event(i * 1700, { requestId: 'request-' + i });
    visual.update(gift.state, gift.ack, gift.binding);
  }
  assert.equal(visual.ledgerSize, 256);
  assert.equal(visual.starts.confirmed, 256);
  assert.equal(visual.suppressed, 1);
  const duplicate = event(500000, { requestId: 'request-0' });
  assert.equal(visual.update(duplicate.state, duplicate.ack, duplicate.binding), undefined);
});

test('profile pools have fixed capacity and deterministic seed attributes', () => {
  const origin = new Vector3(1, 0, 4);
  const first = createAmbientFx(origin, 9, fxProfiles.eco.ambient);
  const repeat = createAmbientFx(origin, 9, fxProfiles.eco.ambient);
  const other = createAmbientFx(origin, 10, fxProfiles.quality.ambient);
  const gift = createGiftFx(fxProfiles.eco.giftSparks);
  try {
    const attrs = (fx: typeof first) => fx.points.geometry.getAttribute('position');
    assert.equal(attrs(first).count, 91);
    assert.equal(attrs(other).count, 183);
    assert.deepEqual(attrs(first).array, attrs(repeat).array);
    assert.notDeepEqual(attrs(first).array.slice(0, 24), attrs(other).array.slice(0, 24));
    assert.equal(gift.cloud.geometry.getAttribute('position').count, 19);
    assert.equal(first.points.material.depthTest, true);
    assert.equal(gift.cloud.material.depthWrite, false);
  } finally {
    first.dispose();
    repeat.dispose();
    other.dispose();
    gift.dispose();
  }
});
