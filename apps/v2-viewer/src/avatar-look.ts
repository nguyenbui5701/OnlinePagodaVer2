import type { Profile } from './asset.ts';

export const outfits = ['pastel_lilac', 'blush_rose', 'sage_green', 'sky_blue', 'warm_cream', 'terracotta'] as const;
export type Outfit = typeof outfits[number];
export type AvatarModel = 'maleP07b1' | 'femaleP05f';
export type AvatarLook = { model: AvatarModel; variant: Outfit };

export function diversityEnabled(crowd: boolean, option: string | null) {
  return crowd && option === 'on';
}

export function slotLooks(ids: readonly string[], seed: number, profile: Profile) {
  let state = (seed ^ 0x72c392bd) >>> 0;
  function shuffled<T>(values: readonly T[]) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const j = Math.floor(state / 0x100000000 * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  const female = new Set(['seat-1', ...shuffled(ids.slice(2)).slice(0, 5)]);
  const palettes = profile === 'eco' ? ['pastel_lilac', 'sage_green', 'warm_cream'] as const : outfits;
  const colors: Record<AvatarModel, Outfit[]> = { maleP07b1: shuffled(palettes), femaleP05f: shuffled(palettes) };
  const uses = { maleP07b1: 0, femaleP05f: 0 };
  return new Map(ids.map(id => {
    // Pin the first two hero models so the same fixture exercises both source rigs.
    const model: AvatarModel = female.has(id) ? 'femaleP05f' : 'maleP07b1';
    return [id, { model, variant: colors[model][uses[model]++ % palettes.length] }] as const;
  }));
}
