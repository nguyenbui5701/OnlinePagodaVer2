import { GiftFocusScheduler, demoDefaults, type DemoConfig } from './focus.ts';
import { AvatarRegistry, displayName, sanitizeChat } from './registry.ts';
import { protocolVersion, type DemoEvent, type DemoViewer, type Effect, type SessionEvent, type Snapshot } from './protocol.ts';
export * from './protocol.ts';
export { demoDefaults, type DemoConfig } from './focus.ts';

const validKey = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_:@.-]{1,160}$/.test(value);
const natural = (value: number) => Number.isSafeInteger(value) && value >= 0;
const validViewer = (value: DemoViewer | undefined) =>
  value && validKey(value.userKey) && typeof value.name === 'string';

type Result = {
  revision: number;
  effects: Effect[];
  disposition: 'accepted' | 'duplicate' | 'stale' | 'invalid' | 'session-limit';
};

export class DemoEngine {
  private readonly config: DemoConfig;
  private readonly scheduler: GiftFocusScheduler;
  private registry = new AvatarRegistry('demo-0', 0);
  private epoch = 0;
  private connection = 0;
  private connected = false;
  private atMs = 0;
  private revision = 0;
  private viewerCount = 0;
  private confirmed = 0;
  private requestSequence = 0;
  private nextRippleAt = 0;
  private readonly seen = new Set<string>();
  private readonly gifts = new Map<string, 'observed' | 'confirmed'>();
  private readonly chatBySpeaker = new Map<string, number>();
  private nextChatAt = 0;

  constructor(options: Partial<DemoConfig> = {}) {
    this.config = { ...demoDefaults, ...options };
    for (const [key, value] of Object.entries(this.config)) {
      if (typeof value !== typeof demoDefaults[key as keyof DemoConfig] ||
          (typeof value === 'number' && (!natural(value) || value < 1 || value > 1_000_000))) {
        throw new RangeError(`Invalid DEMO option ${key}`);
      }
    }
    if (this.config.focusMaxMs < this.config.focusHoldMs) throw new RangeError('focusMaxMs must cover focusHoldMs');
    this.scheduler = new GiftFocusScheduler(this.config);
  }

  private get roomSessionId(): string {
    return `demo-${this.epoch}`;
  }

  snapshot(): Snapshot {
    return {
      version: protocolVersion, revision: this.revision, atMs: this.atMs, roomSessionId: this.roomSessionId,
      connected: this.connected, viewerCount: this.viewerCount, confirmedGiftCount: this.confirmed,
      avatars: this.registry.snapshot(), camera: this.scheduler.camera, focus: this.scheduler.focus,
    };
  }

  // Full replacements avoid patch ordering ambiguity. A client can resync at any revision.
  snapshotSince(revision: number): Snapshot | undefined {
    if (revision !== this.revision) return this.snapshot();
  }

  advance(atMs: number): Effect[] {
    if (!natural(atMs) || atMs < this.atMs) throw new RangeError('Clock must be monotonic');
    if (atMs === this.atMs) return [];
    this.atMs = atMs;
    this.revision++;
    const effects: Effect[] = [];
    this.scheduler.advance(atMs, id => this.registry.contains(id), effects);
    this.registry.expire(atMs, this.config.avatarTTLms, this.scheduler.reserved());
    return effects;
  }

