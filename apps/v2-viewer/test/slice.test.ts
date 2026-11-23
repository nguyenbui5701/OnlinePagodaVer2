import assert from 'node:assert/strict';
import test from 'node:test';
import { Vector3 } from 'three';
import { DemoEngine } from '../../../packages/v2-events/src/engine.ts';
import { gift, session } from '../../../packages/v2-events/src/fixture.ts';
import { createCinematicRoutes } from '../src/camera.ts';
import { SliceCamera } from '../src/slice-camera.ts';
import { SceneObserver, SliceDriver } from '../src/slice-driver.ts';

test('v0.2.0 serialized snapshots resolve exact actor/seat and reject stale protocol/revision', () => {
  const engine = new DemoEngine();
  const observer = new SceneObserver();
  engine.ingest(session());
  engine.ingest(gift('A', 1));
  const initial = engine.snapshot();
  const serialized = JSON.parse(JSON.stringify(initial));
  assert.equal(serialized.version, '0.2.0');
  assert.equal(observer.accept({ ...serialized, version: '0.1.0' }), false);
  assert.equal(observer.accept(serialized), true);
  assert.equal(observer.target(initial.focus)?.seatId, 'seat-1');
  assert.equal(observer.target({ ...initial.focus!, actorId: 'other' }), undefined);
  engine.ingest(session('reconnect', 2, 1, 2));
  assert.equal(observer.accept(engine.snapshot()), true);
  assert.equal(observer.target(initial.focus)?.actorId, initial.focus?.actorId);
  assert.equal(engine.ingest(gift('B', 3)).disposition, 'stale');
  engine.ingest(session('open', 4, 2));
  assert.equal(observer.accept(engine.snapshot()), true);
  assert.equal(observer.accept(initial), false);
  assert.equal(observer.target(initial.focus), undefined);
});

test('integrated controller counts final gifts once, focuses A/B/C, and reports D fallback', () => {
  const driver = new SliceDriver('capacity');
  assert.equal(driver.update(45000).state.camera.mode, 'CINEMATIC');
  let fallback;
  const observed: string[] = [];
  for (let at = 45010; at <= 66000; at += 10) {
    const presentation = driver.update(at);
    if (presentation.overlay) fallback = presentation.overlay.displayName;
    if (presentation.actor && presentation.state.camera.mode === 'GIFT_FOCUS') {
      const name = presentation.actor.displayName;
      if (observed.at(-1) !== name) observed.push(name);
    }
  }
  assert.deepEqual(observed, ['An', 'Bình', 'Chi']);
  assert.equal(fallback, 'Duyên');
  assert.equal(driver.trace.filter(item => item.disposition === 'duplicate').length, 3);
  assert.ok(driver.trace.some(item => item.effects.some(effect => effect.type === 'focusSkipped' && effect.reason === 'no-seat')));
  assert.equal(driver.update(67000).state.confirmedGiftCount, 8);
  assert.equal(driver.update(68000).state.camera.mode, 'CINEMATIC');
});

test('renderer camera starts each handoff at the prior pose and reaches the current cinematic on return', () => {
  const director = new SliceCamera();
  const demo = new SliceDriver('gifts');
  const close = { position: new Vector3(0.47, 1.4, 8.7), target: new Vector3(2, 0.97, 13.5), fov: 48 };
  const routes = createCinematicRoutes(close, new Vector3(), 9);
  const targets = [2, -1.4, 4.8];
  let previous;
  let previousId;
  let handoffs = 0;
  for (let at = 45000; at <= 66000; at += 16) {
    const { state, actor } = demo.update(at);
    const x = actor ? targets[Number(actor.seatId.at(-1)) - 1] : undefined;
    const focus = x !== undefined && state.focus ? { requestId: state.focus.requestId, pose: {
      ...close, position: new Vector3(x, 1.4, 8), target: new Vector3(x, 0.9, 13),
    } } : undefined;
    const cinematic = routes.sample(director.routeSeconds(at, focus?.requestId));
    const pose = director.move(at, cinematic, focus);
    if (previous && focus?.requestId !== previousId) {
      handoffs++;
      assert.ok(previous.distanceTo(pose.position) < 1e-9);
    }
    if (previous) assert.ok(previous.distanceTo(pose.position) < 0.8, String(previous.distanceTo(pose.position)));
    previous = pose.position;
    previousId = focus?.requestId;
  }
  assert.equal(handoffs, 4);
  const cinematic = routes.sample(director.routeSeconds(66500));
  assert.deepEqual(director.move(66500, cinematic), cinematic);
});
