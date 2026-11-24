import type { CueRecord } from './audio/director.ts';
import { DemoEngine, protocolVersion, type ChatCue, type DemoEvent, type Effect, type FocusIntent, type Snapshot } from '../../../packages/v2-events/src/engine.ts';
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
  private readonly observer = new SceneObserver();
  private readonly events: (DemoEvent | ReturnType<typeof session>)[];
  private cursor = 0;
  private acknowledgements = new Map<string, Extract<Effect, { type: 'giftFx' }>>();
  private roomSessionId = '';
  private chat?: ChatCue;
  private audioEpoch = 0;
  private audioSequence = 0;
  private audioRecords: CueRecord[] = [];
  readonly trace: DomainLog[] = [];
  private readonly observeAudio: boolean;

  constructor(scenario: Scenario | 'offline', demoEvents: readonly DemoEvent[] = [], observeAudio = false) {
    this.observeAudio = observeAudio;
    this.engine = new DemoEngine({ ...timing, maxAvatars: 3, ...(scenario === 'community' ? communityConfig : {}) });
    this.events = scenario === 'community' ? communityScript()
      : scenario === 'idle' || scenario === 'offline' ? [] : commands(scenario === 'capacity');
    if (scenario === 'community' && demoEvents.length) {
      this.events.push(...demoEvents);
      this.events.sort((a, b) => a.atMs - b.atMs);
    }
    if (scenario !== 'offline') this.engine.ingest(session());
    this.observer.accept(this.engine.snapshot());
  }

  update(atMs: number) {
    if (this.observeAudio) this.audioRecords = [];
    while (this.cursor < this.events.length && this.events[this.cursor].atMs <= atMs) {
      const event = this.events[this.cursor++];
      const result = this.engine.ingest(event);
      if (event.type === 'session' && result.disposition === 'accepted') {
        this.chat = undefined;
        this.audioEpoch++;
      }
      this.record(event.atMs, result.effects, result.disposition);
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

  private record(atMs: number, effects: Effect[], disposition?: string) {
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
        this.audioRecords.push({ effect, seatId, sequence: ++this.audioSequence, epoch: this.audioEpoch,
          revision: state.revision, room: state.roomSessionId, disposition: disposition ?? 'advance' });
      }
    }
    this.trace.push({ atMs, state, effects, disposition });
  }
}

export function giftLabel(gift: Extract<Effect, { type: 'giftFx' }>) {
  return gift.confirmation === 'confirmed'
    ? `${gift.giftCount} ${gift.giftId === 'rose' ? 'hoa hồng' : 'quà'}`
    : 'Đang gửi quà';
}
