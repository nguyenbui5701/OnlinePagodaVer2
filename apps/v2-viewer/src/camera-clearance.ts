import { Box3, Matrix4, Mesh, InstancedMesh, Ray, Vector3, type Object3D } from 'three';

// The 64° portrait near-plane corners are within .062 of the eye. Leave .10
// additional space around the camera and retain the legacy .8 eye floor.
export const cameraRadius = .17;
export const minimumEyeY = .8;
export type CameraObstacle = { group: string; box: Box3 };
export type CameraCubic = readonly [Vector3, Vector3, Vector3, Vector3];

export function meshCameraBounds(root: Object3D, group: string): CameraObstacle[] {
  root.updateWorldMatrix(true, true);
  const obstacles: CameraObstacle[] = [];
  const matrix = new Matrix4();
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    const bounds = object.geometry.boundingBox;
    if (!bounds || bounds.isEmpty()) return;
    if (object instanceof InstancedMesh) {
      for (let i = 0; i < object.count; i++) {
        object.getMatrixAt(i, matrix);
        obstacles.push({ group, box: bounds.clone().applyMatrix4(matrix.premultiply(object.matrixWorld)) });
      }
    } else {
      obstacles.push({ group, box: bounds.clone().applyMatrix4(object.matrixWorld) });
    }
  });
  return obstacles;
}

export function cubicPoint([a, b, c, d]: CameraCubic, t: number) {
  const u = 1 - t;
  return a.clone().multiplyScalar(u ** 3).addScaledVector(b, 3 * u * u * t)
    .addScaledVector(c, 3 * u * t * t).addScaledVector(d, t ** 3);
}

export function createCameraClearance(obstacles: readonly CameraObstacle[]) {
  const padded = obstacles.map(({ group, box }) => ({ group, box: box.clone().expandByScalar(cameraRadius) }));
  const overview = Object.fromEntries([...new Set(obstacles.map(x => x.group))].map(group =>
    [group, obstacles.filter(x => x.group === group).length]));
  const hull = new Box3();
  const ray = new Ray();
  const hit = new Vector3();
  const mid = (a: Vector3, b: Vector3) => a.clone().lerp(b, .5);

  function curveIssue(points: CameraCubic, depth = 0): string | undefined {
    hull.makeEmpty();
    for (const point of points) hull.expandByPoint(point);
    const group = hull.min.y < minimumEyeY ? 'water-floor'
      : padded.find(entry => hull.intersectsBox(entry.box))?.group;
    if (!group) return;
    // A cubic lies inside its control hull. An unresolved hull is rejected,
    // including tangencies, so there is no gap between sampled camera poses.
    if (depth === 16 || (hull.max.distanceToSquared(hull.min) <= .025 ** 2)) return group;
    const [a, b, c, d] = points;
    const ab = mid(a, b), bc = mid(b, c), cd = mid(c, d);
    const left = mid(ab, bc), right = mid(bc, cd), center = mid(left, right);
    return curveIssue([a, ab, left, center], depth + 1) ?? curveIssue([center, right, cd, d], depth + 1);
  }

  function lineIssue(from: Vector3, to: Vector3) {
    if (Math.min(from.y, to.y) < minimumEyeY) return 'water-floor';
    hull.set(from, from).expandByPoint(to);
    ray.origin.copy(from);
    ray.direction.copy(to).sub(from);
    const length = ray.direction.length();
    ray.direction.normalize();
    return padded.find(({ box }) => hull.intersectsBox(box) && (box.containsPoint(from) ||
      (length > 0 && ray.intersectBox(box, hit) !== null && hit.distanceToSquared(from) <= length ** 2)))?.group;
  }

  return { overview, curveIssue, lineIssue };
}

export type CameraClearance = ReturnType<typeof createCameraClearance>;
