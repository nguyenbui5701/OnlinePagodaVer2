import { spokenAlias, type LiveVoiceIdentity } from './live-alias.ts';
import { demoName, type NameId } from './named-voice.ts';
import type { Effect, Snapshot } from '../../../../packages/v2-events/src/protocol.ts';

export type CueEffect = Extract<Effect, { type: 'giftFx' | 'focusStarted' | 'focusEnded' | 'focusSkipped' }>;
export type CueRecord = {
  effect: CueEffect;
  sequence: number;
  epoch: number;
  room: string;
  revision: number;
  disposition: string;
  seatId?: string;
  liveGift?: { seq: number; roomEpoch: number; connection: number };
};

export type Binding = { actorId: string; seatId: string };
export type GiftSound = 'rose' | 'lantern' | 'generic';
export const giftSound = (id: string): GiftSound => id === 'rose' || id === 'lantern' ? id : 'generic';

export type Cue = {
  room: string;
  request: string;
  binding?: Binding;
  expires: number;
  sound: GiftSound;
  sequence: number;
  count: number;
  liveIdentity?: LiveVoiceIdentity;
  identity?: Readonly<{ epoch: number; nameId: NameId; count: number; displayName: string }>;
};

export type AudioSink = {
  sfx(cue: Cue): void;
  voice(cue: Cue, availableMs: number, waitUntil: number): 'started' | 'waiting' | 'unavailable' | 'too-long';
  cut(reason: string): void;
  prepare?(cue: Cue): void;
  discard?(request: string): void;
};

export const maxPending = 20;
const maxPlayed = 256;
const overlayTTL = 2200;
const pendingTTL = 90_000;
const margin = 140;
const maxNamedWaitMs = 350;

export class AudioDirector {
  private room?: string;
  private epoch = -1;
  private revision = -1;
  private sequence = 0;
  private enabled = false;
  private watermark = -1;
  private pending = new Map<string, Cue>();
  private consumed = new Set<string>();
  private liveConsumed = new Set<number>();
  private retiredThrough = 0;
  private readonly live: boolean;
  private focus?: { request: string; actor: string; deadline: number };
  private active?: { cue: Cue; waitUntil: number };
  private sfxStarted = false;

  constructor(holdMs: number, sink: AudioSink, live = false) {
    this.live = live;
    this.holdMs = holdMs;
    this.sink = sink;
  }
  private readonly holdMs: number;
  private readonly sink: AudioSink;
  readonly suppressed: Record<string, number> = {};

  get queued() { return this.pending.size; }

  enable(on: boolean, reason = 'mute', watermark = -1) {
    if (this.enabled === on) return;
    this.enabled = on;
    if (on) this.watermark = watermark;
    this.clearPending();
    this.cut(reason);
  }

  frame(state: Snapshot, epoch: number, records: readonly CueRecord[], binding?: Binding) {
    if (state.revision < this.revision) return;
    this.revision = state.revision;
    if (this.room !== state.roomSessionId || this.epoch !== epoch) {
      if (this.room !== state.roomSessionId) {
        this.consumed.clear();
        this.liveConsumed.clear();
        this.retiredThrough = 0;
      }
      this.room = state.roomSessionId;
      this.epoch = epoch;
      this.focus = undefined;
      this.clearPending();
      this.cut('session-change');
    }
    for (const record of records) {
      if (record.sequence <= this.sequence) continue;
      this.sequence = record.sequence;
      if (record.room === this.room && record.epoch === epoch && state.connected) this.accept(record);
    }
    if (!this.enabled || !state.connected) return;

    const at = state.atMs;
    const intent = state.focus;
    const avatar = binding && state.avatars.find(value => value.visible &&
      value.actorId === binding.actorId && value.seatId === binding.seatId);
    const eligible = binding && intent && state.camera.mode === 'GIFT_FOCUS' && intent.confirmation === 'confirmed' &&
      this.focus?.request === intent.requestId && this.focus.actor === binding.actorId &&
      intent.actorId === binding.actorId && intent.roomSessionId === state.roomSessionId &&
      state.camera.activeRequestId === intent.requestId && state.camera.activeActorId === binding.actorId &&
      avatar
      ? intent : undefined;
    if (this.active?.cue.liveIdentity && !this.pending.has(this.active.cue.request) &&
        spokenAlias(avatar?.displayName) !== this.active.cue.liveIdentity.alias) {
      this.cut('name-changed');
    }
    const idle = state.camera.mode === 'CINEMATIC' && !intent && state.camera.pendingGivers === 0;

    const active = this.active?.cue;
    if (active && (active.binding
      ? eligible?.requestId !== active.request || binding?.seatId !== active.binding.seatId ||
        at >= Math.min(this.focus?.deadline ?? 0, eligible.expiresAtMs)
      : !idle || at >= active.expires)) this.cut('focus-exit');

    for (const [key, cue] of this.pending) {
      if (at >= cue.expires) {
        this.drop(key, 'expired');
        continue;
      }
      if ((cue.identity || cue.liveIdentity) && cue.binding && !state.avatars.some(value => value.visible &&
          value.actorId === cue.binding?.actorId && value.seatId === cue.binding.seatId &&
          (cue.liveIdentity ? spokenAlias(value.displayName) === cue.liveIdentity.alias : value.displayName === cue.identity?.displayName))) {
        this.sink.discard?.(key);
        this.pending.set(key, { ...cue, identity: undefined, liveIdentity: undefined });
        this.count('name-changed');
      }
    }
    const cue = eligible ? this.pending.get(eligible.requestId) :
      idle ? (this.active ? this.pending.get(this.active.cue.request) :
        [...this.pending.values()].find(item => !item.binding)) : undefined;
    if (!cue) return;
    if (cue.binding && (cue.binding.actorId !== binding?.actorId || cue.binding.seatId !== binding.seatId)) {
      this.drop(cue.request, 'binding-mismatch');
      return;
    }
    const deadline = eligible ? Math.min(this.focus!.deadline, eligible.expiresAtMs, cue.expires) : cue.expires;
    if (deadline - at <= margin) {
      this.drop(cue.request, 'insufficient-hold');
      return;
    }
    this.active ??= { cue, waitUntil: at + maxNamedWaitMs };
    if (cue.binding && !this.sfxStarted) {
      this.sfxStarted = true;
      this.sink.sfx(cue);
    }
    const status = this.sink.voice(cue, deadline - at - margin, this.active.waitUntil);
    if (status !== 'waiting') this.drop(cue.request, status === 'started' ? undefined : status);
  }

