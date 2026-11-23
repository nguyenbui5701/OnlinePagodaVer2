import { Vector3, type Object3D, type PerspectiveCamera } from 'three';
import { type ChatCue, type Snapshot } from '../../../packages/v2-events/src/protocol.ts';
import type { createGiftFx } from './gift-fx.ts';
import type { ActorTarget } from './seat-scene.ts';

type Gift = NonNullable<ReturnType<ReturnType<typeof createGiftFx>['update']>['gift']>;
const floatMs = 900;
const giftMs = 1450;

export function chatAnimation(age: number, graphemes: number) {
  const dwell = Math.min(2000, 1000 + graphemes * 25);
  if (age < 0 || age >= dwell + floatMs) return;
  if (age < dwell) return { phase: 'read', scale: 1, rise: 0, opacity: 1 };
  const t = (age - dwell) / floatMs;
  return { phase: 'float', scale: 1 - t * 0.65, rise: 58 * t, opacity: 1 - t };
}

// Three locally authored geometric text tokens. No platform art or external sprites.
export const giftToken = (giftId: string) => giftId === 'rose' ? 'rosette'
  : giftId === 'lantern' ? 'lantern' : 'neutral';
const symbols = { rosette: '✿', lantern: '▣', neutral: '◇' };

export function createPresenceBubbles(stage: HTMLElement, profile: 'eco' | 'quality', chat: boolean, gifts: boolean) {
  function pooled(className: string) {
    const node = document.createElement('div');
    node.className = className;
    node.hidden = true;
    stage.append(node);
    return node;
  }
  const chatNode = chat ? pooled('chat-bubble') : undefined;
  const icons = gifts ? Array.from({ length: profile === 'eco' ? 3 : 5 }, () => pooled('gift-token')) : [];
  for (const node of icons) node.setAttribute('aria-hidden', 'true');
  const world = new Vector3();
  const point = new Vector3();
  let hiddenThrough = -1;
  let chatKey = '';
  let giftKey = '';

  function project(anchor: Object3D, camera: PerspectiveCamera, distance: number) {
    anchor.getWorldPosition(world);
    if (world.distanceToSquared(camera.position) > distance ** 2) return;
    point.copy(world).project(camera);
    if (Math.abs(point.z) > 1 || Math.abs(point.x) > 0.84 || Math.abs(point.y) > 0.78) return;
    return { x: (1 + point.x) * 50, y: (1 - point.y) * 50 };
  }
  const nodes = [...(chatNode ? [chatNode] : []), ...icons];
  function hide() { for (const node of nodes) node.hidden = true; }
  let room: string | undefined;
  return {
    clear(atMs: number) {
      hiddenThrough = atMs;
      chatKey = giftKey = '';
      for (const node of nodes) {
        node.hidden = true;
        node.textContent = '';
      }
    },
    update(state: Snapshot, cue: ChatCue | undefined, gift: Gift | undefined, target: ActorTarget | undefined,
      seats: ReadonlyMap<string, ActorTarget['seat']>, camera: PerspectiveCamera, priority: boolean) {
      hide();
      const result: { chat?: { phase: string; seatId?: string; eventId: string };
        gift?: { type: string; count: number; seatId: string } } = {};
      if (room !== state.roomSessionId || !state.connected) {
        for (const node of nodes) if (node.textContent) node.textContent = '';
        room = state.roomSessionId;
        chatKey = giftKey = '';
      }
      if (!state.connected || document.hidden) return result;
      if (!cue && chatKey && chatNode) {
        chatKey = '';
        chatNode.textContent = '';
      }
      if (chatNode && cue && cue.atMs > hiddenThrough && cue.roomSessionId === state.roomSessionId && !priority) {
        const actor = state.avatars.find(item => item.visible && item.actorId === cue.actorId && item.seatId === cue.seatId);
        const seat = actor && seats.get(actor.seatId);
        const placement = cue.seatId ? seat?.root.visible && project(seat.name, camera, 24) : { x: 50, y: 84 };
        const timeline = chatAnimation(state.atMs - cue.atMs, cue.graphemes);
        if (placement && timeline) {
          const floating = timeline.phase === 'float';
          const x = cue.seatId ? Math.min(74, Math.max(26, placement.x + (placement.x <= 50 ? 25 : -25))) : 50;
          const y = Math.min(84, Math.max(27, placement.y - (cue.seatId ? 7 : 0)));
          if (chatKey !== cue.eventId || chatNode.dataset.phase !== timeline.phase) {
            chatKey = cue.eventId;
            chatNode.textContent = floating ? '· · ·' : cue.seatId ? cue.sanitizedText : 'Có lời nhắn mới';
          }
          chatNode.dataset.phase = timeline.phase;
          chatNode.style.left = `${x}%`;
          chatNode.style.top = `max(12%, calc(${y}% - ${timeline.rise}px))`;
          chatNode.style.opacity = String(timeline.opacity);
          chatNode.style.transform = `translate(-50%, -50%) scale(${timeline.scale})`;
          chatNode.hidden = false;
          result.chat = { phase: timeline.phase, eventId: cue.eventId, seatId: cue.seatId };
        }
      }

      if (icons.length && gift?.phase === 'confirmed' && gift.roomSessionId === state.roomSessionId &&
          gift.startedAtMs > hiddenThrough && state.focus?.requestId === gift.requestId &&
          state.focus.actorId === gift.actorId && target?.presentation.actorId === gift.actorId &&
          target.presentation.seatId === gift.seatId) {
        const p = project(target.seat.fx, camera, 24);
        const head = project(target.seat.head, camera, 24);
        const progress = (state.atMs - gift.startedAtMs) / giftMs;
        if (p && head && progress >= 0 && progress < 1) {
          const type = giftToken(gift.giftId);
          const center = head.x >= 42 ? Math.min(p.x - 15, head.x - 26) : Math.max(p.x + 19, head.x + 26);
          for (const [i, node] of icons.entries()) {
            const angle = (i / icons.length) * Math.PI * 2 + progress * 2.6;
            if (giftKey !== gift.requestId) {
              node.dataset.token = type;
              node.textContent = symbols[type];
            }
            node.style.left = `${Math.min(86, Math.max(14, center + Math.cos(angle) * 5))}%`;
            node.style.top = `${Math.min(85, Math.max(15, p.y + 8 - progress * 9 + Math.sin(angle) * 3))}%`;
            node.style.opacity = String(Math.min(1, progress * 12) * (1 - progress));
            node.hidden = false;
          }
          giftKey = gift.requestId;
          result.gift = { type, count: icons.length, seatId: gift.seatId };
        }
      }
      return result;
    },
    dispose() { for (const node of nodes) node.remove(); },
  };
}
