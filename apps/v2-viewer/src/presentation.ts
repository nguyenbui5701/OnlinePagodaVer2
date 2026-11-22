import { Object3D, Vector3 } from 'three';

export type AvatarPresentation = {
  actorId: string; seatId: string; displayName: string; avatarUrl?: string;
  appearanceVariant: string; visible: boolean; revision: number;
};
export type FocusIntent = {
  requestId: string; roomSessionId: string; actorId: string; giftId: string; giftCount: number;
  confirmation: 'observed' | 'confirmed'; firstSeenAtMs: number; expiresAtMs: number;
};
export type CameraPresentation = {
  mode: 'CINEMATIC' | 'GIFT_TRANSITION' | 'GIFT_FOCUS' | 'CINE_RETURN' | 'MANUAL';
  activeRequestId?: string; activeActorId?: string; pendingGivers: number; cinematicShotId?: string;
};
export type Vec3 = [number, number, number];
export type LotusSeat = {
  seatId: string; leafAssetId: string; position: Vec3; rotationY: number;
  groupId: string; cameraAnchor?: Vec3;
};
export const mockSeat: LotusSeat = {
  seatId: 'seat-1', leafAssetId: 'lotus_pad_01', position: [3, 0.3, 13], rotationY: 0.2,
  groupId: 'demo',
};

export function attachSeat(group: Object3D, seat: LotusSeat): Object3D {
  const root = new Object3D();
  root.name = seat.seatId;
  root.position.fromArray(seat.position);
  root.rotation.y = seat.rotationY;
  group.add(root);
  return root;
}

export function resolveFocusTarget(
  intent: FocusIntent, roomSessionId: string, avatars: readonly AvatarPresentation[],
  seats: ReadonlyMap<string, Object3D>, actorHeadAnchors: ReadonlyMap<string, Vec3>,
): Vector3 | undefined {
  if (intent.roomSessionId !== roomSessionId) return;
  const actor = avatars.find(avatar => avatar.actorId === intent.actorId && avatar.visible);
  if (!actor) return;
  const seat = seats.get(actor.seatId);
  const head = actorHeadAnchors.get(actor.actorId);
  if (seat && head) return seat.localToWorld(new Vector3().fromArray(head));
}
