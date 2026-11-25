import { Box3, Frustum, Group, InstancedMesh, Matrix4, Mesh, Sphere, Vector3,
  type Object3D, type PerspectiveCamera } from 'three';

type Figure = { root: Group; breath: Object3D };

// Use the verified GLB's geometry and materials directly. Only instanced matrices are owned here.
export function createCommunityBatches(figures: Figure[]) {
  if (figures.length > 32) throw new RangeError('Animated community visibility mask supports up to 32 figures');
  const group = new Group();
  group.name = 'Anonymous lotus community';
  const bounds: Sphere[] = [];
  const groups = new Map<string, { animated: boolean; sources: { slot: number; node: Mesh }[] }>();
  for (const [slot, figure] of figures.entries()) {
    figure.root.updateMatrixWorld(true);
    const bound = new Box3().setFromObject(figure.root, true).getBoundingSphere(new Sphere());
    bound.radius += 0.15; // Authored breathing motion.
    bounds.push(bound);
    const breathing = new Set<Object3D>();
    figure.breath.traverse(node => breathing.add(node));
    figure.root.traverse(node => {
      if (!(node instanceof Mesh)) return;
      if (node.type !== 'Mesh') throw new Error('Community requires the verified rigid P02/P07b1 primitives');
      const animated = breathing.has(node);
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      const key = [node.geometry.uuid, ...materials.map(material => material.uuid), animated, node.receiveShadow].join('/');
      const batch = groups.get(key) ?? { animated, sources: [] };
      batch.sources.push({ slot, node });
      groups.set(key, batch);
    });
  }
  const batches = [...groups.values()].map(({ animated, sources }) => {
    const source = sources[0].node;
    const mesh = new InstancedMesh(source.geometry, source.material, sources.length);
    mesh.receiveShadow = source.receiveShadow;
    mesh.frustumCulled = false; // This batch is compacted to the visible instances below.
    group.add(mesh);
    return { mesh, sources, animated };
  });
  const viewProjection = new Matrix4();
  const frustum = new Frustum();
  const lastBreath = new Vector3();
  const lastPosition = new Vector3();
  let lastMask: number | undefined;
  return {
    group, count: batches.length,
    update(scale: Vector3, camera: PerspectiveCamera, position?: Vector3) {
      frustum.setFromProjectionMatrix(viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      const visible: number[] = [];
      let mask = 0;
      for (const [i, bound] of bounds.entries()) {
        if (!frustum.intersectsSphere(bound)) continue;
        mask |= 1 << i;
        visible.push(i);
      }
      const moved = !lastBreath.equals(scale) || (position && !lastPosition.equals(position)) || mask !== lastMask;
      if (moved) {
        lastBreath.copy(scale);
        if (position) lastPosition.copy(position);
        for (const i of visible) {
          const { breath } = figures[i];
          breath.scale.copy(scale);
          if (position) breath.position.copy(position);
          breath.updateMatrixWorld(true);
        }
      }
      for (const { mesh, sources, animated } of batches) {
        if (mask === lastMask && !(animated && moved)) continue;
        let count = 0;
        for (const { slot, node } of sources) {
          if (mask & (1 << slot)) mesh.setMatrixAt(count++, node.matrixWorld);
        }
        mesh.count = count;
        mesh.visible = count > 0;
        mesh.instanceMatrix.needsUpdate = true;
      }
      lastMask = mask;
      return visible.length;
    },
    dispose() {
      group.removeFromParent();
      for (const { mesh } of batches) mesh.dispose();
    },
  };
}