  ingest(input: unknown): Result {
    const effects: Effect[] = [];
    const result = (disposition: Result['disposition']): Result => ({ revision: this.revision, effects, disposition });
    if (!input || typeof input !== 'object') return result('invalid');
    const event = input as DemoEvent | SessionEvent;
    if (!natural(event.atMs) || !natural(event.roomEpoch) || !natural(event.connection)) return result('invalid');
    if (event.atMs < this.atMs) return result('stale');

    if (event.type === 'session') {
      if (event.action === 'open' && event.roomEpoch > this.epoch && event.connection === 1) {
        this.scheduler.cancel(event.atMs, effects);
        this.epoch = event.roomEpoch;
        this.connection = 1;
        this.connected = true;
        this.registry = new AvatarRegistry(this.roomSessionId, this.config.maxAvatars);
        this.seen.clear();
        this.gifts.clear();
        this.viewerCount = this.confirmed = this.requestSequence = this.nextRippleAt = 0;
      } else if (event.roomEpoch === this.epoch && this.epoch > 0 &&
          event.action === 'reconnect' && event.connection === this.connection + 1) {
        this.connection = event.connection;
        this.connected = true;
      } else if (event.roomEpoch === this.epoch && event.connection === this.connection &&
          event.action === 'disconnect' && this.connected) {
        this.connected = false;
      } else return result('stale');
      this.chatBySpeaker.clear();
      this.nextChatAt = 0;
      effects.push(...this.advance(event.atMs));
      this.revision++;
      return result('accepted');
    }

    if (!this.connected || event.roomEpoch !== this.epoch || event.connection !== this.connection) return result('stale');
    if (!validKey(event.eventId)) return result('invalid');
    if (this.seen.has(event.eventId)) return result('duplicate');
    const chat = event.type === 'chat' && event.chatText !== undefined ? sanitizeChat(event.chatText) : undefined;
    if (event.type === 'chat' && event.chatText !== undefined && !chat) return result('invalid');
    let giftKey: string | undefined;
    if (event.type === 'gift') {
      if (!validViewer(event.viewer) || !validKey(event.giftId) || !natural(event.count) ||
          event.count < 1 || event.count > 10_000 || !['progress', 'final'].includes(event.phase) ||
          (event.streakId !== undefined && !validKey(event.streakId)) ||
          (event.phase === 'progress' && !event.streakId)) return result('invalid');
      giftKey = JSON.stringify([event.viewer.userKey, event.giftId, event.streakId ? 'streak' : 'event',
        event.streakId ?? event.eventId]);
      if (this.gifts.get(giftKey) === 'confirmed') return result('duplicate');
    } else if (event.type === 'chat' || event.type === 'member') {
      if (!validViewer(event.viewer)) return result('invalid');
    } else if (event.type === 'like' || event.type === 'room') {
      if (!natural(event.count) || (event.type === 'like' && event.count === 0)) return result('invalid');
    } else return result('invalid');

    if (this.seen.size >= this.config.maxSessionKeys) return result('session-limit');
    this.seen.add(event.eventId);
    effects.push(...this.advance(event.atMs));
    this.revision++;

    switch (event.type) {
      case 'chat':
      case 'member': {
        const actor = this.registry.touch(event.viewer, this.atMs,
          event.type === 'chat' ? event.chatText === undefined && this.config.spawnOnChat : this.config.spawnOnMember,
          this.revision);
        if (chat?.text && event.type === 'chat' && this.atMs >= this.nextChatAt &&
            this.atMs >= (this.chatBySpeaker.get(event.viewer.userKey) ?? 0)) {
          // The room cadence bounds this cooldown ledger to five recent speakers.
          for (const [key, until] of this.chatBySpeaker) {
            if (until <= this.atMs) this.chatBySpeaker.delete(key);
          }
          this.chatBySpeaker.set(event.viewer.userKey, this.atMs + 3000);
          this.nextChatAt = this.atMs + 650;
          const cue = { type: 'chatCue' as const, roomSessionId: this.roomSessionId, eventId: event.eventId, atMs: this.atMs,
            displayName: actor?.displayName ?? displayName(event.viewer.name), sanitizedText: chat.text,
            graphemes: chat.graphemes };
          effects.push(actor ? { ...cue, actorId: actor.actorId, seatId: actor.seatId } : cue);
        }
        break;
      }
      case 'room':
        this.viewerCount = event.count;
        break;
      case 'like':
        if (this.atMs >= this.nextRippleAt) {
          this.nextRippleAt = this.atMs + this.config.likeIntervalMs;
          effects.push({ type: 'likeRipple', atMs: this.atMs });
        }
        break;
      case 'gift':
        if (giftKey) this.onGift(event, giftKey, effects);
        break;
    }
    return result('accepted');
  }

  private onGift(event: Extract<DemoEvent, { type: 'gift' }>, key: string, effects: Effect[]): void {
    const alreadyObserved = this.gifts.has(key);
    if (event.phase === 'progress' && (alreadyObserved || !this.config.focusOnObservedGift)) return;

    const confirmation = event.phase === 'final' ? 'confirmed' : 'observed';
    const giftCount = confirmation === 'confirmed' ? event.count : 0;
    this.gifts.set(key, confirmation);
    this.confirmed += giftCount;
    const actor = this.registry.touch(event.viewer, this.atMs, this.config.spawnOnGift, this.revision);
    const requestId = (actor && this.scheduler.requestIdFor(actor.actorId))
      ?? `${this.roomSessionId}-gift-${++this.requestSequence}`;
    const dedicatedFocus = !!actor && this.scheduler.offer({
      requestId, actorId: actor.actorId, roomSessionId: this.roomSessionId,
      giftId: event.giftId, giftCount, confirmation, firstSeenAtMs: this.atMs,
      expiresAtMs: this.atMs + this.config.requestTTLms,
    }, this.atMs, !alreadyObserved);

    if (!dedicatedFocus && !alreadyObserved) {
      effects.push({ type: 'focusSkipped', atMs: this.atMs, requestId, actorId: actor?.actorId,
        reason: actor ? 'queue-full' : 'no-seat' });
    }
    effects.push({ type: 'giftFx', atMs: this.atMs, requestId, actorId: actor?.actorId,
      displayName: actor?.displayName ?? displayName(event.viewer.name), giftId: event.giftId,
      confirmation, giftCount, anchor: dedicatedFocus ? 'giftFx' : 'overlay', dedicatedFocus });
    this.scheduler.advance(this.atMs, id => this.registry.contains(id), effects);
  }
}
