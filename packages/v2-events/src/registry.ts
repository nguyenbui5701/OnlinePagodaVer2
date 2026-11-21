import type { AvatarPresentation, DemoViewer } from './protocol.ts';

const segmenter = new Intl.Segmenter('vi', { granularity: 'grapheme' });

export function displayName(name: string): string {
  const clean = name.slice(0, 512).normalize('NFC')
    .replace(/[\p{Cc}\p{Bidi_Control}<>]/gu, '').replace(/\s+/gu, ' ').trim();
  let result = '';
  let length = 0;
  for (const { segment } of segmenter.segment(clean)) {
    if (length++ === 28) break;
    result += segment;
  }
  return result || 'Khách DEMO';
}

function avatarUrl(input?: string): string | undefined {
  if (typeof input !== 'string' || input.length > 2048) return;
  try {
    const url = new URL(input);
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
  } catch {
    // Missing or malformed photos use the renderer's neutral material.
  }
}

export class SeatRegistry {
  private readonly ids: string[];
  private readonly occupied = new Set<string>();

  constructor(capacity: number) {
    this.ids = Array.from({ length: capacity }, (_, i) => `seat-${i + 1}`);
  }

  take(): string | undefined {
    const id = this.ids.find(id => !this.occupied.has(id));
    if (id) this.occupied.add(id);
    return id;
  }

  release(id: string): void {
    this.occupied.delete(id);
  }
}

type Actor = { view: AvatarPresentation; lastSeen: number };

export class AvatarRegistry {
  private readonly actors = new Map<string, Actor>();
  private readonly seats: SeatRegistry;
  private sequence = 0;
  private readonly room: string;

  constructor(room: string, capacity: number) {
    this.room = room;
    this.seats = new SeatRegistry(capacity);
  }

  touch(viewer: DemoViewer, now: number, spawn: boolean, revision: number): AvatarPresentation | undefined {
    let actor = this.actors.get(viewer.userKey);
    if (!actor) {
      if (!spawn) return;
      const seatId = this.seats.take();
      if (!seatId) return;
      actor = {
        view: {
          actorId: `${this.room}-actor-${++this.sequence}`, seatId, visible: true, revision,
          displayName: '', appearanceVariant: 'meditator_base',
        },
        lastSeen: now,
      };
      this.actors.set(viewer.userKey, actor);
    }
    actor.lastSeen = now;
    actor.view.displayName = displayName(viewer.name);
    actor.view.avatarUrl = avatarUrl(viewer.avatarUrl);
    actor.view.revision = revision;
    return { ...actor.view };
  }

  expire(now: number, ttl: number, reserved: Set<string>): void {
    for (const [user, { view, lastSeen }] of this.actors) {
      if (lastSeen + ttl > now || reserved.has(view.actorId)) continue;
      this.actors.delete(user);
      this.seats.release(view.seatId);
    }
  }

  contains(actorId: string): boolean {
    return [...this.actors.values()].some(({ view }) => view.actorId === actorId && view.visible);
  }

  snapshot(): AvatarPresentation[] {
    return [...this.actors.values()].map(({ view }) => ({ ...view }));
  }
}
