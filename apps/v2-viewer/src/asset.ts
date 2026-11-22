import { Box3, DoubleSide, MeshStandardMaterial } from 'three';
import { importVerifiedGlb, inspectMeshes } from './verified-glb.ts';
import manifest from './sakura-r16.json';

export type Profile = keyof typeof manifest.profiles;

export async function loadSakura(profile: Profile, signal: AbortSignal) {
  const expected = manifest.profiles[profile];
  const { gltf: model, hash, bytes } = await importVerifiedGlb('r16', expected, signal);
  const root = model.scene;
  const bounds = new Box3().setFromObject(root);
  const { triangles, meshes, materials: runtimeMaterials, dispose } = inspectMeshes(root);
  const byIndex = new Map([...runtimeMaterials].flatMap(material => {
    const index = model.parser.associations.get(material)?.materials;
    return index === undefined ? [] : [[index, material] as const];
  }));
  const materials = [...byIndex.entries()].map(([index, material]) => {
    const source = model.parser.json.materials[index];
    const pbr = material instanceof MeshStandardMaterial;
    const factors = source.pbrMetallicRoughness;
    const close = (a: number, b: number) => Math.abs(a - b) < 1e-5;
    return {
      name: source.name as string, pbr, doubleSided: material.side === DoubleSide,
      matchesSource: pbr && (material.side === DoubleSide) === !!source.doubleSided &&
        close(material.roughness, factors?.roughnessFactor ?? 1) &&
        close(material.metalness, factors?.metallicFactor ?? 1) &&
        material.color.toArray().every((value, i) => close(value, factors?.baseColorFactor?.[i] ?? 1)) &&
        material.emissive.toArray().every((value, i) => close(value, source.emissiveFactor?.[i] ?? 0)),
    };
  });
  const axesValid = Math.abs(bounds.min.y - expected.yBounds[0]) < 0.001 &&
    Math.abs(bounds.max.y - expected.yBounds[1]) < 0.001;
  if (triangles !== expected.triangles || !axesValid || materials.length !== model.parser.json.materials.length ||
      materials.some(material => !material.matchesSource || (material.name.includes('petal') && !material.doubleSided))) {
    dispose();
    throw new Error(`GLB R16 không đạt kiểm tra cấu trúc: ${triangles} triangles; Y=${bounds.min.y}…${bounds.max.y}`);
  }
  return {
    root, dispose,
    report: { assetId: manifest.assetId, assetRevision: manifest.revision, baselineCommit: manifest.baselineCommit,
      profile, sha256: hash, bytes, triangles, meshes, bounds: [bounds.min.toArray(), bounds.max.toArray()],
      axesValid, materials, gltfTextures: model.parser.json.textures?.length ?? 0 },
  };
}
