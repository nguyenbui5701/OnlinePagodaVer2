import type { DemoEvent } from '../../../packages/v2-events/src/protocol.ts';
import { gift } from '../../../packages/v2-events/src/fixture.ts';

export function presenceDemo(chat: boolean, icons: boolean): DemoEvent[] {
  const a = { userKey: 'community-demo-a', name: 'An' };
  const first: DemoEvent = { type: 'chat', roomEpoch: 1, connection: 1, atMs: 8400,
    eventId: 'bubble-short', viewer: a, chatText: 'Chúc an lành 🌿' };
  const second: DemoEvent = { type: 'chat', roomEpoch: 1, connection: 2, atMs: 13400, eventId: 'bubble-long',
    viewer: { userKey: 'community-demo-b', name: 'Bình' },
    chatText: 'Mong mọi người có một buổi tối bình yên, cùng ngắm hoa sen và lắng nghe tiếng gió bên hồ. 🌸' };
  return [
    ...(chat ? [first, { ...first, atMs: 8500 }, second, { ...second, atMs: 14200, eventId: 'bubble-overflow',
      viewer: { userKey: 'community-demo-d', name: 'Duyên' }, chatText: 'Xin chào mọi người!' }] : []),
    ...(icons ? [gift('lantern', 45000, { roomEpoch: 2, viewer: a, giftId: 'lantern' }),
      gift('unknown', 54500, { roomEpoch: 2, viewer: a, giftId: 'unknown-test' })] : []),
  ];
}
