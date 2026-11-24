import { Box3, DoubleSide, MeshStandardMaterial, Vector3 } from 'three';
import { importVerifiedGlb, inspectMeshes } from './verified-glb.ts';
import manifest from './sakura-r16.json' with {type: 'json'};
import r17b from './sakura-r17b.json' with {type: 'json'};

export type Profile = keyof typeof manifest.profiles;
export type TreeRevision = 'R16' | 'R17B';
export const parseTreeRevision = (value: string | null): TreeRevision => value === 'r17b' ? 'R17B' : 'R16';

async function loadTree(profile: Profile, signal: AbortSignal, revision: TreeRevision) {
  const start = performance.now();
  const next = revision === 'R17B' ? r17b.profiles[profile] : undefined;
  const legacy = manifest.profiles[profile];
  const sourceManifest = next ? r17b : manifest;
  const { gltf: model, hash, bytes } = await importVerifiedGlb(next ? 'r17b' : 'r16', next ?? legacy, signal,
    next ? 'assets:r17b' : 'assets:p08');
  const root = model.scene;
  const { triangles, meshes, materials: runtimeMaterials, dispose } = inspectMeshes(root);
  try {
    signal.throwIfAborted();
    const bounds = new Box3().setFromObject(root, !!next);
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
    const measured = [bounds.min.toArray(), bounds.max.toArray()];
    const axesValid = next ? measured.every((point, i) => point.every((v, j) => Math.abs(v - next.bounds[i][j]) < .001))
      : Math.abs(bounds.min.y - legacy.yBounds[0]) < .001 && Math.abs(bounds.max.y - legacy.yBounds[1]) < .001;
    const json = model.parser.json;
    const gltfMeshes = json.meshes.length as number;
    const primitives = (json.meshes as { primitives: { attributes: { POSITION: number } }[] }[]).flatMap(mesh => mesh.primitives);
    const vertices = primitives.reduce((sum, primitive) => sum + Number(json.accessors[primitive.attributes.POSITION].count), 0);
    if (next) {
      root.traverse(node => {
        if (!node.matrixWorld.elements.every(Number.isFinite)) throw new Error('R17B contains a non-finite transform');
      });
      if (root.getWorldPosition(new Vector3()).length() > .001 ||
          gltfMeshes !== next.gltfMeshes || primitives.length !== next.primitives || meshes !== next.primitives ||
          vertices !== next.vertices || materials.length !== next.materials || json.textures?.length) {
        throw new Error('R17B pivot or pinned primitive, vertex, material or texture count differs');
      }
    }
    if (triangles !== (next ?? legacy).triangles || !axesValid || materials.length !== json.materials.length ||
      materials.some(material => !material.matchesSource ||
        ((material.name.includes('petal') || (next && material.name.startsWith('R17b_'))) && !material.doubleSided))) {
      throw new Error(`GLB ${revision} không đạt kiểm tra cấu trúc: ${triangles} triangles; bounds=${JSON.stringify(measured)}`);
    }
    return {
      root, dispose,
      report: { assetId: sourceManifest.assetId, assetRevision: revision, baselineCommit: sourceManifest.baselineCommit,
        profile, sha256: hash, bytes, triangles, meshes, gltfMeshes, primitives: primitives.length, vertices, bounds: measured,
        axesValid, materials, gltfTextures: json.textures?.length ?? 0, loadMs: performance.now() - start },
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

export async function resolveTree<T>(revision: TreeRevision, signal: AbortSignal,
  load: (revision: TreeRevision) => Promise<T & { dispose(): void }>) {
  signal.throwIfAborted();
  let asset;
  let fallbackReason: string | undefined;
  try {
    asset = await load(revision);
  } catch (error) {
    signal.throwIfAborted();
    if (revision === 'R16' || (error instanceof Error && error.name === 'AbortError')) throw error;
    fallbackReason = error instanceof Error ? error.message : String(error);
    try { asset = await load('R16'); }
    catch (fallbackError) {
      signal.throwIfAborted();
      if (fallbackError instanceof Error && fallbackError.name === 'AbortError') throw fallbackError;
      const reason = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new Error(`R17B: ${fallbackReason} | R16: ${reason}`, { cause: fallbackError });
    }
  }
  if (signal.aborted) {
    asset.dispose();
    signal.throwIfAborted();
  }
  return { asset, fallbackReason };
}

export async function loadSakura(profile: Profile, signal: AbortSignal, requestedRevision: TreeRevision = 'R16') {
  const start = performance.now();
  const { asset, fallbackReason } = await resolveTree(requestedRevision, signal, revision => loadTree(profile, signal, revision));
  return { ...asset, report: { ...asset.report, requestedRevision, fallbackReason, totalLoadMs: performance.now() - start } };
}
