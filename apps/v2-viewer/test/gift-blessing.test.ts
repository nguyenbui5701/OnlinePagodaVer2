import assert from 'node:assert/strict';
import test from 'node:test';
import { Vector3 } from 'three';
import { GiftFxLifecycle } from '../src/gift-fx.ts';
import { fxProfiles } from '../src/fx-profiles.ts';
import { blessingEnabled, blessingParticles, planBlessing } from '../src/gift-blessing.ts';
import { createBlessingCloud } from '../src/blessing-cloud.ts';
import { SliceDriver } from '../src/slice-driver.ts';

const binding = { roomSessionId: 'demo-1', requestId: 'demo-gift-1', actorId: 'actor-a', seatId: 'seat-1' };
const confirmed = { ...binding, phase: 'confirmed' as const, startedAtMs: 4000, expiresAtMs: 9000, progress: 0, opacity: 1 };

test('blessing is explicitly enabled for gift DEMOs with FX only', () => {
  for (const scenario of ['gifts', 'capacity', 'community'] as const) {
    assert.equal(blessingEnabled(null, scenario, true), false);
    assert.equal(blessingEnabled('off', scenario, true), false);
    assert.equal(blessingEnabled('on', scenario, false), false);
    assert.equal(blessingEnabled('on', scenario, true), true);
  }
  assert.equal(blessingEnabled('on', 'idle', true), false);
});

test('the warm, rising, tree-directed and fade envelopes are deterministic on the original cue clock', () => {
  const at = (age: number) => planBlessing(confirmed, binding, confirmed.startedAtMs + age)!;
  assert.equal(at(100).warm, 1);
  assert.equal(at(100).halos, 0);
  assert.equal(at(300).stage, 'ascent');
  assert.ok(at(350).halos > at(220).halos);
  assert.equal(at(400).trail, 0);
  assert.equal(at(870).stage, 'toward-sakura');
  assert.ok(at(870).trail > 0.9);
  assert.equal(at(1500).stage, 'fade');
  assert.ok(at(1620).trail < at(1500).trail);
  assert.equal(at(1650), undefined);
  assert.equal(at(-1), undefined);
  assert.deepEqual(at(870), at(870));
});

test('observed, expired and foreign room/request/seat/actor cues never plan a spatial blessing', () => {
  assert.equal(planBlessing({ ...confirmed, phase: 'observed' }, binding, 4100), undefined);
  assert.equal(planBlessing(confirmed, undefined, 4100), undefined);
  assert.equal(planBlessing({ ...confirmed, expiresAtMs: 4100 }, binding, 4100), undefined);
  for (const key of ['roomSessionId', 'requestId', 'actorId', 'seatId'] as const) {
    assert.equal(planBlessing(confirmed, { ...binding, [key]: 'stale' }, 4100), undefined);
  }
});

test('fixture observed and duplicate receipts share the engine-owned FIFO and launch only three confirmed cues', () => {
  const driver = new SliceDriver('capacity');
  const lifecycle = new GiftFxLifecycle();
  const starts = new Map<string, number>();
  let sawObserved = false;
  let sawTextOnly = false;
  for (let t = 45500; t <= 66000; t += 10) {
    const { state, active, actor, overlay } = driver.update(t);
    const cue = lifecycle.update(state, active, actor);
    const planned = planBlessing(cue, actor && state.focus && {
      ...actor, roomSessionId: state.roomSessionId, requestId: state.focus.requestId,
    }, state.atMs);
    if (cue?.phase === 'observed') { sawObserved = true; assert.equal(planned, undefined); }
    if (overlay) { sawTextOnly = true; assert.equal(overlay.actorId, undefined); }
    if (planned && cue) {
      if (starts.has(cue.seatId)) assert.equal(starts.get(cue.seatId), cue.startedAtMs);
      starts.set(cue.seatId, cue.startedAtMs);
    }
  }
  assert.ok(sawObserved && sawTextOnly);
  assert.deepEqual([...starts.keys()], ['seat-1', 'seat-2', 'seat-3']);
  assert.deepEqual(lifecycle.starts, { observed: 1, confirmed: 3 });
});

test('profiles reuse one seeded fixed buffer and release the geometry and shader once', () => {
  for (const [name, limit] of [['eco', 16], ['quality', 26]] as const) {
    const profile = fxProfiles[name].blessing;
    const d = blessingParticles(9, profile.halos, profile.sparks);
    assert.equal(d.length, limit * 3);
    assert.deepEqual(d, blessingParticles(9, profile.halos, profile.sparks));
    assert.notDeepEqual(d, blessingParticles(71, profile.halos, profile.sparks));
    const layer = createBlessingCloud(new Vector3(), 9, profile);
    let disposed = 0;
    layer.cloud.geometry.addEventListener('dispose', () => disposed++);
    layer.cloud.material.addEventListener('dispose', () => disposed++);
    assert.equal(layer.cloud.geometry.attributes.position.count, limit);
    assert.equal(layer.cloud.visible, false);
    layer.dispose();
    assert.equal(disposed, 2);
  }
});
