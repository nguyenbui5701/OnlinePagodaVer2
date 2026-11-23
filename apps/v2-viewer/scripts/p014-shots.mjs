export const seeds = [9, 71, 1337];
export const profiles = ['eco', 'quality'];

const pose = (position, target, fov) => ({ position, target, fov });
export const shots = [
  { key: 'HERO_CLOSE', referenceSeconds: 1, time: 3, look: 'dusk', angle: .55,
    description: 'Low three-quarter seated chibi on P02 above dark water, face and hands readable.',
    intent: 'An intact foreground silhouette with the authentic lotus contact.' },
  { key: 'COMMUNITY_LOW', referenceSeconds: 7.5, time: 7.5, look: 'dusk',
    fixed: pose([14, 6, 38], [0, 8, 3], 51),
    description: 'Several depth rows of varied chibi, P02 pads, pale blooms and closed buds in dusk.',
    intent: 'Foreground, middle and distant figures and real botany around dominant Sakura.',
    unavailableArt: ['HILLS_ASSET_DEFERRED'] },
  { key: 'SAKURA_AERIAL', referenceSeconds: 12.5, time: 14.5, look: 'pink',
    fixed: pose([19, 40, 31], [0, 12, 0], 52),
    description: 'Giant pink canopy above small seated figures, ambient points and layered water.',
    intent: 'Aerial scale, pink upper crop and small figures below the tree.' },
  { key: 'GIFT_FOCUS', referenceSeconds: 22.5, time: 18.1, look: 'twilight',
    description: 'Confirmed portrait of the actual giver, warm blessing and readable gift annotation.',
    intent: 'Legitimate P05f An with two roses, seed-stable abstract halos, and Duyên text-only.',
    unavailableArt: ['P013_ROSE_ICON_VISUAL_FIDELITY_DEFERRED'] },
  { key: 'LAKE_REFLECTION', referenceSeconds: 26.5, time: 27, look: 'dusk',
    fixed: pose([10, 2.25, 30], [2, 1.15, 13], 53),
    description: 'Low view of dark blue-violet water and warm peach/gold bands, pads and figures.',
    intent: 'Peach-gold signal within a dark pond, with flowers and depth layers.',
    unavailableArt: ['HILLS_ASSET_DEFERRED'] },
  { key: 'GOLD_UNDER_TREE', referenceSeconds: 34.5, time: 39, look: 'gold',
    fixed: pose([6, 2.8, 17], [0, 7, 0], 55),
    description: 'Dark Sakura bark with prominent gold fissures and seated figures beneath it.',
    intent: 'Visible gold-vein contrast and readable figures below a tall trunk.' },
  { key: 'RETURN_TREE', referenceSeconds: 44.5, time: 39.75, look: 'twilight',
    description: 'Continuous return toward the tree with pink canopy, trunk and lake context.',
    intent: 'Native subsequent tree composition after the verified camera return.' },
];

export const performanceShots = ['COMMUNITY_LOW', 'SAKURA_AERIAL', 'GIFT_FOCUS', 'LAKE_REFLECTION', 'GOLD_UNDER_TREE'];
export const underTreeReview = pose([8, 3.4, 24], [0, 6.2, 1.8], 55);

export function combinations() {
  return profiles.flatMap(profile => seeds.flatMap(seed => shots.map(shot => ({ ...shot, profile, seed }))));
}
