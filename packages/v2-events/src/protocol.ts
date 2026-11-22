export const protocolVersion = '0.1.0';

export type AvatarPresentation = {
  actorId: string;
  seatId: string;
  displayName: string;
  avatarUrl?: string;
  appearanceVariant: string;
  visible: boolean;
  revision: number;
};

export type FocusIntent = {
  requestId: string;
  roomSessionId: string;
  actorId: string;
  giftId: string;
  giftCount: number;
  confirmation: 'observed' | 'confirmed';
  firstSeenAtMs: number;
  expiresAtMs: number;
};

export type CameraPresentation = {
  mode: 'CINEMATIC' | 'GIFT_TRANSITION' | 'GIFT_FOCUS' | 'CINE_RETURN' | 'MANUAL';
  activeRequestId?: string;
  activeActorId?: string;
  pendingGivers: number;
  cinematicShotId?: string;
};

export type DemoViewer = { userKey: string; name: string; avatarUrl?: string };
export type Scope = { roomEpoch: number; connection: number };
type Packet = Scope & { eventId: string; atMs: number };
export type DemoEvent =
  | (Packet & { type: 'chat' | 'member'; viewer: DemoViewer })
  | (Packet & { type: 'like' | 'room'; count: number })
  | (Packet & {
      type: 'gift';
      viewer: DemoViewer;
      giftId: string;
      count: number;
      phase: 'progress' | 'final';
      streakId?: string;
    });
export type SessionEvent = Scope & { type: 'session'; action: 'open' | 'disconnect' | 'reconnect'; atMs: number };

export type SkipReason = 'no-seat' | 'queue-full' | 'expired' | 'actor-missing' | 'room-changed';
export type Effect =
  | { type: 'focusStarted' | 'focusEnded'; atMs: number; intent: FocusIntent }
  | { type: 'focusSkipped'; atMs: number; reason: SkipReason; requestId: string; actorId?: string }
  | { type: 'giftFx'; atMs: number; requestId: string; actorId?: string; displayName: string; giftId: string;
      confirmation: 'observed' | 'confirmed'; giftCount: number; anchor: 'giftFx' | 'overlay';
      dedicatedFocus: boolean }
  | { type: 'likeRipple'; atMs: number };

export type Snapshot = {
  version: typeof protocolVersion;
  roomSessionId: string;
  revision: number;
  atMs: number;
  connected: boolean;
  viewerCount: number;
  confirmedGiftCount: number;
  avatars: AvatarPresentation[];
  camera: CameraPresentation;
  focus?: FocusIntent;
};
