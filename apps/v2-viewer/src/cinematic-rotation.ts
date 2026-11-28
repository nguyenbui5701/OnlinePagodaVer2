import { Vector3 } from 'three';
import { type CameraPose } from './camera.ts';
import { cubicPoint, type CameraClearance, type CameraCubic } from './camera-clearance.ts';

export const rotationSeconds = 68;
export const rotationShots = [
  [0, 'HERO_WIDE'], [12, 'COMMUNITY'], [24, 'LOW_WATER_KOI'], [34, 'AERIAL_RING'],
  [46, 'UNDER_TREE_GOLD'], [56, 'FAR_ATMOSPHERE'],
] as const;

export const rotationLimits = {
  speed: 8, acceleration: 6, aim: .27, targetSpeed: 6, fovSpeed: 3,
  minDistance: 2.3, minFov: 40, maxFov: 64,
} as const;

// Timed controls in tree-local space. The low sweep runs outside the
// innermost seating ring. The return follows the front of the distant terrain.
const controls = [
  [0, [0, 11, 46], [0, 9.6, 0], 55],
  [6, [7, 10, 43], [0, 9, 1], 55],
  [12, [13, 8, 34], [0, 5.7, 9], 54],
  [18, [10, 5, 27], [0, 2.5, 10], 52],
  [24, [5, 2.8, 28], [0, 1.6, 15], 50],
  [28, [0, 2.3, 29], [-1, 1.3, 18], 49],
  [32, [-5, 3, 30], [-2, 1.8, 16], 49],
  [38, [-8, 22, 32], [0, 3, 10], 55],
  [43, [-2, 29, 33], [0, 3.5, 10], 60],
  [48, [8, 13, 26], [0, 9, 1], 56],
  [52, [13, 7.8, 18], [1, 10, 1], 54],
  [56, [22, 12, 29], [0, 10, 0], 57],
  [62, [20, 15, 45], [-2, 9, 0], 59],
] as const;

function timedCurve(values: Vector3[]) {
  const before = (i: number) => (i + values.length - 1) % values.length;
  const after = (i: number) => (i + 1) % values.length;
  const span = (i: number) => (after(i) === 0 ? rotationSeconds : controls[after(i)][0]) - controls[i][0];
  const tangents = values.map((value, i) => {
    // Weight neighboring secants by their durations to keep derivatives in wall-time units.
    const left = span(before(i)), right = span(i);
    return value.clone().sub(values[before(i)]).multiplyScalar(right / left)
      .addScaledVector(values[after(i)].clone().sub(value), left / right).divideScalar(left + right);
  });
  return values.map((point, i): CameraCubic => [
    point, point.clone().addScaledVector(tangents[i], span(i) / 3),
    values[after(i)].clone().addScaledVector(tangents[after(i)], -span(i) / 3), values[after(i)],
  ]);
}

export function createRotationRoute(tree: Vector3, seed: number, side: 1 | -1) {
  const point = ([x, y, z]: readonly number[]) => new Vector3(x * side, y, z).add(tree);
  const eye = timedCurve(controls.map(k => point(k[1])));
  const target = timedCurve(controls.map(k => point(k[2])));
  const lens = timedCurve(controls.map(k => new Vector3(k[3], 0, 0)));
  const routeId = side === 1 ? 'cinematic-east' : 'cinematic-west';
  return {
    duration: rotationSeconds, routeId, eye,
    sample(seconds: number) {
      const cycle = Math.floor(seconds / rotationSeconds);
      const routePhase = seconds - cycle * rotationSeconds;
      const i = controls.findLastIndex(k => routePhase >= k[0]);
      const t = (routePhase - controls[i][0]) / ((controls[i + 1]?.[0] ?? rotationSeconds) - controls[i][0]);
      return { position: cubicPoint(eye[i], t), target: cubicPoint(target[i], t), fov: cubicPoint(lens[i], t).x,
        seed, cycle, routePhase, routeId, direction: side === 1 ? 'east-first' : 'west-first',
        shot: rotationShots.findLast(([start]) => routePhase >= start)![1], fallback: undefined };
    },
  };
}

export function measureRotation(route: ReturnType<typeof createRotationRoute>) {
  const hz = 120;
  const limits = { speed: 0, acceleration: 0, aim: 0, targetSpeed: 0, fovSpeed: 0, minDistance: Infinity, minFov: Infinity, maxFov: -Infinity };
  let previous: CameraPose = route.sample(-2 / hz);
  let priorSpeed: Vector3 | undefined;
  for (let i = -1; i <= route.duration * hz + 1; i++) {
    const pose = route.sample(i / hz);
    const velocity = pose.position.clone().sub(previous.position).multiplyScalar(hz);
    const aim = pose.target.clone().sub(pose.position);
    limits.speed = Math.max(limits.speed, velocity.length());
    if (priorSpeed) limits.acceleration = Math.max(limits.acceleration, velocity.distanceTo(priorSpeed) * hz);
    limits.aim = Math.max(limits.aim, aim.angleTo(previous.target.clone().sub(previous.position)) * hz);
    limits.targetSpeed = Math.max(limits.targetSpeed, pose.target.distanceTo(previous.target) * hz);
    limits.fovSpeed = Math.max(limits.fovSpeed, Math.abs(pose.fov - previous.fov) * hz);
    limits.minDistance = Math.min(limits.minDistance, aim.length());
    limits.minFov = Math.min(limits.minFov, pose.fov);
    limits.maxFov = Math.max(limits.maxFov, pose.fov);
    priorSpeed = velocity;
    previous = pose;
  }
  return limits;
}

export function validateRotation(route: ReturnType<typeof createRotationRoute>, clearance: CameraClearance) {
  const motion = measureRotation(route);
  const motionFailures = (Object.keys(rotationLimits) as (keyof typeof rotationLimits)[]).filter(key =>
    key.startsWith('min') ? motion[key] < rotationLimits[key] : motion[key] > rotationLimits[key]);
  const collisions = route.eye.flatMap((segment, index) => {
    const obstacle = clearance.curveIssue(segment);
    return obstacle ? [{ segment: index, obstacle }] : [];
  });
  return { route: route.routeId, motion, motionFailures, collisions };
}
