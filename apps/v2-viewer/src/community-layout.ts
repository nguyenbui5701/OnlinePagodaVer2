export const heroSlots = [
  { id: 'seat-1', position: [2, 0.065, 13.5], yaw: 0.14 },
  { id: 'seat-2', position: [-1.4, 0.065, 12.35], yaw: -0.19 },
  { id: 'seat-3', position: [4.8, 0.065, 11.15], yaw: 0.32 },
];

// Stagger around the original foreground seats. Keep the central lanes clear for close/gift shots.
const arc = [
  [-5.5, 17.8], [7.5, 18.2], [-7.4, 11.3], [10.8, 12.2],
  [-10.8, 5.1], [9.1, 5.8], [-12.5, -2.1], [12.6, -1.8], [-5.2, -12.1],
];

export function communitySlots(seed: number, treeX: number, treeZ: number) {
  let state = seed >>> 0;
  const jitter = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000 - 0.5;
  };
  return [...heroSlots, ...arc.map(([x, z], index) => ({
    id: `visual-${index + 4}`,
    position: [treeX + x + jitter() * .5, 0.065, treeZ + z + jitter() * .5],
    yaw: jitter() * .8,
  }))].map(slot => ({ ...slot, decorId: `decor-${slot.id}` }));
}
