import assert from 'node:assert/strict';
import test from 'node:test';
import { BoxGeometry, Color, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, PerspectiveCamera } from 'three';
import { ringSlots } from '../src/community-layout.ts';
import { fxProfiles } from '../src/fx-profiles.ts';
import { bindGoldEmphasis, liftR18Canopy } from '../src/lighting.ts';
import { createLotusBatches } from '../src/lotus-batches.ts';
import { giftClearance, lotusGap, lushLotus, petalColors, type LotusInstance } from '../src/lotus-density.ts';
import { createWater } from '../src/water.ts';

test('QUALITY density plus is seeded and respects scaled plant, tree, seat and camera clearances', () => {
  const distance = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  for (const seed of [9, 71, 1337]) {
    const slots = ringSlots(seed, 0, 0);
    const low = [[0, 1, 27], [1, 1, 27]];
    const generate = (profile: 'eco' | 'quality', plus: boolean) => lushLotus(profile, seed, [0,0,0], slots, 1.45, low, true, plus);
    const items = generate('quality', true);
    assert.deepEqual(items, generate('quality', true));
    assert.deepEqual(generate('eco', true), generate('eco', false));
    for (const [kind, count] of [['pad', 52], ['leaf', 120], ['bloom', 56], ['bud', 40]] as const) {
      const group = items.filter(item => item.kind === kind);
      assert.equal(group.length, count);
      if (kind === 'bloom' || kind === 'bud') assert.equal(new Set(group.map(item => item.petalTone)).size, 4);
    }
    for (const [i, item] of items.entries()) {
      assert(distance(item.position, [0,0,0]) >= 7 + item.radius + lotusGap);
      assert(slots.every(slot => distance(item.position, slot.position) >= item.radius +
        (slot.id.startsWith('seat-') ? giftClearance : 1.45 + lotusGap)));
      assert(low.every(sample => distance(item.position, sample) >= .8 + item.radius));
      assert(items.slice(0, i).every(other => distance(item.position, other.position) >= item.radius + other.radius + lotusGap));
    }
  }
});

test('petal tint follows the packed matrix past index 32 and leaves green materials alone', () => {
  const lotus = createLotusBatches();
  const geometry = new BoxGeometry();
  const material = new MeshStandardMaterial();
  const mesh = new Mesh(geometry, material);
  const local = new Matrix4();
  const items = Array.from({ length: 40 }, (_, i): LotusInstance => ({
    id: String(i), kind: 'bloom', position: [i === 34 ? 10 : i === 2 ? 0 : 50 + i, 0, -5], yaw: 0, scale: 1, radius: .4,
    petalTone: i === 34 ? 'deepPink' : 'warmPink',
  }));
  lotus.add('bloom', items, [{ mesh, local, tintPetals: true }, { mesh, local }], 1);
  const [petals, stem] = lotus.group.children as InstancedMesh[];
  const camera = new PerspectiveCamera(40, 1, .1, 100);
  for (const x of [0, 10, 0]) {
    camera.position.x = x;
    camera.updateMatrixWorld();
    assert.equal(lotus.update(camera).bloom, 1);
    const matrix = new Matrix4();
    petals.getMatrixAt(0, matrix);
    assert.equal(matrix.elements[12], x);
    const color = new Color();
    petals.getColorAt(0, color);
    const tone = x ? 'deepPink' : 'warmPink';
    assert.deepEqual(color.toArray(), petalColors[tone].map(Math.fround));
    assert.equal(lotus.visiblePetalTones().bloom[tone], 1);
    assert.equal(stem.instanceColor, null);
    assert.equal(stem.material, material);
  }
  lotus.dispose();
  geometry.dispose();
  material.dispose();
});

test('canopy lift shares owned clones, keeps depth and restores all source materials', () => {
  const root = new Group();
  const geometry = new BoxGeometry();
  const petal = new MeshStandardMaterial({ name: 'Canopy_peach', emissive: 0x3d242c });
  const shade = new MeshStandardMaterial({ name: 'Canopy_depth_rose', emissive: 0x3d242c });
  const bark = new MeshStandardMaterial({ name: 'Branches_plum' });
  const vein = new MeshStandardMaterial({ name: 'Golden_bark_veins' });
  const originals = [petal, shade, bark, vein];
  const mixed = new Mesh(geometry, originals);
  const shared = new Mesh(geometry, petal);
  root.add(mixed, shared);
  const gold = bindGoldEmphasis(root);
  const glow = mixed.material[3];
  const canopy = liftR18Canopy(root);
  assert.notEqual(shared.material, petal);
  assert.equal(mixed.material[0], shared.material);
  assert.equal(mixed.material[2], bark);
  assert.equal(mixed.material[3], glow);
  assert.equal(shared.material.emissive.equals(petal.emissive), true);
  assert(shared.material.emissiveIntensity > mixed.material[1].emissiveIntensity);
  const lift = shared.material.emissiveIntensity;
  canopy.update(1);
  assert.equal(shared.material.emissiveIntensity, lift);
  assert.equal(petal.emissiveIntensity, 1);
  let disposed = 0;
  shared.material.addEventListener('dispose', () => disposed++);
  canopy.dispose();
  gold.dispose();
  assert.equal(disposed, 1);
  assert.equal(shared.material, petal);
  assert.equal(mixed.material, originals);
  geometry.dispose();
  originals.forEach(material => material.dispose());
});

test('three gold lobes drift continuously, repeat at fixed time, and preserve the gift ripple', () => {
  const water = createWater(fxProfiles.quality.water, true);
  const material = water.mesh.material;
  assert.equal(material.defines.DRIFT_GOLD, undefined);
  water.enableDriftingGold();
  water.setRipple({ x: 2, z: 3, progress: .4, opacity: .75 });
  const snapshot = (t: number) => {
    water.setTime(t);
    return material.uniforms.goldLobes.value.map((point: { toArray(): number[] }) => point.toArray()) as number[][];
  };
  const first = snapshot(0);
  const next = snapshot(4);
  const nextFrame = snapshot(4 + 1 / 60);
  assert.equal(first.length, 3);
  for (const [i, values] of next.entries()) {
    assert(values.every(Number.isFinite));
    assert(Math.hypot(values[0] - first[i][0], values[1] - first[i][1]) > .1);
    assert(values.every((value, j) => Math.abs(value - nextFrame[i][j]) < .02));
  }
  assert.deepEqual(snapshot(0), first);
  assert.deepEqual(material.uniforms.giftRipple.value.toArray(), [2, 3, .4, .75]);
  water.dispose();
});
