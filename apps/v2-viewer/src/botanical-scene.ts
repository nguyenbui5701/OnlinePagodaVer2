import { Box3, Frustum, Group, InstancedMesh, Matrix4, Mesh, Sphere, Vector3,
  type PerspectiveCamera, Texture } from 'three';
import manifest from './p012b-botanicals.json' with { type: 'json' };
import type { Profile } from './asset.ts';
import { botanicalRadius, type BotanicalKind, type botanicalLayout } from './botanical-layout.ts';
import { importVerifiedGlb, inspectMeshes } from './verified-glb.ts';

import type { createLotusBatches } from './lotus-batches.ts';
import type { LotusInstance } from './lotus-density.ts';

type Plant = ReturnType<typeof botanicalLayout>[number];
const kinds = ['bloom', 'bud'] as const;
const epsilon = 1e-5;

async function loadBotanical(profile: Profile, kind: BotanicalKind, signal: AbortSignal) {
  const spec = manifest.profiles[profile][kind];
  const { gltf, hash, bytes } = await importVerifiedGlb('p012b', spec, signal, 'assets:p012b');
  const structure = inspectMeshes(gltf.scene);
  try {
    signal.throwIfAborted();
    const json = gltf.parser.json;
    const box = new Box3().setFromObject(gltf.scene, true);
    const bounds = [box.min.toArray(), box.max.toArray()];
    const textures = new Set([...structure.materials].flatMap(material =>
      Object.values(material).filter(value => value instanceof Texture)));
    const primitives: Mesh[] = [];
    gltf.scene.traverse(node => { if (node instanceof Mesh) primitives.push(node); });
    gltf.scene.updateMatrixWorld(true);
    if (json.meshes?.length !== spec.meshCount || structure.meshes !== spec.primitiveCount ||
      structure.triangles !== spec.triangles || structure.materials.size !== spec.materials ||
      json.materials?.length !== spec.materials || textures.size !== spec.textureCount ||
      json.images?.length || json.textures?.length || gltf.cameras.length ||
      json.extensions?.KHR_lights_punctual?.lights.length || gltf.animations.length ||
      primitives.some(mesh => mesh.type !== 'Mesh') ||
      !bounds.every((point, i) => point.every((value, axis) => Math.abs(value - spec.bounds[i][axis]) < epsilon))) {
      throw new Error(`Cấu trúc hoặc kích thước GLB không khớp manifest: ${spec.file}`);
    }
    return { kind, primitives, dispose: structure.dispose, report: {
      file: spec.file, sha256: hash, bytes, triangles: structure.triangles, bounds, meshes: json.meshes.length,
      primitives: structure.meshes, materials: structure.materials.size, textures: textures.size,
    } };
  } catch (error) {
    structure.dispose();
    throw error;
  }
}

export async function createBotanicalScene(profile: Profile, plants: (Plant | LotusInstance)[], signal: AbortSignal, lush?: ReturnType<typeof createLotusBatches>) {
  const results = await Promise.allSettled(kinds.map(kind => loadBotanical(profile, kind, signal)));
  const sources = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
  const group = new Group();
  group.name = 'P0.12-C lotus botanicals';
  const batches: InstancedMesh[] = [];
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    group.removeFromParent();
    for (const batch of batches) batch.dispose();
    for (const source of sources) source.dispose();
  };
  try {
    for (const result of results) if (result.status === 'rejected') throw result.reason;
    signal.throwIfAborted();
    const translation = new Vector3();
    const matrix = new Matrix4();
    for (const source of sources) {
      const instances = plants.filter(plant => plant.kind === source.kind);
      if (!instances.length) continue;
      if (lush) {
        const spec = manifest.profiles[profile][source.kind];
        lush.add(source.kind, instances as LotusInstance[],
          source.primitives.map(mesh => ({ mesh, local: mesh.matrixWorld,
            tintPetals: !Array.isArray(mesh.material) && mesh.material.name === 'P012B_Petals_Ivory_Blush' })), spec.bounds[1][1]);
        continue;
      }
      for (const primitive of source.primitives) {
        const batch = new InstancedMesh(primitive.geometry, primitive.material, instances.length);
        batches.push(batch);
        batch.name = `${source.kind} · ${primitive.name}`;
        batch.receiveShadow = true;
        for (const [index, plant] of instances.entries()) {
          matrix.makeRotationY(plant.yaw).setPosition(translation.fromArray(plant.position));
          batch.setMatrixAt(index, matrix.multiply(primitive.matrixWorld));
        }
        batch.instanceMatrix.needsUpdate = true;
        batch.computeBoundingSphere();
        group.add(batch);
      }
    }
    const frustum = new Frustum();
    const cameraMatrix = new Matrix4();
    const bounds = plants.map(plant => {
      const height = manifest.profiles[profile][plant.kind as BotanicalKind].bounds[1][1];
      return new Sphere(new Vector3(plant.position[0], height / 2, plant.position[2]),
        Math.hypot(botanicalRadius[plant.kind as BotanicalKind], height / 2));
    });
    return {
      group, dispose, report: { source: manifest.source, profile, plants, assets: sources.map(source => source.report),
        batches: batches.length },
      inFrustum(camera: PerspectiveCamera) {
        frustum.setFromProjectionMatrix(cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
        return plants.filter((_, index) => frustum.intersectsSphere(bounds[index])).map(plant => plant.id);
      },
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
