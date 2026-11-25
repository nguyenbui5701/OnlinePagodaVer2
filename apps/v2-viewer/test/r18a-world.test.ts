import assert from 'node:assert/strict';
import test from 'node:test';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Matrix4 } from 'three';
import { parseTreeRevision, resolveTree } from '../src/asset.ts';
import { createCommunityBatches } from '../src/community-batches.ts';
import { ringSlots } from '../src/community-layout.ts';
import { liveDefaults, migrateVisualSettings, validSettings } from '../src/live-settings.ts';
import { createLotusBatches } from '../src/lotus-batches.ts';
import { densityTargets, giftClearance, lotusGap, lushLotus } from '../src/lotus-density.ts';

test('R18a resolves down the same-profile chain, reports failures and honours abort', async () => {
  assert.equal(parseTreeRevision('r18a'), 'R18A');
  const seen: string[] = [];
  const result = await resolveTree('R18A', new AbortController().signal, async revision => {
    seen.push(revision);
    if (revision !== 'R16') throw new Error('invalid ' + revision);
    return { revision, dispose() {} };
  });
  assert.deepEqual(seen, ['R18A', 'R17B', 'R16']);
  assert.equal(result.asset.revision, 'R16');
  assert.match(result.fallbackReason!, /R18A.*R17B/);
  await assert.rejects(resolveTree('R18A', new AbortController().signal, async revision => { throw new Error(revision); }),
    /R18A.*R17B.*R16/);
  const aborted = new AbortController();
  let disposed = 0;
  await assert.rejects(resolveTree('R18A', aborted.signal, async () => {
    aborted.abort();
    return { dispose() { disposed++; } };
  }), { name: 'AbortError' });
  assert.equal(disposed, 1);
});

test('old settings gain only legacy density, quality and unknown options retain strict validation', () => {
  const { density, ...older } = liveDefaults;
  assert.equal(density, 'legacy');
  assert.deepEqual(migrateVisualSettings({ ...older, seed: 71 }), { ...liveDefaults, seed: 71 });
  assert.equal(migrateVisualSettings({ ...older, unexpected: true }), undefined);
  assert.equal(migrateVisualSettings({ ...older, tree: undefined }), undefined);
  assert.equal(validSettings({ ...liveDefaults, profile: 'high' }), false);
  assert.equal(validSettings({ ...liveDefaults, tree: 'r18a', density: 'lush' }), true);
});

test('density is deterministic with clearance and full budgets across seeds and profiles', () => {
  const distance = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  for (const profile of ['eco', 'quality'] as const) for (const seed of [9, 71, 1337]) {
    const slots = ringSlots(seed, 0, 0);
    const low = [[0, 1, 27], [1, 1, 27]];
    const items = lushLotus(profile, seed, [0,0,0], slots, 1.45, low, true);
    assert.deepEqual(items, lushLotus(profile, seed, [0,0,0], slots, 1.45, low, true));
    for (const kind of ['pad', 'leaf', 'bloom', 'bud'] as const) {
      assert.equal(items.filter(item => item.kind === kind).length, densityTargets[profile][kind]);
    }
    for (const [i, entry] of items.entries()) {
      assert(distance(entry.position, [0,0,0]) >= 7 + entry.radius + lotusGap);
      assert(slots.every(slot => distance(entry.position, slot.position) >= entry.radius +
        (slot.id.startsWith('seat-') ? giftClearance : 1.45 + lotusGap)));
      assert(low.every(sample => distance(entry.position, sample) >= .8 + entry.radius));
      for (const other of items.slice(0, i)) {
        assert(distance(entry.position, other.position) >= entry.radius + other.radius + lotusGap);
      }
    }
    assert.equal(lushLotus(profile, seed, [0,0,0], slots, 1.45, low, false)
      .some(item => item.kind === 'bloom' || item.kind === 'bud'), false);
  }
});

test('static pads and leaves omit the nested seated actor and share the P02 mesh', () => {
  const root = new Group();
  const anchor = new Group();
  const actor = new Group();
  const pad = new Mesh(new BoxGeometry(2, .2, 2), new MeshBasicMaterial());
  const figure = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  root.add(pad, anchor);
  anchor.add(actor);
  actor.add(figure);
  const batches = createLotusBatches();
  batches.addPad(root, actor, ['pad', 'leaf'].map((kind, i) => ({
    id: kind, kind: kind as 'pad' | 'leaf', position: [i,0,0], radius: 1, yaw: 0, scale: 1,
  })));
  assert.equal(batches.batchCount, 2);
  for (const batch of batches.group.children) assert.equal((batch as Mesh).geometry, pad.geometry);
  batches.dispose();
  pad.geometry.dispose(); pad.material.dispose(); figure.geometry.dispose(); figure.material.dispose();
});

test('independent static pools keep index 32 distinct from index zero and free only their matrices', () => {
  const batch = createLotusBatches();
  const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  const sources = [{ mesh, local: new Matrix4() }];
  batch.add('leaf', Array.from({ length: 40 }, (_, i) => ({
    kind: 'leaf', position: [i === 32 ? 0 : 20 + i, 0, -5], yaw: 0, scale: 1, radius: .4,
  })), sources, 1);
  const camera = new PerspectiveCamera(40, 1, .1, 100);
  camera.updateMatrixWorld();
  assert.equal(batch.update(camera).leaf, 1);
  camera.position.set(100, 0, 0);
  camera.updateMatrixWorld();
  assert.equal(batch.update(camera).leaf, 0);
  let sourceDisposed = false;
  mesh.geometry.addEventListener('dispose', () => { sourceDisposed = true; });
  batch.dispose();
  assert.equal(sourceDisposed, false);
  assert.equal(batch.group.children.length, 0);
  mesh.geometry.dispose();
  mesh.material.dispose();
  assert.throws(() => createCommunityBatches(Array(33)), RangeError);
});
