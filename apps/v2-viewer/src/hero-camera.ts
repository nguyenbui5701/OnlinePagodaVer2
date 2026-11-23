import { CatmullRomCurve3, Vector3 } from 'three';
import { loopSeconds } from './camera.ts';

const labels = [
  [0, 'HERO_WIDE_TREE_REFLECTION'], [9, 'COMMUNITY'], [16, 'HERO_TOP_RING'],
  [26, 'AERIAL'], [33, 'UNDER_TREE'],
] as const;

/** Two mirrored routes share their opening knot and both neighboring knots at the loop seam. */
export function createHeroRoutes(tree: Vector3, seed: number) {
  const route = (side: 1 | -1) => {
    const curve = (points: number[][]) => new CatmullRomCurve3(points.map(([x, y, z]) =>
      new Vector3(x + tree.x, y + tree.y, z + tree.z)), true, 'catmullrom', .5);
    const position = curve([
      [0, 10, 44], [2, 11, 47], [12 * side, 12, 52], [18 * side, 23, 42],
      [9 * side, 42, 28], [3 * side, 55, 11], [-7 * side, 48, 32], [-17 * side, 35, 34],
      [-14 * side, 15, 37], [-2, 9, 34],
    ]);
    const target = curve([
      [0, 9.5, 0], [0, 9.6, 0], [0, 9, 0], [0, 8, 4],
      [0, 3, 2], [0, 0, 0], [0, 0, 0], [0, 7, 3], [0, 11, 1], [0, 10.5, 0],
    ]);
    const lens = new CatmullRomCurve3([58, 56, 55, 55, 57, 63, 63, 55, 54, 58]
      .map(fov => new Vector3(fov, 0, 0)), true);
    return { position, target, lens };
  };
  const east = route(1);
  const west = route(-1);
  let initial = Math.imul(seed ^ (seed >>> 7), 0x45d9f3b) >>> 29;
  initial &= 1;
  return {
    rejected: [],
    sample(seconds: number) {
      const cycle = Math.floor(seconds / loopSeconds);
      const elapsed = seconds - cycle * loopSeconds;
      const phase = elapsed / loopSeconds;
      const isEast = ((cycle + initial) & 1) === 0;
      const path = isEast ? east : west;
      return {
        position: path.position.getPoint(phase), target: path.target.getPoint(phase), fov: path.lens.getPoint(phase).x,
        seed, cycle, direction: isEast ? 'east-first' : 'west-first', routeId: isEast ? 'hero-east' : 'hero-west',
        shot: labels.findLast(([start]) => elapsed >= start)![1], fallback: undefined,
      };
    },
  };
}
