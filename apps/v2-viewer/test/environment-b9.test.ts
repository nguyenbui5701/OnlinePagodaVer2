import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { AnimationMixer, Box3, Group, PerspectiveCamera, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createAmbientFx } from '../src/ambient-fx.ts';
import { environmentFx } from '../src/fx-profiles.ts';
import { createTrunkMist } from '../src/trunk-mist.ts';
import { habitat, koiEnvelope, koiTracks, sampleKoi } from '../src/koi-path.ts';
import { liveDefaults, migrateVisualSettings, validSettings, validWorldApplied } from '../src/live-settings.ts';
import manifest from '../src/environment-b9.json' with { type: 'json' };
import { stageB9 } from '../scripts/stage-b9.mjs';

const emptyPose = () => ({ x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, clip: 0 });
const angleGap = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

test('B9 is opt-in and preserves stored density and revisions through visual migration', () => {
  const { environment, ...b8 } = { ...liveDefaults, density: 'lush' as const };
  assert.equal(environment, 'off');
  assert.deepEqual(migrateVisualSettings(b8), { ...b8, environment });
  assert.equal(validSettings({ ...b8, environment: 'on' }), true);
  assert.equal(migrateVisualSettings({ ...b8, environment: 'invalid' }), undefined);
  const world = { requestedTree: 'R18A', tree: 'R18A', requestedDensity: 'lush', density: 'lush', fallback: false, failures: [] };
  assert(validWorldApplied(world));
  assert(validWorldApplied({ ...world, pond: true }));
  assert(validWorldApplied({ ...world, pond: ['terrain', 'MISSING'] }));
  assert(!validWorldApplied({ ...world, pond: ['terrain', 'unknown'] }));
  assert(!validWorldApplied({ ...world, pond: ['terrain', 'MISSING', 'extra'] }));
  const worst = { client: 'a'.repeat(32), ack: Number.MAX_SAFE_INTEGER, ready: true,
    audio: { revision: Number.MAX_SAFE_INTEGER, state: 'DISCONNECTED', thanks: 'UNAVAILABLE', wishes: 'UNAVAILABLE' },
    presence: { revision: Number.MAX_SAFE_INTEGER, occupied: 3, waiting: 64, dropped: Number.MAX_SAFE_INTEGER },
    world: { ...world, tree: 'R16', fallback: true, failures: [{ revision: 'R18A', code: 'INTEGRITY' }, { revision: 'R17B', code: 'INTEGRITY' }],
      pond: ['yamabuki', 'INTEGRITY'] } };
  assert(validWorldApplied(worst.world));
  assert(Buffer.byteLength(JSON.stringify(worst)) <= 512);
});

test('seeded koi are smooth and stay clear over the joint path cycle including above-water pads', () => {
  for (const profile of ['eco', 'quality'] as const) for (const seed of [9, 71, 1337]) {
    const tracks = koiTracks(profile, seed);
    assert.deepEqual(tracks, koiTracks(profile, seed));
    assert.equal(tracks.length, profile === 'eco' ? 8 : 14);
    const poses = tracks.map(emptyPose);
    for (const track of tracks) {
      const a = sampleKoi(track, 0, emptyPose());
      const b = sampleKoi(track, track.period, emptyPose());
      assert(Math.hypot(a.x-b.x, a.y-b.y, a.z-b.z) < 1e-8);
      assert(angleGap(a.yaw, b.yaw) < 1e-8);
      for (let t = 0; t < track.period; t += .21) {
        const u = sampleKoi(track, t, emptyPose());
        const v = sampleKoi(track, t + .01, emptyPose());
        const speed = Math.hypot(u.x-v.x, u.y-v.y, u.z-v.z) * 100;
        assert(speed > .58 && speed < 1.42);
        assert(angleGap(u.yaw, v.yaw) < .01);
      }
    }
    // LCM of lane and skin clip periods. Conservative margins exceed motion of any pair between samples.
    for (let t = 0; t <= 2880; t += .25) {
      for (const [i, track] of tracks.entries()) {
        const p = sampleKoi(track, t, poses[i]);
        const r = Math.hypot(p.x, p.z);
        assert(r - koiEnvelope.horizontal > habitat.root);
        assert(r + koiEnvelope.horizontal < habitat.outer);
        assert(p.y + koiEnvelope.top < habitat.padBottom);
        assert(p.y - koiEnvelope.bottom > habitat.floor);
        for (let j = 0; j < i; j++) assert(Math.hypot(p.x-poses[j].x, p.z-poses[j].z) > 2*koiEnvelope.horizontal + .7);
      }
    }
  }
});

