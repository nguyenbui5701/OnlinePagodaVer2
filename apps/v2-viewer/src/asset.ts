import { Box3, DoubleSide, MeshStandardMaterial, Vector3 } from 'three';
import { GlbLoadError, importVerifiedGlb, inspectMeshes } from './verified-glb.ts';
import { treeFallbackChain, type TreeFallback, type TreeRevision } from './live-settings.ts';
import manifest from './sakura-r16.json' with {type: 'json'};
import r18a from './sakura-r18a.json' with {type: 'json'};
import r17b from './sakura-r17b.json' with {type: 'json'};

export type Profile = keyof typeof manifest.profiles;
export type { TreeRevision } from './live-settings.ts';
export const parseTreeRevision = (value: string | null): TreeRevision =>
  value === 'r18a' ? 'R18A' : value === 'r17b' ? 'R17B' : 'R16';
const sources = { R16: manifest, R17B: r17b, R18A: r18a };

async function loadTree(profile: Profile, signal: AbortSignal, revision: TreeRevision) {
  const start = performance.now();
  const next = revision === 'R16' ? undefined : sources[revision].profiles[profile];
  const legacy = manifest.profiles[profile];
  const sourceManifest = sources[revision];
  const directory = revision.toLowerCase();
  const { gltf: model, hash, bytes } = await importVerifiedGlb(directory, next ?? legacy, signal,
    next ? 'assets:' + directory : 'assets:p08');
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
        if (!node.matrixWorld.elements.every(Number.isFinite)) throw new GlbLoadError('INTEGRITY', revision + ' contains a non-finite transform');
      });
      if (root.getWorldPosition(new Vector3()).length() > .001 ||
          gltfMeshes !== next.gltfMeshes || primitives.length !== next.primitives || meshes !== next.primitives ||
          vertices !== next.vertices || materials.length !== next.materials || json.textures?.length) {
        throw new GlbLoadError('INTEGRITY', revision + ' pivot or pinned primitive, vertex, material or texture count differs');
      }
    }
    const goldPrimitives = primitives.filter((primitive) =>
      json.materials[('material' in primitive ? primitive.material : -1) as number]?.name === r18a.gold.name).length;
    if (revision === 'R18A') {
      const sourceGold = json.materials.find((entry: { name: string }) => entry.name === r18a.gold.name);
      if (goldPrimitives !== r18a.profiles[profile].goldPrimitives ||
          !sourceGold || sourceGold.doubleSided !== r18a.gold.doubleSided ||
          sourceGold.pbrMetallicRoughness?.roughnessFactor !== r18a.gold.pbrMetallicRoughness.roughnessFactor ||
          sourceGold.pbrMetallicRoughness?.metallicFactor !== r18a.gold.pbrMetallicRoughness.metallicFactor ||
          JSON.stringify(sourceGold.pbrMetallicRoughness?.baseColorFactor) !== JSON.stringify(r18a.gold.pbrMetallicRoughness.baseColorFactor) ||
          JSON.stringify(sourceGold.emissiveFactor) !== JSON.stringify(r18a.gold.emissiveFactor) ||
          json.images?.length || model.animations.length || model.cameras.length) {
        throw new GlbLoadError('INTEGRITY', 'R18A gold material, primitive count or scene content differs');
      }
    }
    if (triangles !== (next ?? legacy).triangles || !axesValid || materials.length !== json.materials.length ||
      materials.some(material => !material.matchesSource ||
        ((material.name.includes('petal') || (next && material.name.startsWith('R17b_'))) && !material.doubleSided))) {
      throw new GlbLoadError('INTEGRITY', `GLB ${revision} không đạt kiểm tra cấu trúc: ${triangles} triangles; bounds=${JSON.stringify(measured)}`);
    }
    return {
      root, dispose,
      report: { assetId: sourceManifest.assetId, assetRevision: revision, baselineCommit: sourceManifest.baselineCommit,
        profile, sha256: hash, bytes, triangles, meshes, gltfMeshes, primitives: primitives.length, vertices, bounds: measured,
        axesValid, materials, goldPrimitives, gltfTextures: json.textures?.length ?? 0, loadMs: performance.now() - start },
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

export async function resolveTree<T>(revision: TreeRevision, signal: AbortSignal,
  load: (revision: TreeRevision) => Promise<T & { dispose(): void }>) {
  signal.throwIfAborted();
  const chain = treeFallbackChain(revision);
  const failures: (TreeFallback & { reason: string })[] = [];
  for (const candidate of chain) {
    let asset;
    try {
      asset = await load(candidate);
    } catch (error) {
      signal.throwIfAborted();
      if (error instanceof Error && error.name === 'AbortError') throw error;
      const reason = error instanceof Error ? error.message : String(error);
      failures.push({ revision: candidate, code: error instanceof GlbLoadError ? error.code : 'IMPORT', reason });
      if (candidate === 'R16') {
        if (chain.length === 1) throw error;
        throw new Error(failures.map(f => f.revision + ': ' + f.reason).join(' | '), { cause: error });
      }
      continue;
    }
    if (signal.aborted) {
      asset.dispose();
      signal.throwIfAborted();
    }
    return { asset, failures: failures.map(({ revision, code }) => ({ revision, code })),
      fallbackReason: failures.length === 1 ? failures[0].reason :
      failures.length ? failures.map(f => f.revision + ': ' + f.reason).join(' | ') : undefined };
  }
  throw new Error('Missing tree revision');

}

export async function loadSakura(profile: Profile, signal: AbortSignal, requestedRevision: TreeRevision = 'R16') {
  const start = performance.now();
  const { asset, failures, fallbackReason } = await resolveTree(requestedRevision, signal, revision => loadTree(profile, signal, revision));
  return { ...asset, report: { ...asset.report, requestedRevision, failures, fallbackReason, totalLoadMs: performance.now() - start } };
}
