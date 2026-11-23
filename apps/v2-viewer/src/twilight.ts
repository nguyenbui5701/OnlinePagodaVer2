import { loopSeconds } from './camera.ts';

type RGB = readonly [number, number, number];
type Look = {
  sky: number; horizon: number; fog: number; deepWater: number; fogDensity: number; exposure: number;
  ambient: RGB; ambientPower: number; lights: readonly (readonly [power: number, tint: RGB])[];
  rose: number; gold: number; streaks: number; veinEmissive: number;
};

export const looks = {
  DUSK_COMMUNITY: {
    sky: 0x161831, horizon: 0x493a60, fog: 0x443a62, deepWater: 0x13182e, fogDensity: 0.012,
    exposure: 0.94, ambient: [0.64, 0.59, 0.79], ambientPower: 0.44,
    lights: [[1.22,[1,0.76,0.73]], [1.35,[1,0.33,0.51]], [0.36,[0.73,0.78,1]]],
    rose: 0.96, gold: 1.08, streaks: 0.96, veinEmissive: 1.12,
  },
  PINK_AERIAL_BLESSING: {
    sky: 0x21203d, horizon: 0x604467, fog: 0x534264, deepWater: 0x1b1b35, fogDensity: 0.010,
    exposure: 0.97, ambient: [0.71, 0.57, 0.76], ambientPower: 0.46,
    lights: [[1.22,[1,0.52,0.62]], [1.74,[1,0.23,0.49]], [0.36,[0.72,0.76,1]]],
    rose: 1.26, gold: 0.86, streaks: 0.78, veinEmissive: 1.16,
  },
  GOLDEN_UNDER_TREE: {
    sky: 0x19172d, horizon: 0x533952, fog: 0x4a3652, deepWater: 0x15142c, fogDensity: 0.013,
    exposure: 0.93, ambient: [0.64, 0.53, 0.67], ambientPower: 0.37,
    lights: [[1.01,[1,0.74,0.68]], [1.61,[1,0.49,0.23]], [0.42,[0.79,0.76,1]]],
    rose: 0.92, gold: 1.45, streaks: 1.13, veinEmissive: 1.42,
  },
} as const satisfies Record<string, Look>;

export const lookOrder = ['DUSK_COMMUNITY', 'PINK_AERIAL_BLESSING', 'GOLDEN_UNDER_TREE'] as const;
type Weights = [number, number, number];

export function parseLook(query: string | null, comparison = false) {
  if (comparison || query === 'legacy') return 'legacy';
  if (query === 'dusk' || query === 'pink' || query === 'gold') return query;
  return 'twilight';
}
export type LookMode = ReturnType<typeof parseLook>;

function ease(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

export function sampleLookWeights(seconds: number, weights: Weights = [0,0,0]) {
  const phase = ((seconds % loopSeconds) + loopSeconds) % loopSeconds;
  // CLOSE and COMMUNITY share dusk. Overlap the other shot boundaries on the existing route clock.
  const pink = ease((phase - 14.4) / 3.2);
  const gold = ease((phase - 27.4) / 3.2);
  const dusk = ease((phase - 37) / 3);
  weights[0] = 1 - pink + dusk;
  weights[1] = pink - gold;
  weights[2] = gold - dusk;
  return weights;
}

export class LookTimeline {
  private readonly current: Weights = [1,0,0];
  private readonly from: Weights = [1,0,0];
  private readonly next: Weights = [1,0,0];
  private wasGift = false;
  private changedAt = -Infinity;

  update(ms: number, routeSeconds: number, gift: boolean, mode: Exclude<LookMode, 'legacy'> = 'twilight') {
    if (mode !== 'twilight') {
      this.current[0] = Number(mode === 'dusk');
      this.current[1] = Number(mode === 'pink');
      this.current[2] = Number(mode === 'gold');
      return this.current;
    }
    if (gift !== this.wasGift) {
      this.changedAt = ms;
      for (let i = 0; i < 3; i++) this.from[i] = this.current[i];
      this.wasGift = gift;
    }
    if (gift) {
      this.next[0] = 1;
      this.next[1] = this.next[2] = 0;
    } else sampleLookWeights(routeSeconds, this.next);
    const weight = ease((ms - this.changedAt) / (gift ? 1500 : 1450));
    for (let i = 0; i < 3; i++) this.current[i] = this.from[i] + (this.next[i] - this.from[i]) * weight;
    return this.current;
  }
}
