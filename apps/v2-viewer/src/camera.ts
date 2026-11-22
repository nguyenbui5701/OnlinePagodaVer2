import { CatmullRomCurve3, Vector3 } from 'three';

export const capture = { width: 720, height: 1280, fov: 50, near: 0.05, far: 500, safeMargin: 0.08 };
export const shots = ['CLOSE', 'COMMUNITY', 'AERIAL', 'UNDER_TREE'] as const;
export const loopSeconds = 40;
const vectors = (coords: number[][]) => coords.map(([x, y, z]) => new Vector3(x, y, z));

const route = new CatmullRomCurve3(vectors([
  [3, 4.2, 18.5], [13, 6, 23], [26, 15, 36], [27, 33, 38],
  [6, 55, 17], [-17, 36, 11], [-19, 10, 9], [-11, 5, 17],
]), true);
const targets = new CatmullRomCurve3(vectors([
  [0, 7, 0], [0, 10, 0], [0, 12, 0], [0, 13, 0],
  [0, 13.5, 0], [0, 13, 0], [0, 11.9, 0], [0, 10.5, 0],
]), true);
route.arcLengthDivisions = 1024;
route.updateArcLengths();
// Mark the shot beats along the normalized, arc-length-sampled path.
const shotBoundaries = [0, 0.17, 0.375, 0.80];
const fovs = [55, 50, 50, 44];

export function sampleCinematic(seconds: number) {
  const phase = ((seconds % loopSeconds) + loopSeconds) % loopSeconds / loopSeconds;
  const t = route.getUtoTmapping(phase, 0);
  const index = shotBoundaries.findLastIndex(boundary => phase >= boundary);
  const end = shotBoundaries[index + 1] ?? 1;
  const fraction = (phase - shotBoundaries[index]) / (end - shotBoundaries[index]);
  const blend = fraction * fraction * (3 - 2 * fraction);
  return {
    shot: shots[index], position: route.getPoint(t), target: targets.getPoint(t),
    fov: fovs[index] + (fovs[(index + 1) % shots.length] - fovs[index]) * blend,
  };
}
