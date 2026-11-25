import type { Profile } from './asset.ts';
import { botanicalRadius, botanicalTreeRadius, type BotanicalKind } from './botanical-layout.ts';

export type LotusKind = 'pad' | 'leaf' | BotanicalKind;
export type LotusInstance = {
  id: string; kind: LotusKind; position: [number, number, number]; yaw: number; scale: number; radius: number;
};
export type Density = 'legacy' | 'lush';
export const parseDensity = (value: string | null): Density => value === 'lush' ? 'lush' : 'legacy';

export const densityTargets = {
  eco: { pad: 18, leaf: 52, bloom: 23, bud: 16 },
  quality: { pad: 36, leaf: 86, bloom: 39, bud: 28 },
} satisfies Record<Profile, Record<LotusKind, number>>;

type Slot = { id: string; position: readonly number[] };
export const giftClearance = 6.25;
export const lotusGap = .22;
const rings = [8.8, 12.8, 17.9, 23.7, 29.5, 33.0];
const distance = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[2] - b[2]);

export function lushLotus(profile: Profile, seed: number, tree: readonly number[], slots: Slot[], padRadius: number,
  lowCameraSamples: readonly (readonly number[])[], flowers: boolean) {
  let state = (seed ^ 0x37cd271a) >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const clusters = rings.map((r, ring) => Array.from({ length: 7 }, (_, i) => ({
    r: r + (random() - .5) * 1.7, angle: (i + (ring % 2) * .45) * Math.PI * 2 / 7 + (random() - .5) * .48,
  }))).flat();
  const placed: LotusInstance[] = [];
  for (const kind of ['pad', 'bloom', 'bud', 'leaf'] as const) {
    if (!flowers && (kind === 'bloom' || kind === 'bud')) continue;
    const target = densityTargets[profile][kind];
    for (let attempt = 0, count = 0; attempt < 1800 && count < target; attempt++) {
      const cluster = clusters[Math.floor(random() * clusters.length)];
      const angle = cluster.angle + (random() - .5) * .27;
      const r = cluster.r + (random() - .5) * 3.55;
      const position: LotusInstance['position'] = [tree[0] + Math.sin(angle) * r,
        kind === 'pad' ? .065 : kind === 'leaf' ? .024 : 0, tree[2] + Math.cos(angle) * r];
      const scale = kind === 'pad' ? .83 + random() * .23 : kind === 'leaf' ? .28 + random() * .28 : .76 + random() * .35;
      const radius = (kind === 'pad' || kind === 'leaf' ? padRadius : botanicalRadius[kind]) * scale;
      if (r < botanicalTreeRadius + radius + lotusGap ||
        slots.some(slot => distance(position, slot.position) < radius +
          (slot.id.startsWith('seat-') ? Math.max(giftClearance, padRadius) : padRadius + lotusGap)) ||
        lowCameraSamples.some(pos => distance(position, pos) < radius + .8) ||
        placed.some(item => distance(position, item.position) < radius + item.radius + lotusGap)) continue;
      placed.push({ id: kind + '-' + ++count, kind, position, yaw: random() * Math.PI * 2, scale, radius });
    }
  }
  return placed;
}
