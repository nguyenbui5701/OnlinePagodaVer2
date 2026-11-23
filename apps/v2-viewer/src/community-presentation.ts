import { Vector3, type PerspectiveCamera } from 'three';
import type { AvatarPresentation } from '../../../packages/v2-events/src/protocol.ts';
import type { ActorTarget } from './seat-scene.ts';
import type { communitySlots } from './community-layout.ts';
import { setAvatarBadge } from './avatar-badge.ts';

type Slots = ReturnType<typeof communitySlots>;

export function occupancy(slots: Slots, avatars: readonly AvatarPresentation[]) {
  const visible = new Map(avatars.filter(avatar => avatar.visible).map(avatar => [avatar.seatId, avatar]));
  return slots.map(({ id, decorId }) => {
    const avatar = visible.get(id);
    return avatar
      ? { slotId: id, kind: 'REAL_OCCUPIED' as const, actorId: avatar.actorId, seatId: avatar.seatId }
      : { slotId: id, kind: 'DECORATIVE_ANONYMOUS' as const, decorId };
  });
}

export function createCommunityNames(
  stage: HTMLElement, seats: ReadonlyMap<string, ActorTarget['seat']>, presence = false,
) {
  const labels = new Map([...seats.keys()].map(id => {
    const tag = document.createElement('div');
    tag.className = 'community-name';
    tag.hidden = true;
    stage.prepend(tag);
    return [id, { tag, actorId: undefined as string | undefined, since: 0, text: '' }];
  }));
  const world = new Vector3();
  const projected = new Vector3();
  return {
    clear() {
      for (const record of labels.values()) {
        record.tag.hidden = true;
        record.tag.textContent = record.text = '';
        record.actorId = undefined;
      }
    },
    update(avatars: readonly AvatarPresentation[], camera: PerspectiveCamera, atMs: number, giftActorId?: string) {
      const visible = new Map(avatars.filter(avatar => avatar.visible).map(avatar => [avatar.seatId, avatar]));
      const names: { seatId: string; actorId: string; name: string }[] = [];
      for (const [id, record] of labels) {
        const { tag } = record;
        const avatar = visible.get(id);
        if (avatar?.actorId !== record.actorId) {
          record.actorId = avatar?.actorId;
          record.since = atMs;
          if (presence) tag.textContent = record.text = '';
        }
        tag.hidden = true;
        if (!presence) tag.textContent = '';
        const seat = seats.get(id)!;
        if (!avatar || avatar.actorId === giftActorId || !seat.root.visible) {
          if (presence && record.text) tag.textContent = record.text = '';
          continue;
        }
        seat.name.getWorldPosition(world);
        projected.copy(world).project(camera);
        const age = atMs - record.since;
        if (age <= 0 || world.distanceToSquared(camera.position) > 24 ** 2 || Math.abs(projected.z) > 1 ||
          Math.abs(projected.x) > 0.8 || Math.abs(projected.y) > 0.84) continue;
        tag.hidden = false;
        if (!presence) tag.textContent = avatar.displayName;
        else if (record.text !== avatar.displayName) {
          record.text = avatar.displayName;
          setAvatarBadge(tag, record.text);
        }
        const x = (projected.x + 1) * 50;
        tag.style.left = `${presence ? Math.min(74, Math.max(26, x)) : x}%`;
        tag.style.top = `${(1 - projected.y) * 50}%`;
        tag.style.opacity = String(Math.min(1, age / 320));
        names.push({ seatId: avatar.seatId, actorId: avatar.actorId, name: avatar.displayName });
      }
      return names;
    },
    dispose() { for (const { tag } of labels.values()) tag.remove(); },
  };
}
