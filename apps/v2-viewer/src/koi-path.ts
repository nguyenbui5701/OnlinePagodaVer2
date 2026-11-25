import type { Profile } from './asset.ts';

export const koiPalettes = ['kohaku', 'sanke', 'yamabuki'] as const;
export type KoiPalette = typeof koiPalettes[number];
// Swept limits include the pinned animated mesh radii, root roll/pitch, and between-key padding.
export const koiEnvelope = { horizontal: .99, top: .34, bottom: .27 };
export const habitat = { root: 7, padBottom: -.26, floor: -1.8, outer: 37 };
const tau = Math.PI * 2;
const lanes = [
  { radius: 9.7,  depth: -.72, period: 72,  direction: 1 },
  { radius: 15.6, depth: -.74, period: 96,  direction: -1 },
  { radius: 23.3, depth: -.76, period: 144, direction: 1 },
  { radius: 29.2, depth: -.71, period: 180, direction: -1 },
  { radius: 34.3, depth: -.79, period: 192, direction: 1 },
] as const;

export type KoiTrack = {
  id: number; palette: KoiPalette; radius: number; depth: number;
  period: number; direction: number; angle: number; phase: number; scale: number;
};
export type KoiPose = { x: number; y: number; z: number; yaw: number; roll: number; pitch: number; clip: number };

export function koiTracks(profile: Profile, seed: number): KoiTrack[] {
  const counts = profile === 'eco' ? [1, 2, 2, 3, 0] : [2, 2, 3, 4, 3];
  const tracks: KoiTrack[] = [];
  let state = (seed ^ 0x72fa08bb) >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  for (const [lane, config] of lanes.entries()) {
    const jitter = random() - .5;
    const offset = lane === 3 ? .745 + jitter * .07 : jitter * .68 - lane * .31;
    for (let i = 0; i < counts[lane]; i++) {
      const id = tracks.length;
      tracks.push({ id, ...config, angle: offset + tau * i / counts[lane],
        palette: koiPalettes[(id + lane) % koiPalettes.length], phase: random() * tau, scale: .92 + random() * .20 });
    }
  }
  return tracks;
}

export function sampleKoi(track: KoiTrack, seconds: number, pose: KoiPose) {
  const cycle = (seconds % track.period) * tau / track.period;
  const angle = track.angle + track.direction * (cycle + .065 * Math.sin(2 * cycle + track.phase));
  const angularSpeed = track.direction * (1 + .13 * Math.cos(2 * cycle + track.phase));
  const radius = track.radius + .57 * Math.sin(3 * cycle + track.phase);
  const radialSpeed = 1.71 * Math.cos(3 * cycle + track.phase);
  const sin = Math.sin(angle), cos = Math.cos(angle);
  pose.x = radius * sin;
  pose.y = track.depth + .048 * Math.sin(4 * cycle + track.phase);
  pose.z = radius * cos;
  pose.yaw = Math.atan2(radialSpeed * sin + radius * cos * angularSpeed, radialSpeed * cos - radius * sin * angularSpeed);
  pose.roll = .065 * Math.sin(2 * cycle + track.phase);
  pose.pitch = .041 * Math.cos(4 * cycle + track.phase);
  pose.clip = (seconds + track.phase * 3 / tau) % 3;
  return pose;
}
