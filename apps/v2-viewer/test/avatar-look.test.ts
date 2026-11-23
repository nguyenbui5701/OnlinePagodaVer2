import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { diversityEnabled, outfits, slotLooks } from '../src/avatar-look.ts';
import { outfitMappings } from '../src/avatar-variants.ts';
import { communitySlots } from '../src/community-layout.ts';
import source from '../src/p012d-actors.json' with { type: 'json' };
import original from '../src/p08-assets.json' with { type: 'json' };

function read(spec: typeof source.female) {
  const b = execFileSync('git', ['cat-file', 'blob', `${source.source.commit}:${spec.path}`]);
  assert.equal(b.length, spec.bytes);
  assert.equal(createHash('sha256').update(b).digest('hex'), spec.sha256);
  assert.equal(b.subarray(0, 4).toString(), 'glTF');
  assert.equal(b.readUInt32LE(4), 2);
  assert.equal(b.readUInt32LE(8), b.length);
  const length = b.readUInt32LE(12);
  return { json: JSON.parse(b.subarray(20, 20 + length).toString()), bin: b.subarray(28 + length) };
}

test('approved female and male Git blobs have the exact garment mappings and shared rig samples', () => {
  let reference;
  for (const spec of [source.female, original.pair.actor]) {
    const { json, bin } = read(spec);
    assert.equal(json.meshes.length, 10);
    assert.equal(json.materials.length, 21);
    assert.equal(json.textures?.length ?? 0, 0);
    const garment = outfitMappings(json);
    assert.deepEqual(garment.map(g => [g.base, g.meshIndex, g.primitiveIndex]), [['ao_ba_ba_pants', 0, 0], ['ao_ba_ba_top', 2, 0]]);
    assert.deepEqual(garment[0].byOutfit.size, 6);
    const getData = (index: number) => {
      const accessor = json.accessors[index], view = json.bufferViews[accessor.bufferView];
      assert.equal(accessor.count, 17);
      return bin.subarray(view.byteOffset, view.byteOffset + view.byteLength);
    };
    const clips = json.animations.map((clip: { name: string; samplers: { input: number; output: number }[] }) =>
      [clip.name, ...clip.samplers.flatMap(s => [getData(s.input), getData(s.output)])]);
    assert.deepEqual(clips.map((clip: unknown[]) => clip[0]), ['sit_idle', 'cross_prayer_idle']);
    const nodes = spec.anchors.map(name => json.nodes.find((node: { name: string }) => node.name === name)?.matrix);
    if (reference) assert.deepEqual({ nodes, clips }, reference);
    else reference = { nodes, clips };
  }
});

test('invalid, duplicate, or incomplete KHR primitive mappings fail closed', () => {
  const { json } = read(source.female);
  const mapping = json.meshes[0].primitives[0].extensions.KHR_materials_variants.mappings;
  const removed = mapping.pop();
  assert.throws(() => outfitMappings(json), /Incomplete/);
  mapping.push({ ...removed, variants: [0] });
  assert.throws(() => outfitMappings(json), /Invalid/);
});

test('seeded real seat and anonymous looks are purely cosmetic and palette limits are deterministic', () => {
  assert.equal(diversityEnabled(true, null), false);
  assert.equal(diversityEnabled(true, 'off'), false);
  assert.equal(diversityEnabled(false, 'on'), false);
  assert.equal(diversityEnabled(true, 'on'), true);
  for (const profile of ['eco', 'quality'] as const) {
    const slots = communitySlots(9, 0, 0).map(slot => slot.id);
    const looks = slotLooks(slots, 9, profile);
    assert.deepEqual(looks, slotLooks(slots, 9, profile));
    assert.notDeepEqual(looks, slotLooks(slots, 71, profile));
    assert.equal(looks.size, 12);
    assert.equal(looks.get('seat-1')?.model, 'femaleP05f');
    assert.equal(looks.get('seat-2')?.model, 'maleP07b1');
    const values = [...looks.values()];
    assert.equal(values.filter(look => look.model === 'femaleP05f').length, 6);
    assert.ok(values.every(look => outfits.includes(look.variant) && Object.keys(look).length === 2));
    assert.equal(new Set(values.map(look => look.variant)).size, profile === 'eco' ? 3 : 6);
  }
});
