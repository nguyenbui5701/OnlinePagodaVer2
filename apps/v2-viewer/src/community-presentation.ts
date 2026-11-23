import { Vector3, type PerspectiveCamera } from 'three';
import type { AvatarPresentation } from '../../../packages/v2-events/src/protocol.ts';
import type { ActorTarget } from './seat-scene.ts';
import type { communitySlots } from './community-layout.ts';

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
  stage: HTMLElement, seats: ReadonlyMap<string, ActorTarget['seat']>,
) {
  const labels = new Map([...seats.keys()].map(id => {
    const tag = document.createElement('div');
    tag.className = 'community-name';
    tag.hidden = true;
    stage.prepend(tag);
    return [id, { tag, actorId: undefined as string | undefined, since: 0 }];
  }));
  const world = new Vector3();
  const projected = new Vector3();
  return {
    update(avatars: readonly AvatarPresentation[], camera: PerspectiveCamera, atMs: number, giftActorId?: string) {
      const visible = new Map(avatars.filter(avatar => avatar.visible).map(avatar => [avatar.seatId, avatar]));
      const names: { seatId: string; actorId: string; name: string }[] = [];
      for (const [id, record] of labels) {
        const { tag } = record;
        const avatar = visible.get(id);
        if (avatar?.actorId !== record.actorId) {
          record.actorId = avatar?.actorId;
          record.since = atMs;
        }
        tag.hidden = true;
        tag.textContent = '';
        const seat = seats.get(id)!;
        if (!avatar || avatar.actorId === giftActorId || !seat.root.visible) continue;
        seat.name.getWorldPosition(world);
        projected.copy(world).project(camera);
        const age = atMs - record.since;
        if (age <= 0 || world.distanceToSquared(camera.position) > 24 ** 2 || Math.abs(projected.z) > 1 ||
          Math.abs(projected.x) > 0.8 || Math.abs(projected.y) > 0.84) continue;
        tag.hidden = false;
        tag.textContent = avatar.displayName;
        tag.style.left = `${(projected.x + 1) * 50}%`;
        tag.style.top = `${(1 - projected.y) * 50}%`;
        tag.style.opacity = String(Math.min(1, age / 320));
        names.push({ seatId: avatar.seatId, actorId: avatar.actorId, name: avatar.displayName });
      }
      return names;
    },
    dispose() { for (const { tag } of labels.values()) tag.remove(); },
  };
}