  private clearPending() {
    for (const request of this.pending.keys()) this.sink.discard?.(request);
    this.pending.clear();
  }

  private accept(record: CueRecord) {
    const { effect } = record;
    if (effect.type === 'focusStarted') {
      if (effect.intent.roomSessionId === record.room) this.focus = {
        request: effect.intent.requestId, actor: effect.intent.actorId, deadline: effect.atMs + this.holdMs,
      };
      return;
    }
    if (effect.type === 'focusEnded' || effect.type === 'focusSkipped') {
      const request = 'intent' in effect ? effect.intent.requestId : effect.requestId;
      if (this.focus?.request === request) this.focus = undefined;
      if (this.pending.has(request)) this.drop(request, 'focus-ended');
      if (this.active?.cue.request === request) this.cut('focus-ended');
      return;
    }
    if (effect.type !== 'giftFx' || record.disposition !== 'accepted' || effect.confirmation !== 'confirmed') return;
    if (effect.dedicatedFocus !== (effect.anchor === 'giftFx')) return;
    if (!this.enabled) { this.count('disabled'); return; }
    if (effect.atMs <= this.watermark) { this.count('before-enable'); return; }
    const request = effect.requestId;
    const previous = this.pending.get(request);
    const binding = effect.dedicatedFocus && effect.actorId && record.seatId
      ? { actorId: effect.actorId, seatId: record.seatId } : undefined;
    if (effect.dedicatedFocus && !binding) { this.count('binding-missing'); return; }
    const label = this.live ? undefined : demoName(effect.displayName);
    const alias = this.live && binding && record.liveGift ? spokenAlias(effect.displayName) : undefined;
    const liveIdentity = alias && record.liveGift ? { ...record.liveGift, alias, count: effect.giftCount } : undefined;
    const sound = giftSound(effect.giftId);
    const identity = label && binding && effect.giftCount >= 1 && effect.giftCount <= 8
      ? { epoch: record.epoch, nameId: label, count: effect.giftCount, displayName: effect.displayName } : undefined;
    if (previous) {
      if (previous.binding?.actorId !== binding?.actorId || previous.binding?.seatId !== binding?.seatId) {
        this.drop(request, 'binding-mismatch');
        return;
      }
      // Pending survives only while voice is waiting. Supersede it without rearming the chime or wait deadline.
      const next = { ...previous, sound, identity, liveIdentity: undefined, sequence: record.sequence, count: previous.count + effect.giftCount };
      this.pending.set(request, next);
      this.sink.prepare?.(next);
      this.count('coalesced');
      return;
    }
    if (!this.consume(record.room, request)) return;
    if (this.pending.size >= maxPending) { this.count('queue-capacity'); return; }
    const cue: Cue = { room: record.room, request, binding, sequence: record.sequence, identity,
      count: effect.giftCount, sound, liveIdentity, expires: effect.atMs + (binding ? pendingTTL : overlayTTL) };
    this.pending.set(request, cue);
    this.sink.prepare?.(cue);
  }

  private consume(room: string, request: string) {
    if (!this.live) {
      if (this.consumed.has(request)) { this.count('already-played'); return false; }
      if (this.consumed.size >= maxPlayed) { this.count('ledger-capacity'); return false; }
      this.consumed.add(request);
      return true;
    }
    // Engine allocates increasing request numbers per room. Advance a permanent floor
    // on eviction so even a replay arriving with a new cue sequence stays suppressed.
    const prefix = room + '-gift-';
    const ordinal = request.startsWith(prefix) ? Number(request.slice(prefix.length)) : NaN;
    if (!Number.isSafeInteger(ordinal) || ordinal <= this.retiredThrough ||
        request !== prefix + ordinal || this.liveConsumed.has(ordinal)) {
      this.count('already-played');
      return false;
    }
    this.liveConsumed.add(ordinal);
    if (this.liveConsumed.size > maxPlayed) {
      this.retiredThrough = Math.min(...this.liveConsumed);
      this.liveConsumed.delete(this.retiredThrough);
    }
    return true;
  }

  private drop(key: string, reason?: string) {
    this.pending.delete(key);
    this.sink.discard?.(key);
    if (reason) this.count(reason);
  }

  private count(reason: string) {
    this.suppressed[reason] = (this.suppressed[reason] ?? 0) + 1;
  }

  private cut(reason: string) {
    this.active = undefined;
    this.sfxStarted = false;
    this.sink.cut(reason);
  }
}
