import { Box3, DoubleSide, Material, Mesh, MeshStandardMaterial } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import manifest from './sakura-r16.json';

export type Profile = keyof typeof manifest.profiles;

export async function loadSakura(profile: Profile, signal: AbortSignal) {
  const expected = manifest.profiles[profile];
  const response = await fetch(`${import.meta.env.BASE_URL}r16/${expected.file}`, { signal });
  if (!response.ok) throw new Error(`Thiếu GLB R16 (${response.status}). Chạy npm run assets.`);
  const data = await response.arrayBuffer();
  if (data.byteLength !== expected.bytes) throw new Error('Sai kích thước GLB R16. Chạy npm run assets.');
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), byte =>
    byte.toString(16).padStart(2, '0')).join('');
  if (hash !== expected.sha256) throw new Error(`Sai SHA-256 R16: ${hash}`);
  const model = await new GLTFLoader().parseAsync(data, '');
  const root = model.scene;
  const bounds = new Box3().setFromObject(root);
  const byIndex = new Map<number, Material>();
  const runtimeMaterials = new Set<Material>();
  let triangles = 0;
  let meshes = 0;
  const geometries = new Set<Mesh['geometry']>();
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    meshes++;
    geometries.add(object.geometry);
    triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
    object.castShadow = object.receiveShadow = true;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      runtimeMaterials.add(material);
      const index = model.parser.associations.get(material)?.materials;
      if (index !== undefined) byIndex.set(index, material);
    }
  });
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
  const dispose = () => {
    for (const geometry of geometries) geometry.dispose();
    for (const material of runtimeMaterials) material.dispose();
  };
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
      profile, sha256: hash, bytes: data.byteLength, triangles, meshes, bounds: [bounds.min.toArray(), bounds.max.toArray()],
      axesValid, materials, gltfTextures: model.parser.json.textures?.length ?? 0 },
  };
}
