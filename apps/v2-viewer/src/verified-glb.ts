import { Mesh, Texture, type Material, type Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function importVerifiedGlb(
  directory: string, expected: { file: string; bytes: number; sha256: string }, signal: AbortSignal,
  staging = 'assets:p08',
) {
  const response = await fetch(`${import.meta.env.BASE_URL}${directory}/${expected.file}`, { signal });
  if (!response.ok) throw new Error(`Thiếu GLB ${expected.file} (${response.status}). Chạy npm run ${staging}.`);
  const data = await response.arrayBuffer();
  if (data.byteLength !== expected.bytes) throw new Error(`Sai kích thước GLB ${expected.file}.`);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), byte =>
    byte.toString(16).padStart(2, '0')).join('');
  if (hash !== expected.sha256) throw new Error(`Sai SHA-256 ${expected.file}: ${hash}`);
  signal.throwIfAborted();
  const gltf = await new GLTFLoader().parseAsync(data, '');
  return { gltf, hash, bytes: data.byteLength };
}

export function inspectMeshes(root: Object3D) {
  const geometries = new Set<Mesh['geometry']>();
  const materials = new Set<Material>();
  let meshes = 0;
  let triangles = 0;
  root.traverse(node => {
    if (!(node instanceof Mesh)) return;
    meshes++;
    geometries.add(node.geometry);
    triangles += (node.geometry.index?.count ?? node.geometry.attributes.position.count) / 3;
    node.castShadow = node.receiveShadow = true;
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material);
  });
  return {
    meshes, triangles, materials,
    dispose() {
      const textures = new Set<Texture>();
      for (const material of materials) {
        for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
        material.dispose();
      }
      for (const texture of textures) texture.dispose();
      for (const geometry of geometries) geometry.dispose();
    },
  };
}
