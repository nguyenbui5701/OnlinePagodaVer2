import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { botanicalLayout, botanicalsEnabled, botanicalMargin, botanicalRadius, botanicalTreeRadius } from '../src/botanical-layout.ts';
import { communitySlots } from '../src/community-layout.ts';
import manifest from '../src/p012b-botanicals.json' with { type: 'json' };

test('runtime manifest and pinned binary structure match the approved PR #10 art handoff', () => {
  const { source, profiles } = manifest;
  const git = (...args: string[]) => execFileSync('git', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  assert.equal(source.commit, '9a01b39afde642d55dcf9bc7639f3a84ef913e4d');
  assert.equal(source.ref, 'refs/pull/10/head');
  const art = JSON.parse(git('cat-file', 'blob', `${source.commit}:${source.canonicalDirectory}/asset_manifest.json`).toString());
  for (const [lod, entries] of Object.entries(profiles)) {
    for (const [kind, spec] of Object.entries(entries)) {
      const path = `${source.canonicalDirectory}/${spec.file}`;
      const reference = art.assets.find((asset: { kind: string; lod: string }) => asset.kind === kind && asset.lod === lod);
      const bytes = git('cat-file', 'blob', `${source.commit}:${path}`);
      assert.equal(bytes.subarray(0, 4).toString(), 'glTF');
      assert.equal(bytes.readUInt32LE(4), 2);
      assert.equal(bytes.readUInt32LE(8), spec.bytes);
      assert.equal(bytes.length, reference.bytes);
      assert.equal(spec.sha256, reference.sha256);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), spec.sha256);
      const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
      const primitives = gltf.meshes.flatMap((mesh: { primitives: { indices: number }[] }) => mesh.primitives);
      assert.equal(gltf.meshes.length, spec.meshCount);
      assert.equal(primitives.length, spec.primitiveCount);
      assert.equal(primitives.reduce((total: number, primitive: { indices: number }) =>
        total + gltf.accessors[primitive.indices].count / 3, 0), spec.triangles);
      assert.equal(gltf.materials.length, spec.materials);
      assert.equal(gltf.textures?.length ?? 0, 0);
      assert.deepEqual(reference.boundsMinMaxMeters, spec.bounds);
      assert.equal(spec.bounds[0][1], 0);
    }
  }
});

test('botanical switch only applies to an enabled 12-slot scene', () => {
  for (const value of [null, 'on', 'off']) assert.equal(botanicalsEnabled(false, value), false);
  assert.ok(botanicalsEnabled(true, null));
  assert.ok(botanicalsEnabled(true, 'on'));
  assert.equal(botanicalsEnabled(true, 'off'), false);
});

test('seeded botanical layers are repeatable, bounded and clear the original slots and tree', () => {
  const tree = [0, 0, 0];
  const layout = (seed: number, profile: 'eco' | 'quality') =>
    botanicalLayout(profile, seed, tree, communitySlots(seed, 0, 0), 1.06715);
  for (const seed of [0, 9, 71, 0xffffffff]) {
    const eco = layout(seed, 'eco'), quality = layout(seed, 'quality');
    assert.deepEqual(quality, layout(seed, 'quality'));
    assert.deepEqual(eco, quality.slice(0, eco.length));
    assert.ok(eco.length > 4 && eco.length <= 8 && quality.length > eco.length && quality.length <= 13);
    const gap = ([x, , z]: number[], [px, , pz]: number[]) => Math.hypot(x - px, z - pz);
    for (const [i, plant] of quality.entries()) {
      assert.match(plant.id, /^(flower|bud)-\d+$/);
      assert.equal(plant.position[1], 0);
      assert.equal(Object.keys(plant).sort().join(','), 'id,kind,position,yaw');
      const radius = botanicalRadius[plant.kind];
      assert.ok(gap(plant.position, tree) >= radius + botanicalTreeRadius + botanicalMargin);
      for (const slot of communitySlots(seed, 0, 0)) {
        assert.ok(gap(plant.position, slot.position) >= radius + 1.06715 + botanicalMargin);
      }
      for (const previous of quality.slice(0, i)) {
        assert.ok(gap(plant.position, previous.position) >= radius + botanicalRadius[previous.kind] + botanicalMargin);
      }
    }
  }
  assert.notDeepEqual(layout(9, 'quality'), layout(71, 'quality'));
});
