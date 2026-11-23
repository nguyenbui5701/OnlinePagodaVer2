import { Box3, Frustum, Group, InstancedMesh, Matrix4, Mesh, Sphere, Vector3,
  type Object3D, type PerspectiveCamera } from 'three';

type Figure = { root: Group; breath: Object3D };

// Use the verified GLB's geometry and materials directly. Only instanced matrices are owned here.
export function createCommunityBatches(figures: Figure[]) {
  const group = new Group();
  group.name = 'Anonymous lotus community';
  const bounds: Sphere[] = [];
  const rows = figures.map(figure => {
    figure.root.updateMatrixWorld(true);
    const bound = new Box3().setFromObject(figure.root, true).getBoundingSphere(new Sphere());
    bound.radius += 0.15; // Authored breathing motion.
    bounds.push(bound);
    const meshes: Mesh[] = [];
    figure.root.traverse(node => {
      if (!(node instanceof Mesh)) return;
      if (node.type !== 'Mesh') throw new Error('Community requires the verified rigid P02/P07b1 primitives');
      meshes.push(node);
    });
    return meshes;
  });
  const breathing = new Set<Object3D>();
  figures[0].breath.traverse(node => breathing.add(node));
  const batches = rows[0].map((source, index) => {
    const mesh = new InstancedMesh(source.geometry, source.material, figures.length);
    mesh.receiveShadow = source.receiveShadow;
    mesh.frustumCulled = false; // This batch is compacted to the visible instances below.
    const sources = rows.map(row => row[index]);
    group.add(mesh);
    return { mesh, sources, animated: breathing.has(source) };
  });
  const viewProjection = new Matrix4();
  const frustum = new Frustum();
  const lastBreath = new Vector3();
  let lastMask = -1;
  return {
    group, count: batches.length,
    update(scale: Vector3, camera: PerspectiveCamera) {
      frustum.setFromProjectionMatrix(viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      const visible: number[] = [];
      let mask = 0;
      for (const [i, bound] of bounds.entries()) {
        if (!frustum.intersectsSphere(bound)) continue;
        mask |= 1 << i;
        visible.push(i);
      }
      const moved = !lastBreath.equals(scale) || mask !== lastMask;
      if (moved) {
        lastBreath.copy(scale);
        for (const i of visible) {
          const { breath } = figures[i];
          breath.scale.copy(scale);
          breath.updateMatrixWorld(true);
        }
      }
      for (const { mesh, sources, animated } of batches) {
        if (mask === lastMask && !(animated && moved)) continue;
        mesh.count = visible.length;
        mesh.visible = visible.length > 0;
        for (const [index, slot] of visible.entries()) mesh.setMatrixAt(index, sources[slot].matrixWorld);
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
