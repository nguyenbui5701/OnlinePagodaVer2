import type { DemoEvent, SessionEvent } from '../../../packages/v2-events/src/protocol.ts';
import { gift, session } from '../../../packages/v2-events/src/fixture.ts';

export const communityConfig = { spawnOnMember: true, avatarTTLms: 5000 };

export function communityScript(): (DemoEvent | SessionEvent)[] {
  const viewers = {
    A: { userKey: 'community-demo-a', name: 'An' },
    B: { userKey: 'community-demo-b', name: 'Bình' },
    C: { userKey: 'community-demo-c', name: 'Chi' },
    D: { userKey: 'community-demo-d', name: 'Duyên' },
    E: { userKey: 'community-demo-e', name: 'Hà' },
  };
  const member = (who: keyof typeof viewers, atMs: number, connection = 1, roomEpoch = 1):
  Extract<DemoEvent, { viewer: object; type: 'chat' | 'member' }> =>
    ({ type: 'member', atMs, connection, roomEpoch, eventId: `member-${who}-${atMs}`, viewer: viewers[who] });
  const first = member('A', 8000);
  return [
    { type: 'room', roomEpoch: 1, connection: 1, atMs: 2000, eventId: 'room-total-1', count: 41 },
    first, { ...first, atMs: 8250 },
    member('B', 12000), member('C', 12000),
    session('disconnect', 12500),
    member('D', 12600),
    session('reconnect', 12800, 1, 2),
    member('A', 12900, 2),
    member('D', 13200),
    gift('A', 16000, { connection: 2, viewer: viewers.A, count: 2 }),
    { ...member('B', 16500, 2), type: 'chat' },
    { ...member('C', 16500, 2), type: 'chat' },
    gift('D', 17000, { connection: 2, viewer: viewers.D }),
    session('open', 40000, 2),
    member('A', 40100, 2),
    { type: 'room', roomEpoch: 2, connection: 1, atMs: 42000, eventId: 'room-total-2', count: 19 },
    member('E', 47000, 1, 2),
  ];
}
