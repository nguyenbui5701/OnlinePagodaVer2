import { presenceFlowKeys, type PresenceApplied, type PresenceSnapshot } from '../../../packages/v2-events/src/presence.ts';
import type { CueRecord } from './audio/director.ts';
import { liveBatchLimit, type LiveEntry } from './live-receiver.ts';
import { DemoEngine, protocolVersion, type ChatCue, type DemoEvent, type Effect, type FocusIntent, type SessionEvent, type Snapshot } from '../../../packages/v2-events/src/engine.ts';
import { demoScript, gift, session } from '../../../packages/v2-events/src/fixture.ts';
import { communityConfig, communityScript } from './community-demo.ts';

export const timing = { transitionMs: 1050, focusHoldMs: 4800, returnMs: 1450 };
const names: Record<string, string> = { A: 'An', B: 'Bình', C: 'Chi', D: 'Duyên' };

export class SceneObserver {
  private state?: Snapshot;

  accept(snapshot: Snapshot): boolean {
    if (snapshot.version !== protocolVersion ||
        (this.state && (snapshot.revision <= this.state.revision || snapshot.atMs < this.state.atMs))) return false;
    this.state = snapshot;
    return true;
  }

  target(intent: FocusIntent | undefined) {
    if (!this.state || !intent || intent.roomSessionId !== this.state.roomSessionId ||
        this.state.camera.activeRequestId !== intent.requestId || this.state.camera.activeActorId !== intent.actorId) return;
    return this.state.avatars.find(avatar => avatar.visible && avatar.actorId === intent.actorId);
  }
}

function commands(capacity: boolean): DemoEvent[] {
  const events = demoScript().flatMap(event => event.type === 'gift'
    ? [{ ...event, viewer: { ...event.viewer, name: names[event.viewer.name] } }] : []);
  const progress = events[0];
  const final = events[5];
  events.splice(1, 0, { ...progress });
  events.splice(7, 0, { ...final }, { ...final, eventId: 'repeat-final-new-packet', atMs: final.atMs + 5 });
  if (capacity) events.push(gift('D', 48500, { viewer: { name: names.D, userKey: 'fixture-private-D' } }));
  return events;
}

type DomainLog = { atMs: number; state: Snapshot; effects: Effect[]; disposition?: string };
export type Scenario = 'idle' | 'gifts' | 'capacity' | 'community';
export function parseScenario(value: string | null): Scenario {
  return value === 'gifts' || value === 'capacity' || value === 'community' ? value : 'idle';
}

export class SliceDriver {
  private readonly engine: DemoEngine;
  private presenceRevision = 0;
  private pendingPresence?: PresenceSnapshot;
  private readonly observer = new SceneObserver();
  private readonly events: (DemoEvent | ReturnType<typeof session>)[];
  private cursor = 0;
  private readonly live: boolean;
  private readonly liveQueue: LiveEntry[] = [];
  private liveReceived = 0;
  private liveAck = 0;
  private liveScope?: { roomEpoch: number; connection: number };
  private liveDeliveryFailed = false;
  private liveSourceLost = false;
  private acknowledgements = new Map<string, Extract<Effect, { type: 'giftFx' }>>();
  private roomSessionId = '';
  private chat?: ChatCue;
  private audioEpoch = 0;
  private audioSequence = 0;
  private audioRecords: CueRecord[] = [];
  readonly trace: DomainLog[] = [];
  private readonly observeAudio: boolean;

  constructor(scenario: Scenario | 'live' | 'offline', demoEvents: readonly DemoEvent[] = [], observeAudio = false, liveSeating = false) {
    this.observeAudio = observeAudio;
    this.live = scenario === 'live';
    this.engine = new DemoEngine({ ...timing, maxAvatars: 3, ...(scenario === 'community' ? communityConfig : {}) }, this.live && liveSeating);
    this.events = scenario === 'community' ? communityScript()
      : scenario === 'idle' || scenario === 'offline' || this.live ? [] : commands(scenario === 'capacity');
    if (scenario === 'community' && demoEvents.length) {
      this.events.push(...demoEvents);
      this.events.sort((a, b) => a.atMs - b.atMs);
    }
    if (scenario !== 'offline' && !this.live) this.engine.ingest(session());
    this.observer.accept(this.engine.snapshot());
  }

  presenceFlow(visibleNames: number) {
    const counts = this.engine.presenceFlow;
    if (counts) return presenceFlowKeys.map(key => key === 'visibleNames' ? visibleNames : counts[key]);
  }

  get liveReceipt() {
    return { ack: this.liveAck, failed: this.liveDeliveryFailed };
  }

  enqueueLive(entries: LiveEntry[]) {
    if (!this.live) return false;
    const newEntries = entries.filter(entry => entry.seq > this.liveReceived);
    if (this.liveQueue.length + newEntries.length > liveBatchLimit ||
        newEntries.some((entry, index) => entry.seq !== this.liveReceived + index + 1)) return false;
    this.liveQueue.push(...newEntries);
    this.liveReceived += newEntries.length;
    return true;
  }

  loseLiveSource() {
    this.liveSourceLost = true;
  }

