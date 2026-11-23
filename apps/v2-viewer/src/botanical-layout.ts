import type { Profile } from './asset.ts';
import type { communitySlots } from './community-layout.ts';

export type BotanicalKind = 'bloom' | 'bud';
type Candidate = readonly [BotanicalKind, number, number];
const candidates: readonly Candidate[] = [
  ['bloom', 1, 17], ['bloom', -3.55, 14.9], ['bloom', 8.5, 9.4],
  ['bud', 2.9, 17.75], ['bud', -2.2, 15.65], ['bud', 8, 10.7],
  ['bud', -3.46, 10.45], ['bud', 6.6, 20.4],
  ['bloom', 5, 16.3], ['bloom', -7.8, 6.8],
  ['bud', 6.3, 16.7], ['bud', -7.7, 8], ['bud', -1.9, 19.9],
];
// Conservative radial bounds from the widest min/max box of each audited LOD.
export const botanicalRadius = { bloom: .54, bud: .21 };
export const botanicalMargin = .22;
export const botanicalTreeRadius = 7;

export function botanicalsEnabled(crowd: boolean, option: string | null) {
  return crowd && option !== 'off';
}

export function botanicalLayout(profile: Profile, seed: number, tree: readonly number[],
  slots: ReturnType<typeof communitySlots>, padRadius: number) {
  let state = (seed ^ 0xa5c13ed9) >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const totals = { bloom: 0, bud: 0 };
  const plants: { id: string; kind: BotanicalKind; position: [number, number, number]; yaw: number }[] = [];
  for (const [kind, x, z] of candidates.slice(0, profile === 'eco' ? 8 : candidates.length)) {
    const id = `${kind === 'bloom' ? 'flower' : 'bud'}-${++totals[kind]}`;
    const point: [number, number, number] = [tree[0] + x + (random() - .5) * .22, 0, tree[2] + z + (random() - .5) * .22];
    const yaw = random() * Math.PI * 2;
    const radius = botanicalRadius[kind];
    const distance = (other: readonly number[]) => Math.hypot(point[0] - other[0], point[2] - other[2]);
    if (distance(tree) < radius + botanicalTreeRadius + botanicalMargin ||
      slots.some(slot => distance(slot.position) < radius + padRadius + botanicalMargin) ||
      plants.some(plant => distance(plant.position) < radius + botanicalRadius[plant.kind] + botanicalMargin)) continue;
    plants.push({ id, kind, position: point, yaw });
  }
  return plants;
}
