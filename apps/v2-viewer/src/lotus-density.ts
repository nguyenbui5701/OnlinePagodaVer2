import type { Profile } from './asset.ts';
import { botanicalRadius, botanicalTreeRadius, type BotanicalKind } from './botanical-layout.ts';

export type LotusKind = 'pad' | 'leaf' | BotanicalKind;
export type LotusInstance = {
  id: string; kind: LotusKind; position: [number, number, number]; yaw: number; scale: number; radius: number;
  petalTone?: PetalTone;
};
export type Density = 'legacy' | 'lush';
export const parseDensity = (value: string | null): Density => value === 'lush' ? 'lush' : 'legacy';

export const densityTargets = {
  eco: { pad: 18, leaf: 52, bloom: 23, bud: 16 },
  quality: { pad: 36, leaf: 86, bloom: 39, bud: 28 },
} satisfies Record<Profile, Record<LotusKind, number>>;

const qualityPlusTargets = { pad: 52, leaf: 120, bloom: 56, bud: 40 };
export const petalColors = {
  palePink: [1.04, .82, .89],
  deepPink: [1.06, .43, .66],
  ivoryPink: [1.18, 1.19, 1.22],
  warmPink: [1.18, .94, .61],
} as const;
type PetalTone = keyof typeof petalColors;
const petalTones = Object.keys(petalColors) as PetalTone[];

type Slot = { id: string; position: readonly number[] };
export const giftClearance = 6.25;
export const lotusGap = .22;
const rings = [8.8, 12.8, 17.9, 23.7, 29.5, 33.0];
const distance = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[2] - b[2]);

export function lushLotus(profile: Profile, seed: number, tree: readonly number[], slots: Slot[], padRadius: number,
  lowCameraSamples: readonly (readonly number[])[], flowers: boolean, qualityPlus = false) {
  const plus = profile === 'quality' && qualityPlus;
  const targets = plus ? qualityPlusTargets : densityTargets[profile];
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
    const target = targets[kind];
    for (let attempt = 0, count = 0; attempt < 1800 && count < target; attempt++) {
      const draw = random();
      // Give the first four rings more candidates while retaining the outer water perimeter.
      const index = plus ? (draw < .78 ? Math.floor(draw / .78 * 28)
        : 28 + Math.floor((draw - .78) / .22 * 14)) : Math.floor(draw * clusters.length);
      const cluster = clusters[index];
      const angle = cluster.angle + (random() - .5) * (plus ? .49 : .27);
      const r = cluster.r + (random() - .5) * (plus ? 5.8 : 3.55);
      const position: LotusInstance['position'] = [tree[0] + Math.sin(angle) * r,
        kind === 'pad' ? .065 : kind === 'leaf' ? .024 : 0, tree[2] + Math.cos(angle) * r];
      const scale = kind === 'pad' ? .83 + random() * .23 : kind === 'leaf' ? .28 + random() * .28 : .76 + random() * .35;
      const radius = (kind === 'pad' || kind === 'leaf' ? padRadius : botanicalRadius[kind]) * scale;
      if (r < botanicalTreeRadius + radius + lotusGap ||
        slots.some(slot => distance(position, slot.position) < radius +
          (slot.id.startsWith('seat-') ? Math.max(giftClearance, padRadius) : padRadius + lotusGap)) ||
        lowCameraSamples.some(pos => distance(position, pos) < radius + .8) ||
        placed.some(item => distance(position, item.position) < radius + item.radius + lotusGap)) continue;
      const item: LotusInstance = { id: kind + '-' + ++count, kind, position, yaw: random() * Math.PI * 2, scale, radius };
      if (plus && (kind === 'bloom' || kind === 'bud')) {
        // Separate from the placement RNG so tint never changes scene positions.
        const tint = Math.imul(seed ^ state ^ (state >>> 16), 0x45d9f3b) >>> 0;
        item.petalTone = petalTones[tint >>> 30];
      }
      placed.push(item);
    }
  }
  return placed;
}
