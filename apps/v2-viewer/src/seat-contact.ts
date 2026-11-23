import { Mesh, Raycaster, Vector3, type Object3D } from 'three';

// Inspection only. Compare the actual lower actor vertices with the up-facing imported pad surface.
export function measureSeatContact(actor: Object3D, pad: Object3D, seatRoot: Object3D) {
  actor.updateWorldMatrix(true, true);
  pad.updateWorldMatrix(true, true);
  const seatY = seatRoot.getWorldPosition(new Vector3()).y;
  const point = new Vector3();
  const ray = new Raycaster(new Vector3(), new Vector3(0, -1, 0), 0, 1);
  const gaps: number[] = [];
  const bodyMeshes = new Set<Mesh>();
  const padMeshes: Mesh[] = [];
  actor.traverse(node => { if (node instanceof Mesh) bodyMeshes.add(node); });
  pad.traverse(node => {
    if (node instanceof Mesh && node.name === 'leaf_satin_green_SeatRoot_object') padMeshes.push(node);
  });
  if (padMeshes.length !== 1) throw new Error('P02 upper leaf surface missing');
  let sampled = 0;
  for (const node of bodyMeshes) {
    const position = node.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i).applyMatrix4(node.matrixWorld);
      if (point.y > seatY + .075) continue;
      sampled++;
      ray.ray.origin.set(point.x, seatY + .4, point.z);
      const hit = ray.intersectObjects(padMeshes, false)[0];
      if (hit) gaps.push(point.y - hit.point.y);
    }
  }
  return { surface: padMeshes[0].name, sampled, matched: gaps.length, minGap: gaps.length ? Math.min(...gaps) : null,
    maxGap: gaps.length ? Math.max(...gaps) : null, penetrationsOver5mm: gaps.filter(gap => gap < -.005).length };
}
