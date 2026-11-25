import { Box3, Frustum, Group, InstancedMesh, Matrix4, Mesh, Sphere, Vector3, type Object3D, type PerspectiveCamera } from 'three';
import type { LotusInstance, LotusKind } from './lotus-density.ts';

type Instance = Pick<LotusInstance, 'kind' | 'position' | 'yaw' | 'scale' | 'radius'>;
type Source = { mesh: Mesh; local: Matrix4 };
type Batch = { mesh: InstancedMesh; transforms: Matrix4[] };

export function createLotusBatches() {
  const group = new Group();
  group.name = 'Lush static lotus clusters';
  const pools: { kind: LotusKind; bounds: Sphere[]; indices: number[]; batches: Batch[] }[] = [];
  const frustum = new Frustum();
  const projection = new Matrix4();
  const position = new Vector3();

  function add(kind: LotusKind, instances: readonly Instance[], sources: Source[], height: number) {
    if (!instances.length) return;
    const bounds = instances.map(({ position: [x,y,z], radius, scale }) =>
      new Sphere(new Vector3(x, y + height * scale / 2, z), Math.hypot(radius, height * scale / 2)));
    const matrices = instances.map(item =>
      new Matrix4().makeRotationY(item.yaw).scale(position.setScalar(item.scale)).setPosition(position.fromArray(item.position)));
    const batches = sources.map(({ mesh, local }) => {
      const batch = new InstancedMesh(mesh.geometry, mesh.material, instances.length);
      batch.name = kind + ' · ' + mesh.name;
      batch.frustumCulled = false;
      batch.receiveShadow = true;
      group.add(batch);
      return { mesh: batch, transforms: matrices.map(matrix => new Matrix4().multiplyMatrices(matrix, local)) };
    });
    pools.push({ kind, bounds, indices: [], batches });
  }

  return {
    group, add,
    addPad(root: Object3D, items: LotusInstance[]) {
      root.updateWorldMatrix(true, true);
      const inverse = root.matrixWorld.clone().invert();
      const bounds = new Box3().setFromObject(root, true);
      const y = root.getWorldPosition(position).y;
      const height = Math.max(bounds.max.y - y, y - bounds.min.y) * 2;
      const sources: Source[] = [];
      root.traverse(mesh => {
        if (mesh instanceof Mesh) sources.push({ mesh, local: new Matrix4().multiplyMatrices(inverse, mesh.matrixWorld) });
      });
      for (const kind of ['pad', 'leaf'] as const) add(kind, items.filter(item => item.kind === kind), sources, height);
    },
    get batchCount() { return pools.reduce((count, pool) => count + pool.batches.length, 0); },
    update(camera: PerspectiveCamera) {
      frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      const counts = { pad: 0, leaf: 0, bloom: 0, bud: 0 };
      for (const pool of pools) {
        const visible: number[] = [];
        for (let i = 0; i < pool.bounds.length; i++) if (frustum.intersectsSphere(pool.bounds[i])) visible.push(i);
        counts[pool.kind] += visible.length;
        if (visible.length === pool.indices.length && visible.every((id, i) => pool.indices[i] === id) &&
            pool.batches.every(batch => batch.mesh.count === visible.length)) continue;
        for (const { mesh, transforms } of pool.batches) {
          for (let i = 0; i < visible.length; i++) mesh.setMatrixAt(i, transforms[visible[i]]);
          mesh.count = visible.length;
          mesh.visible = visible.length > 0;
          mesh.instanceMatrix.needsUpdate = visible.length > 0;
        }
        pool.indices = visible;
      }
      return counts;
    },
    dispose() {
      group.removeFromParent();
      for (const pool of pools) for (const { mesh } of pool.batches) mesh.dispose();
      group.clear();
      pools.length = 0;
    },
  };
}
