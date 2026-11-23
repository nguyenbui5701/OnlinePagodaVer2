import { DemoEngine, protocolVersion, type DemoEvent, type Effect, type FocusIntent, type Snapshot } from '../../../packages/v2-events/src/engine.ts';
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
  readonly trace: DomainLog[] = [];

  constructor(scenario: Scenario) {
    this.engine = new DemoEngine({ ...timing, maxAvatars: 3, ...(scenario === 'community' ? communityConfig : {}) });
    this.events = scenario === 'community' ? communityScript()
      : scenario === 'idle' ? [] : commands(scenario === 'capacity');
    this.engine.ingest(session());
    this.observer.accept(this.engine.snapshot());
  }

  update(atMs: number) {
    while (this.cursor < this.events.length && this.events[this.cursor].atMs <= atMs) {
      const event = this.events[this.cursor++];
      const result = this.engine.ingest(event);
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
    return { state, actor, active, overlay };
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
    for (const effect of effects) if (effect.type === 'giftFx') this.acknowledgements.set(effect.requestId, effect);
    this.trace.push({ atMs, state, effects, disposition });
  }
}

export function giftLabel(gift: Extract<Effect, { type: 'giftFx' }>) {
  return gift.confirmation === 'confirmed'
    ? `${gift.giftCount} ${gift.giftId === 'rose' ? 'hoa hồng' : 'quà'}`
    : 'Đang gửi quà';
}
