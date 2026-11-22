import assert from 'node:assert/strict';
import test from 'node:test';
import { Vector3 } from 'three';
import { capture, createCinematicRoutes, defaultSeed, loopSeconds, parseCinematicSeed, shots } from '../src/camera.ts';

const close = { position: new Vector3(0.47, 1.4, 8.7), target: new Vector3(2, 0.97, 13.5), fov: 48 };

test('85s cinematic at 60Hz covers all shots per loop and changes actual route with fixed bounds', () => {
  const seen = new Set<string>();
  const traces = [];
  for (const seed of [1, 9, 71]) {
    const route = createCinematicRoutes(close, new Vector3(), seed);
    const replay = createCinematicRoutes(close, new Vector3(), seed);
    assert.deepEqual(route.rejected, []);
    const ordered = [new Set<string>(), new Set<string>()];
    let previous = route.sample(0);
    for (let frame = 0; frame <= 85 * 60; frame++) {
      const time = frame / 60;
      const pose = route.sample(time);
      assert.deepEqual(pose, replay.sample(time));
      ordered[pose.cycle]?.add(pose.shot);
      seen.add(pose.routeId);
      assert.equal(pose.fallback, undefined);
      assert.ok(pose.position.y >= 0.8 && pose.position.distanceTo(pose.target) >= 2.3);
      if (frame) {
        const distance = previous.position.distanceTo(pose.position);
        assert.ok(distance > 0.001 && distance < 0.22, String(distance));
        assert.ok(Math.abs(pose.fov - previous.fov) < 0.10);
        assert.ok(previous.target.distanceTo(pose.target) < 0.30);
        assert.ok(previous.target.clone().sub(previous.position).angleTo(pose.target.clone().sub(pose.position)) < 0.025);
      }
      previous = pose;
    }
    assert.deepEqual(ordered.map(set => [...set]), [shots, shots]);
    const first = route.sample(12);
    const second = route.sample(loopSeconds + 12);
    assert.notEqual(first.direction, second.direction);
    assert.ok(first.position.x * second.position.x < 0);
    traces.push([first.position.toArray(), second.position.toArray(), route.sample(20).position.toArray()]);
  }
  assert.equal(seen.size, 4);
  assert.equal(new Set(traces.map(trace => JSON.stringify(trace))).size, 3);
  assert.equal(capture.width / capture.height, 9 / 16);
});

test('cross-variant closure uses the same pose and matching position, target and FOV tangents', () => {
  const routes = createCinematicRoutes(close, new Vector3(), 9);
  const at = routes.sample(40);
  const start = routes.sample(0);
  assert.ok(at.position.distanceTo(start.position) < 1e-10);
  assert.ok(at.target.distanceTo(start.target) < 1e-10);
  assert.equal(at.fov, start.fov);
  const delta = 0.001;
  const left = routes.sample(40 - delta);
  const right = routes.sample(40 + delta);
  for (const key of ['position', 'target'] as const) {
    const before = at[key].clone().sub(left[key]).divideScalar(delta);
    const after = right[key].clone().sub(at[key]).divideScalar(delta);
    assert.ok(before.distanceTo(after) < 0.01, `${key}: ${before.distanceTo(after)}`);
  }
  assert.ok(Math.abs((right.fov - 2 * at.fov + left.fov) / delta) < 0.01);
});

test('seed query is a stable uint32 with a documented fallback', () => {
  for (const input of [null, '', 'NaN', '-1', '1.2', '4294967296', 'testroute']) {
    assert.equal(parseCinematicSeed(input), defaultSeed);
  }
  assert.equal(parseCinematicSeed('0'), 0);
  assert.equal(parseCinematicSeed('4294967295'), 4294967295);
});

test('rejecting a route reports which candidate failed and retains an accepted path', () => {
  const altered = { ...close, position: new Vector3(-8, 1.4, 8.7), fov: 50 };
  const routes = createCinematicRoutes(altered, new Vector3(), 9);
  const selected = routes.sample(52);
  assert.ok(selected.fallback?.startsWith('east-'));
  assert.ok(routes.rejected.some(rejection => rejection.id === selected.fallback));
  assert.ok(!routes.rejected.some(rejection => rejection.id === selected.routeId));
  assert.ok(selected.routeId.startsWith('west-'));
});
