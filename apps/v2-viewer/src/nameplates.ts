import { Raycaster, Vector3, type Object3D, type PerspectiveCamera } from 'three';
import type { Snapshot } from '../../../packages/v2-events/src/protocol.ts';
import { renderAvatarBadge, resolveAvatar } from './avatar-badge.ts';
import type { ActorTarget } from './seat-scene.ts';

export function projectNameplate(camera: PerspectiveCamera, head: Vector3, anchor: Vector3) {
  const screen = (point: Vector3) => {
    const ndc = point.clone().project(camera);
    return { x: (ndc.x + 1) / 2, y: (1 - ndc.y) / 2, z: ndc.z };
  };
  return { head: screen(head), anchor: screen(anchor) };
}

function onScreen(point: { x: number; y: number; z: number }) {
  return point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1 && Math.abs(point.z) <= 1;
}

export function createNameplates(stage: HTMLElement, seats: ReadonlyMap<string, ActorTarget['seat']>, tree: Object3D) {
  type Plate = { node: HTMLDivElement; key?: string; name?: string; photo?: string; release?: () => void };
  const plates = new Map<string, Plate>();
  tree.updateWorldMatrix(true, true);
  stage.classList.add('has-nameplates');
  for (const id of seats.keys()) {
    const node = document.createElement('div');
    node.className = 'community-name persistent-nameplate';
    node.dataset.seat = id;
    node.hidden = true;
    stage.prepend(node);
    plates.set(id, { node });
  }
  const head = new Vector3();
  const anchor = new Vector3();
  const direction = new Vector3();
  const ray = new Raycaster();
  const hits: ReturnType<Raycaster['intersectObject']> = [];

  function occluded(point: Vector3, camera: PerspectiveCamera, seatId: string) {
    direction.subVectors(point, camera.position);
    ray.far = direction.length() - .04;
    ray.set(camera.position, direction.normalize());
    hits.length = 0;
    if (ray.intersectObject(tree, true, hits).length) return true;
    for (const [id, seat] of seats) {
      if (id !== seatId && seat.root.visible && ray.intersectObject(seat.actor, true, hits).length) return true;
    }
    return false;
  }

  function clear(plate: Plate) {
    plate.node.hidden = true;
    if (!plate.key) return;
    plate.release?.();
    plate.node.replaceChildren();
    delete plate.node.dataset.actor;
    plate.key = plate.name = plate.photo = undefined;
    plate.release = undefined;
  }

  return {
    update(state: Snapshot, camera: PerspectiveCamera, inspect: boolean) {
      const names: { seatId: string; actorId: string; name: string }[] = [];
      const projections: Record<string, ReturnType<typeof projectNameplate> & { actorId: string; visible: boolean }> = {};
      for (const [seatId, plate] of plates) {
        const seat = seats.get(seatId)!;
        const actor = state.avatars.find(item => item.seatId === seatId && item.visible);
        const binding = actor && { roomSessionId: state.roomSessionId, actorId: actor.actorId, seatId };
        const avatar = binding && resolveAvatar(state, binding);
        if (!avatar || !binding) { clear(plate); continue; }
        const key = JSON.stringify(binding);
        if (key !== plate.key || avatar.name !== plate.name || avatar.photo !== plate.photo) {
          clear(plate);
          plate.key = key;
          plate.name = avatar.name;
          plate.photo = avatar.photo;
          plate.node.dataset.actor = binding.actorId;
          plate.release = renderAvatarBadge(plate.node, avatar);
        }
        seat.head.getWorldPosition(head);
        seat.name.getWorldPosition(anchor);
        // Use the authored anchor height, calibrated toward the scalp on the shared vertical head axis.
        anchor.set(head.x, head.y + (anchor.y - head.y) * .65, head.z);
        const points = projectNameplate(camera, head, anchor);
        const visible = seat.root.visible && !document.hidden && onScreen(points.head) && onScreen(points.anchor) &&
          !occluded(head, camera, seatId);
        plate.node.hidden = !visible;
        if (inspect) projections[seatId] = { ...points, actorId: binding.actorId, visible };
        if (!visible) continue;
        plate.node.style.left = `${points.anchor.x * 100}%`;
        plate.node.style.top = `${points.anchor.y * 100}%`;
        names.push({ seatId, actorId: binding.actorId, name: avatar.name });
      }
      return { names, projections };
    },
    clear() { for (const plate of plates.values()) clear(plate); },
    dispose() {
      for (const plate of plates.values()) {
        clear(plate);
        plate.node.remove();
      }
      stage.classList.remove('has-nameplates');
    },
  };
}
