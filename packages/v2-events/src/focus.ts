import type { CameraPresentation, Effect, FocusIntent } from './protocol.ts';

export const demoDefaults = {
  spawnOnChat: true, spawnOnMember: false, spawnOnGift: true, focusOnObservedGift: true,
  maxAvatars: 30, avatarTTLms: 60_000, maxPendingGifters: 16, requestTTLms: 90_000,
  transitionMs: 900, focusHoldMs: 4800, focusMaxMs: 7000, returnMs: 1200,
  maxSessionKeys: 65_536, likeIntervalMs: 500,
};
export type DemoConfig = typeof demoDefaults;
type Slot = { intent: FocusIntent; deadline: number; holdStart: number; extended: boolean };

export class GiftFocusScheduler {
  private readonly pending = new Map<string, FocusIntent>();
  private active?: Slot;
  private mode: CameraPresentation['mode'] = 'CINEMATIC';
  private returnAt = 0;
  private readonly config: DemoConfig;

  constructor(config: DemoConfig) {
    this.config = config;
  }

  get focus(): FocusIntent | undefined {
    return this.active && { ...this.active.intent };
  }

  requestIdFor(actorId: string): string | undefined {
    return this.active?.intent.actorId === actorId
      ? this.active.intent.requestId : this.pending.get(actorId)?.requestId;
  }

  get camera(): CameraPresentation {
    return {
      mode: this.mode, pendingGivers: this.pending.size,
      activeActorId: this.active?.intent.actorId, activeRequestId: this.active?.intent.requestId,
    };
  }

  reserved(): Set<string> {
    const ids = new Set(this.pending.keys());
    if (this.active) ids.add(this.active.intent.actorId);
    return ids;
  }

  offer(intent: FocusIntent, now: number, freshGift: boolean): boolean {
    const active = this.active?.intent.actorId === intent.actorId ? this.active : undefined;
    const previous = active?.intent ?? this.pending.get(intent.actorId);
    if (previous) {
      // Repeated progress keeps the original slot. Only confirmed packets contribute a count.
      if (intent.confirmation === 'confirmed') {
        previous.confirmation = 'confirmed';
        previous.giftCount = previous.giftId === intent.giftId
          ? previous.giftCount + intent.giftCount : intent.giftCount;
        previous.giftId = intent.giftId;
      }
      if (active && freshGift && !active.extended && this.mode === 'GIFT_FOCUS') {
        active.deadline = Math.min(active.holdStart + this.config.focusMaxMs, active.deadline + 1000);
        active.extended = true;
      }
      return true;
    }
    if (!freshGift || this.pending.size >= this.config.maxPendingGifters) return false;
    this.pending.set(intent.actorId, intent);
    return true;
  }

  cancel(now: number, effects: Effect[]): void {
    if (this.active) {
      if (this.mode === 'GIFT_FOCUS') effects.push({ type: 'focusEnded', atMs: now, intent: { ...this.active.intent } });
      else this.skip(this.active.intent, now, 'room-changed', effects);
    }
    for (const intent of this.pending.values()) this.skip(intent, now, 'room-changed', effects);
    this.pending.clear();
    this.active = undefined;
    this.mode = 'CINEMATIC';
  }

  advance(now: number, hasActor: (actorId: string) => boolean, effects: Effect[]): void {
    while (true) {
      if (this.active) {
        const slot = this.active;
        if (slot.deadline > now) return;
        if (this.mode === 'GIFT_TRANSITION' && slot.intent.expiresAtMs > slot.deadline && hasActor(slot.intent.actorId)) {
          this.mode = 'GIFT_FOCUS';
          slot.holdStart = slot.deadline;
          slot.deadline += this.config.focusHoldMs;
          effects.push({ type: 'focusStarted', atMs: slot.holdStart, intent: { ...slot.intent } });
          continue;
        }
        if (this.mode === 'GIFT_FOCUS') {
          effects.push({ type: 'focusEnded', atMs: slot.deadline, intent: { ...slot.intent } });
        } else {
          this.skip(slot.intent, slot.deadline, hasActor(slot.intent.actorId) ? 'expired' : 'actor-missing', effects);
        }
        this.active = undefined;
        this.beginNext(slot.deadline, hasActor, effects);
      } else if (this.pending.size) {
        this.beginNext(now, hasActor, effects);
      } else {
        if (this.mode === 'CINE_RETURN' && now >= this.returnAt) this.mode = 'CINEMATIC';
        return;
      }
    }
  }

  private beginNext(at: number, hasActor: (actorId: string) => boolean, effects: Effect[]): void {
    for (const [actorId, intent] of this.pending) {
      this.pending.delete(actorId);
      if (intent.expiresAtMs <= at + this.config.transitionMs || !hasActor(actorId)) {
        this.skip(intent, at, hasActor(actorId) ? 'expired' : 'actor-missing', effects);
        continue;
      }
      this.active = { intent, deadline: at + this.config.transitionMs, holdStart: 0, extended: false };
      this.mode = 'GIFT_TRANSITION';
      return;
    }
    if (this.mode === 'GIFT_FOCUS' || this.mode === 'GIFT_TRANSITION') {
      this.mode = 'CINE_RETURN';
      this.returnAt = at + this.config.returnMs;
    }
  }

  private skip(intent: FocusIntent, atMs: number, reason: 'expired' | 'actor-missing' | 'room-changed', effects: Effect[]): void {
    effects.push({ type: 'focusSkipped', atMs, requestId: intent.requestId, actorId: intent.actorId, reason });
  }
}
