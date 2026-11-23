import type { GiftFxLifecycle } from './gift-fx.ts';
import type { Scenario } from './slice-driver.ts';
import { giftTiming } from './fx-profiles.ts';

type Cue = NonNullable<ReturnType<GiftFxLifecycle['update']>>;
type Binding = Pick<Cue, 'roomSessionId' | 'requestId' | 'actorId' | 'seatId'>;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
function rise(start: number, end: number, time: number) {
  const x = clamp((time - start) / (end - start));
  return x * x * (3 - 2 * x);
}

export function blessingEnabled(option: string | null, scenario: Scenario, fx: boolean) {
  return option === 'on' && fx && scenario !== 'idle';
}

// Rendering envelopes only. The existing lifecycle owns eligibility, expiry and replay protection.
export function planBlessing(cue: Cue | undefined, binding: Binding | undefined, atMs: number) {
  if (!cue || !binding || cue.phase !== 'confirmed' || atMs >= cue.expiresAtMs ||
    cue.roomSessionId !== binding.roomSessionId || cue.requestId !== binding.requestId ||
    cue.actorId !== binding.actorId || cue.seatId !== binding.seatId) return;
  const ageMs = atMs - cue.startedAtMs;
  if (ageMs < 0 || ageMs >= giftTiming.confirmedMs) return;
  const fade = 1 - rise(1350, giftTiming.confirmedMs, ageMs);
  const warm = rise(0, 92, ageMs) * (1 - rise(190, 570, ageMs));
  const halos = rise(180, 350, ageMs) * (1 - 0.60 * rise(860, 1280, ageMs)) * fade;
  const trail = rise(650, 830, ageMs) * fade;
  return {
    ageMs, warm, halos, trail, fade,
    stage: ageMs < 180 ? 'warm' : ageMs < 650 ? 'ascent' : ageMs < 1350 ? 'toward-sakura' : 'fade',
  };
}

export function blessingParticles(seed: number, halos: number, sparks: number) {
  const values = new Float32Array((1 + halos + sparks) * 3);
  let state = (seed ^ 0x2ee4ac91) >>> 0;
  for (let i = 1; i <= halos + sparks; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const orb = i <= halos;
    values.set([orb ? 1 : 2, orb ? i - 1 : (i - halos - 1) / sparks, state / 2 ** 32], i * 3);
  }
  return values;
}