test('B9 staging validates all eight source blobs and rejects a corrupted file without replacing the previous set', t => {
  const folder = mkdtempSync(join(tmpdir(), 'pagoda-b9-'));
  t.after(() => rmSync(folder, { force: true, recursive: true }));
  const runGit = (...args: string[]) => execFileSync('git', args, { maxBuffer: 2 * 1024 * 1024 });
  const receipts = stageB9(folder, runGit);
  assert.equal(receipts.length, 8);
  assert.throws(() => stageB9(folder, (...args: string[]) => {
    const data = runGit(...args);
    if (args[0] === 'cat-file' && args[1] === 'blob' && args[2].endsWith('terrain_quality.glb')) data[50] ^= 1;
    return data;
  }), /integrity/);
  assert.deepEqual(receipts.map(({ bytes }: { bytes: number }) => bytes),
    Object.keys(manifest.profiles).map(name => readFileSync(join(folder, 'b9', name)).length));
});

test('actual koi skins stay inside the conservative envelope over all authored frames and midpoints', async () => {
  for (const spec of Object.values(manifest.profiles)) {
    if (spec.kind !== 'koi') continue;
    const bytes = execFileSync('git', ['cat-file', 'blob', manifest.baselineCommit + ':' + manifest.canonicalDirectory + '/' + spec.file]);
    const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const { scene, animations } = await new GLTFLoader().parseAsync(data, '');
    const root = new Group();
    root.rotation.order = 'YXZ';
    root.scale.setScalar(1.12);
    root.add(scene);
    const clip = animations[0];
    assert.equal(clip.duration, 3);
    assert.equal(clip.name, 'swim_loop');
    const mixer = new AnimationMixer(scene);
    mixer.clipAction(clip).play();
    const box = new Box3();
    for (let frame = 0; frame <= 120; frame++) {
      mixer.setTime(frame / 40);
      for (const roll of [-.065, .065]) for (const pitch of [-.041, .041]) {
        root.rotation.set(pitch, 0, roll);
        root.updateMatrixWorld(true);
        box.setFromObject(root, true);
        const x = Math.max(Math.abs(box.min.x), Math.abs(box.max.x));
        const z = Math.max(Math.abs(box.min.z), Math.abs(box.max.z));
        assert(Math.hypot(x, z) < koiEnvelope.horizontal, spec.file + ': ' + JSON.stringify({x,z, frame,roll,pitch}));
        assert(box.max.y < koiEnvelope.top, spec.file);
        assert(box.min.y > -koiEnvelope.bottom, spec.file);
      }
    }
  }
});

test('FX includes seat emitters within the total cap and frees its buffers on teardown', () => {
  const tree = new Vector3();
  const camera = new PerspectiveCamera(53, 720/1280, .05, 500);
  camera.position.set(0, 10, 44);
  camera.lookAt(0, 7, 0);
  camera.updateMatrixWorld();
  for (const profile of ['eco', 'quality'] as const) {
    const { caps, perPad, mist } = environmentFx[profile];
    const pads = Array.from({ length: 50 }, (_, i) => [i, .065, 14]);
    const fx = createAmbientFx(tree, 9, caps, { pads, each: perPad }, true);
    const fog = createTrunkMist(tree, profile, true);
    assert.deepEqual(fx.totals, caps);
    assert.equal(fog.count, mist);
    const group = new Group();
    group.add(fx.points, fog.points);
    const geometry = fx.points.geometry;
    let freed = 0;
    geometry.addEventListener('dispose', () => freed++);
    for (let t = 0; t < 90; t += .3) {
      fx.update(t, .8, t % 2 > 1);
      fog.update(t, t % 2 > 1);
      assert.equal(fx.points.geometry, geometry);
      assert.equal(geometry.getAttribute('position').count, caps.motes + caps.petals + caps.leaves);
    }
    for (const [kind, count] of Object.entries(fx.spatialCounts(camera))) assert(count <= caps[kind as keyof typeof caps]);
    assert(fog.spatialCount(camera) <= mist);
    fx.dispose();
    fog.dispose();
    assert.equal(freed, 1);
    assert.equal(group.children.length, 0);
  }
});
