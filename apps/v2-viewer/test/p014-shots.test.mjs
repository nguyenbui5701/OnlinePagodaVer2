import assert from 'node:assert/strict';
import test from 'node:test';
import { Vector3 } from 'three';
import { combinations, performanceShots, profiles, seeds, shots, underTreeReview } from '../scripts/p014-shots.mjs';
import { capture, createCinematicRoutes, loopSeconds } from '../src/camera.ts';

test('P0.14 maps all seven reference intentions to distinct, deterministic review cases', () => {
  assert.deepEqual(shots.map(shot => shot.referenceSeconds), [1, 7.5, 12.5, 22.5, 26.5, 34.5, 44.5]);
  assert.deepEqual(shots.map(shot => shot.key), ['HERO_CLOSE', 'COMMUNITY_LOW', 'SAKURA_AERIAL', 'GIFT_FOCUS',
    'LAKE_REFLECTION', 'GOLD_UNDER_TREE', 'RETURN_TREE']);
  assert.equal(shots.find(shot => shot.key === 'GIFT_FOCUS').time, 18.1);
  assert.equal(shots.find(shot => shot.key === 'RETURN_TREE').fixed, undefined);
  const grid = combinations();
  assert.equal(grid.length, 42);
  assert.equal(new Set(grid.map(row => [row.key, row.seed, row.profile].join('/'))).size, 42);
  assert.deepEqual(grid, combinations());
  assert.deepEqual(profiles, ['eco', 'quality']);
  assert.deepEqual(seeds, [9, 71, 1337]);
  assert.equal(performanceShots.length, 5);
  assert.deepEqual([capture.width, capture.height, capture.safeMargin], [720, 1280, .08]);
});

test('the QA-only under-tree framing preserves lens and adds distance from the trunk', () => {
  const original = shots.find(shot => shot.key === 'GOLD_UNDER_TREE').fixed;
  assert.equal(underTreeReview.fov, original.fov);
  assert.ok(Math.hypot(...underTreeReview.position) > Math.hypot(...original.position));
  assert.ok(underTreeReview.position[1] > .8);
  assert.ok(underTreeReview.target[1] < original.target[1]);
});

test('third-seed route selection remains deterministic and continuous through two exact cycle seams', () => {
  const tree = new Vector3();
  const close = { position: new Vector3(.47, 1.4, 8.7), target: new Vector3(2, .97, 13.5), fov: 48 };
  for (const seed of seeds) {
    const routes = createCinematicRoutes(close, tree, seed);
    const repeat = createCinematicRoutes(close, tree, seed);
    assert.deepEqual(routes.sample(14.5), repeat.sample(14.5));
    for (const t of [loopSeconds, loopSeconds * 2]) {
      const previous = routes.sample(t - 1 / 60);
      const next = routes.sample(t);
      assert.ok(next.position.distanceTo(previous.position) < .22);
      assert.ok(Math.abs(next.fov - previous.fov) < .1);
      assert.notEqual(next.direction, previous.direction);
    }
  }
});
