export const fxProfiles = {
  eco: {
    ambient: { motes: 48, petals: 36, leaves: 7 },
    giftSparks: 18,
    blessing: { halos: 3, sparks: 12, intensity: 0.88 },
    water: { waveAmplitude: 0.042, waveSpeed: 0.65, waveScale: 1.05, reflection: 0.46, fineDetail: false },
  },
  quality: {
    ambient: { motes: 94, petals: 74, leaves: 15 },
    giftSparks: 30,
    blessing: { halos: 5, sparks: 20, intensity: 1 },
    water: { waveAmplitude: 0.050, waveSpeed: 0.65, waveScale: 1.05, reflection: 0.52, fineDetail: true },
  },
} as const;

export const giftTiming = { observedMs: 950, observedSparks: 4, confirmedMs: 1650, exitFadeMs: 260, rippleRadius: 2.25 };
export type FxProfile = typeof fxProfiles[keyof typeof fxProfiles];
