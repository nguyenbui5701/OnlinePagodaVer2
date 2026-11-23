import assert from 'node:assert/strict';
import test from 'node:test';
import { Vector3 } from 'three';
import { createHeroRoutes } from '../src/hero-camera.ts';
import { heroSlots, ringRadii, ringSlots } from '../src/community-layout.ts';
import { createAmbientFx } from '../src/ambient-fx.ts';
import { createTrunkMist } from '../src/trunk-mist.ts';
import { richAmbientProfiles } from '../src/fx-profiles.ts';

test('two concentric rings preserve the three actor seats and nine anonymous IDs', () => {
  for (const seed of [9, 71, 1337]) {
    const slots = ringSlots(seed, 3, -2);
    assert.deepEqual(slots, ringSlots(seed, 3, -2));
    assert.equal(slots.length, 12);
    assert.deepEqual(slots.slice(0, 3).map(s => s.id), heroSlots.map(s => s.id));
    for (const [i, slot] of slots.entries()) {
      const [x, y, z] = slot.position;
      assert.equal(y, .065);
      assert(Math.abs(Math.hypot(x - 3, z + 2) - ringRadii[i < 5 ? 0 : 1]) < 1e-9);
      for (const other of slots.slice(0, i)) {
        assert(Math.hypot(x - other.position[0], z - other.position[2]) >= 6.4 - 1e-9);
      }
    }
  }
});

test('hero routes move through both new shots and share a continuous 40-second seam', () => {
  for (const seed of [9, 71, 1337]) {
    const routes = createHeroRoutes(new Vector3(), seed);
    let prior = routes.sample(0);
    const names = new Set<string>();
    let minY = Infinity;
    for (let tick = 1; tick <= 85 * 60; tick++) {
      const pose = routes.sample(tick / 60);
      minY = Math.min(minY, pose.position.y);
      const delta = pose.position.distanceTo(prior.position);
      assert(delta > .001 && delta < .22, `hero speed at ${tick / 60}: ${delta}`);
      assert(pose.fov >= 50 && pose.fov <= 65);
      assert(pose.position.z > 20 || pose.position.y > 34);
      names.add(pose.shot);
      prior = pose;
    }
    assert(minY >= 8);
    assert(names.has('HERO_TOP_RING') && names.has('HERO_WIDE_TREE_REFLECTION'));
    assert.equal(routes.sample(0).position.distanceTo(routes.sample(40).position), 0);
    assert.notEqual(routes.sample(1).routeId, routes.sample(41).routeId);
  }
});

test('rich particles stay deterministic in one batch and mist caps are separate by profile', () => {
  const tree = new Vector3();
  const pads = ringSlots(9, 0, 0).map(s => s.position);
  for (const profile of ['eco', 'quality'] as const) {
    const eco = profile === 'eco';
    const { tree: counts, perPad } = richAmbientProfiles[profile];
    const options = { pads, each: perPad };
    const first = createAmbientFx(tree, 9, counts, options);
    const second = createAmbientFx(tree, 9, counts, options);
    const mist = createTrunkMist(tree, profile);
    assert.deepEqual(first.points.geometry.attributes.position.array, second.points.geometry.attributes.position.array);
    assert.equal(first.localCount, pads.length * options.each);
    assert(first.points.geometry.attributes.position.count + mist.count <= (eco ? 128 : 320));
    first.update(2.2, 0, true);
    assert.equal(first.points.material.uniforms.localDensity.value, .06);
    assert(mist.minCenterY >= .6 && mist.maxCenterY <= 2.3);
    first.dispose();
    second.dispose();
    mist.dispose();
  }
});
