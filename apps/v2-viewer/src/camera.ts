import { CatmullRomCurve3, Quaternion, Vector3 } from 'three';

export const capture = { width: 720, height: 1280, fov: 50, near: 0.05, far: 500, safeMargin: 0.08 };
export const shots = ['CLOSE', 'COMMUNITY', 'AERIAL', 'UNDER_TREE'] as const;
export const loopSeconds = 40;
export const defaultSeed = 9;
export type CameraPose = { position: Vector3; target: Vector3; fov: number };
const shotStarts = [0, 9, 16, 29];
const vector = (x: number, y: number, z: number) => new Vector3(x, y, z);
const closed = (points: Vector3[]) => new CatmullRomCurve3(points, true, 'catmullrom', 0.5);

export function parseCinematicSeed(value: string | null) {
  if (value === null || !/^\d{1,10}$/.test(value)) return defaultSeed;
  const seed = Number(value);
  return seed <= 0xffffffff ? seed : defaultSeed;
}

function mix(n: number) {
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
  return (n ^ (n >>> 16)) >>> 0;
}

function makeRoute(close: CameraPose, tree: Vector3, sweep: 1 | -1, high: boolean) {
  const p = close.position;
  const t = close.target;
  const atTree = (x: number, y: number, z: number) => vector(tree.x + x * sweep, y, tree.z + z);
  const rise = high ? 6 : 0;
  // Common neighboring knots at t=36, 0 and 4 give every route the same closure and tangent.
  const positions = [
    p.clone(), p.clone().add(vector(1.3, 0.18, 0.08)),
    atTree(8, 5.1, 12), atTree(26, 16, 36), atTree(25, 35 + rise, 35),
    atTree(7, 54 + rise, 27), atTree(-14, 44 + rise, 22), atTree(-24, 25 + rise, 15),
    atTree(-18, 6.7, 7.9), p.clone().add(vector(-2.8, 0.85, -0.35)),
  ];
  const targets = [
    t.clone(), t.clone(), atTree(1.0, 4.6, 13.2), atTree(0, 11.5, 0), atTree(0, 13, 0),
    atTree(0, 12.8, 0), atTree(0, 12.3, 0), atTree(0, 12, 0), atTree(4, 11.5, 0), t.clone(),
  ];
  const position = closed(positions);
  const directions = targets.map((point, i) => point.clone().sub(positions[i]).normalize());
  const rotations = directions.map((direction, i) =>
    new Quaternion().setFromUnitVectors(direction, directions[(i + 1) % directions.length]));
  const distance = closed(targets.map((point, i) => vector(point.distanceTo(positions[i]), 0, 0)));
  const lens = closed([close.fov, close.fov, 57, 61, 54, 51, 51, 51, 54, close.fov]
    .map(fov => vector(fov, 0, 0)));
  return {
    id: `${sweep > 0 ? 'east' : 'west'}-${high ? 'high' : 'low'}`,
    direction: sweep > 0 ? 'east-first' : 'west-first',
    at(phase: number): CameraPose {
      const point = position.getPoint(phase);
      const segment = phase * directions.length;
      const index = Math.floor(segment) % directions.length;
      const fraction = segment - Math.floor(segment);
      const ease = fraction * fraction * (3 - 2 * fraction);
      const aim = directions[index].clone().applyQuaternion(new Quaternion().slerp(rotations[index], ease));
      return { position: point, target: aim.multiplyScalar(distance.getPoint(phase).x).add(point),
        fov: lens.getPoint(phase).x };
    },
  };
}

function routeIssue(route: ReturnType<typeof makeRoute>, tree: Vector3) {
  const samples = loopSeconds * 60;
  let previous: CameraPose | undefined;
  for (let frame = 0; frame <= samples; frame++) {
    const pose = route.at(frame / samples);
    const { x, y, z } = pose.position;
    const radius = Math.hypot(x - tree.x, z - tree.z);
    if (y < 0.8 || (y < 8 && radius < 7) || (y >= 8 && y < 28 && radius < 14) ||
        pose.position.distanceTo(pose.target) < 2.3 || pose.fov < 40 || pose.fov > 64) {
      return { id: route.id, reason: 'clearance, subject distance or lens', seconds: frame / 60,
        position: pose.position.toArray(), subjectDistance: pose.position.distanceTo(pose.target), fov: pose.fov };
    }
    if (previous) {
      const move = previous.position.distanceTo(pose.position);
      const aim = previous.target.clone().sub(previous.position).angleTo(pose.target.clone().sub(pose.position));
      const targetMove = previous.target.distanceTo(pose.target);
      const lensMove = Math.abs(previous.fov - pose.fov);
      if (move < 0.001 || move > 0.22 || aim > 0.025 || targetMove > 0.30 || lensMove > 0.10) {
        return { id: route.id, reason: 'motion', seconds: frame / 60, move, aim, targetMove, lensMove };
      }
    }
    previous = pose;
  }
}

export function createCinematicRoutes(close: CameraPose, tree: Vector3, seed = defaultSeed) {
  const routes = [makeRoute(close, tree, 1, false), makeRoute(close, tree, 1, true),
    makeRoute(close, tree, -1, false), makeRoute(close, tree, -1, true)];
  const rejected = routes.flatMap(route => routeIssue(route, tree) ?? []);
  const safeRoutes = routes.filter(route => !rejected.some(issue => issue.id === route.id));
  if (!safeRoutes.length) throw new Error(`Không có tuyến camera cinematic an toàn: ${JSON.stringify(rejected)}`);
  const firstDirection = mix(seed) & 1;
  let selection: { cycle: number; requested: typeof routes[number]; route: typeof routes[number] } | undefined;
  return {
    rejected,
    sample(seconds: number) {
      const cycle = Math.floor(seconds / loopSeconds);
      const phase = (seconds - cycle * loopSeconds) / loopSeconds;
      if (selection?.cycle !== cycle) {
        const direction = firstDirection ^ (cycle & 1);
        const altitude = mix(seed ^ Math.imul(cycle + 1, 0x9e3779b9)) & 1;
        const requested = routes[direction * 2 + altitude];
        const route = safeRoutes.includes(requested) ? requested
          : safeRoutes.find(candidate => candidate.direction === requested.direction) ?? safeRoutes[0];
        selection = { cycle, requested, route };
      }
      const { requested, route } = selection;
      return {
        ...route.at(phase), cycle, seed, routeId: route.id, direction: route.direction,
        shot: shots[shotStarts.findLastIndex(start => phase * loopSeconds >= start)],
        fallback: route === requested ? undefined : requested.id,
      };
    },
  };
}
