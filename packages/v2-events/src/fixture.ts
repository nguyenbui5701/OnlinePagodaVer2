import type { DemoEvent, SessionEvent } from './protocol.ts';

export function session(action: SessionEvent['action'] = 'open', atMs = 0, roomEpoch = 1, connection = 1): SessionEvent {
  return { type: 'session', action, atMs, roomEpoch, connection };
}

export function gift(label: string, atMs: number, overrides: Partial<Extract<DemoEvent, { type: 'gift' }>> = {}):
  Extract<DemoEvent, { type: 'gift' }> {
  return {
    type: 'gift', roomEpoch: 1, connection: 1, eventId: `packet-${label}-${atMs}`, atMs,
    viewer: { userKey: `fixture-private-${label}`, name: label }, giftId: 'rose', phase: 'final', count: 1,
    ...overrides,
  };
}

export function demoScript(seed = 16): (DemoEvent | SessionEvent)[] {
  let state = seed >>> 0;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state % 9;
  };
  return [
    session(),
    ...Array.from({ length: 5 }, (_, i) => gift('A', 46000 + i * 50,
      { phase: 'progress', streakId: 'combo-a', count: i + 1 })),
    gift('A', 46300, { streakId: 'combo-a', count: 5 }),
    gift('B', 48000 + next()),
    gift('C', 48100 + next()),
  ];
}