  stagePresence(snapshot: PresenceSnapshot) {
    if (snapshot.revision > Math.max(this.presenceRevision, this.pendingPresence?.revision ?? 0)) this.pendingPresence = snapshot;
  }

  get presenceApplied(): PresenceApplied | undefined {
    const counts = this.engine.presenceCounts;
    if (counts && this.presenceRevision) return { revision: this.presenceRevision, ...counts };
  }

  update(atMs: number, wallMs?: number) {
    if (this.pendingPresence) {
      this.engine.configurePresence(this.pendingPresence.settings);
      this.presenceRevision = this.pendingPresence.revision;
      this.pendingPresence = undefined;
    }
    if (this.observeAudio) this.audioRecords = [];
    for (const { seq, event } of this.liveQueue.splice(0)) {
      this.ingest({ ...event, atMs }, seq, wallMs !== undefined && wallMs - event.atMs > 5000);
      // A rejected final or session-limit cannot be acknowledged or skipped by a later sequence.
      if (!this.liveDeliveryFailed) this.liveAck = seq;
    }
    if (this.liveSourceLost) {
      this.liveSourceLost = false;
      if (this.liveScope) this.ingest({ ...this.liveScope, type: 'session', action: 'disconnect', atMs });
    }
    while (this.cursor < this.events.length && this.events[this.cursor].atMs <= atMs) {
      this.ingest(this.events[this.cursor++]);
    }
    const effects = this.engine.advance(atMs);
    if (effects.length) this.record(atMs, effects);
    const state = this.engine.snapshot();
    this.observer.accept(state);
    const intent = state.focus;
    const actor = this.observer.target(intent);
    const active = intent && this.acknowledgements.get(intent.requestId);
    const overlay = [...this.acknowledgements.values()].findLast(item => !item.dedicatedFocus && atMs - item.atMs < 2000);
    if (this.chat && (!state.connected || atMs - this.chat.atMs >= 2900 ||
        (this.chat.actorId && !state.avatars.some(avatar => avatar.visible &&
          avatar.actorId === this.chat?.actorId && avatar.seatId === this.chat?.seatId)))) this.chat = undefined;
    return { state, actor, active, overlay, chat: this.chat,
      audio: this.observeAudio ? { epoch: this.audioEpoch, records: this.audioRecords } : undefined };
  }

  private ingest(event: DemoEvent | SessionEvent, seq?: number, staleAudio = false) {
    const result = this.engine.ingest(event);
    const flow = this.engine.presenceFlow;
    if (flow && seq !== undefined) {
      flow.ingested++;
      if (result.disposition === 'duplicate') flow.duplicate++;
      else if (result.disposition !== 'accepted') flow.rejected++;
    }
    if (event.type === 'session' && result.disposition === 'accepted') {
      this.chat = undefined;
      this.audioEpoch++;
      if (this.live) {
        this.liveScope = event.action === 'disconnect' ? undefined : {
          roomEpoch: event.roomEpoch, connection: event.connection,
        };
      }
    }
    if (this.live && (result.disposition === 'session-limit' ||
        (event.type === 'gift' && event.phase === 'final' && ['stale', 'invalid'].includes(result.disposition)))) {
      this.liveDeliveryFailed = true;
    }
    const liveGift = seq !== undefined && event.type === 'gift' && event.phase === 'final' && result.disposition === 'accepted'
      ? { seq, roomEpoch: event.roomEpoch, connection: event.connection } : undefined;
    this.record(event.atMs, result.effects, result.disposition, liveGift, staleAudio);
  }

  private record(atMs: number, effects: Effect[], disposition?: string, liveGift?: CueRecord['liveGift'], staleAudio = false) {
    const state = this.engine.snapshot();
    if (state.roomSessionId !== this.roomSessionId) {
      this.acknowledgements.clear();
      this.roomSessionId = state.roomSessionId;
    }
    for (const [key, item] of this.acknowledgements) {
      if (atMs - item.atMs > 90_000) this.acknowledgements.delete(key);
    }
    for (const effect of effects) {
      if (effect.type === 'giftFx') this.acknowledgements.set(effect.requestId, effect);
      if (effect.type === 'chatCue') this.chat = effect;
      if (this.observeAudio && effect.type !== 'chatCue' && effect.type !== 'likeRipple') {
        const seatId = effect.type === 'giftFx' && effect.actorId
          ? state.avatars.find(avatar => avatar.actorId === effect.actorId && avatar.visible)?.seatId : undefined;
        this.audioRecords.push({ effect, seatId, liveGift, ...(staleAudio && { staleAudio }), sequence: ++this.audioSequence, epoch: this.audioEpoch,
          revision: state.revision, room: state.roomSessionId, disposition: disposition ?? 'advance' });
      }
    }
    if (!this.live) this.trace.push({ atMs, state, effects, disposition });
  }
}

export function giftLabel(gift: Extract<Effect, { type: 'giftFx' }>) {
  return gift.confirmation === 'confirmed'
    ? `${gift.giftCount} ${gift.giftId === 'rose' ? 'hoa hồng' : 'quà'}`
    : 'Đang gửi quà';
}
