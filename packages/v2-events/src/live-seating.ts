import { presenceDefaults, waitCapacity, waitTTLms, type PresenceSettings } from './presence.ts';
import { displayName, type AvatarRegistry } from './registry.ts';
import type { DemoViewer } from './protocol.ts';

type Source = 'autoJoinMember' | 'autoJoinChat';
type Waiting = { viewer: DemoViewer; lastSeen: number; sources: Set<Source> };

export class LiveSeating {
  private settings: PresenceSettings = { ...presenceDefaults };
  private readonly queue = new Map<string, Waiting>();
  private dropped = 0;

  get counts() { return { waiting: this.queue.size, dropped: this.dropped }; }
  get ttl() { return this.settings.seatExpiryEnabled ? this.settings.idleSeconds * 1000 : undefined; }

  configure(settings: PresenceSettings) {
    this.settings = { ...settings };
    for (const [key, entry] of this.queue) {
      for (const source of entry.sources) if (!settings[source]) entry.sources.delete(source);
      if (!entry.sources.size) this.queue.delete(key);
    }
  }

  clear() {
    this.queue.clear();
    this.dropped = 0;
  }

  join(registry: AvatarRegistry, viewer: DemoViewer, source: Source, now: number, revision: number) {
    const enabled = this.settings[source];
    const seated = registry.touch(viewer, now, enabled, revision);
    if (seated) this.queue.delete(viewer.userKey);
    else if (enabled) {
      const previous = this.queue.get(viewer.userKey);
      if (previous || this.queue.size < waitCapacity) {
        const sources = previous?.sources ?? new Set<Source>();
        sources.add(source);
        this.queue.set(viewer.userKey, {
          viewer: { userKey: viewer.userKey, name: displayName(viewer.name), avatarUrl: viewer.avatarUrl },
          lastSeen: now, sources,
        });
      } else this.dropped++;
    }
    return seated;
  }

  refill(registry: AvatarRegistry, now: number, revision: number) {
    for (const [key, entry] of this.queue) {
      if (now - entry.lastSeen >= waitTTLms) this.queue.delete(key);
    }
    for (const [key, entry] of this.queue) {
      if (!registry.touch(entry.viewer, entry.lastSeen, true, revision)) break;
      this.queue.delete(key);
    }
  }

  gift(registry: AvatarRegistry, viewer: DemoViewer, now: number, spawn: boolean, revision: number,
    confirmed: boolean, reserved: Set<string>) {
    let seated = registry.touch(viewer, now, spawn, revision);
    if (!seated && confirmed && spawn && registry.evictPassive(reserved)) {
      seated = registry.touch(viewer, now, true, revision);
    }
    if (seated) {
      this.queue.delete(viewer.userKey);
      if (confirmed) registry.markDonor(viewer.userKey);
    }
    return seated;
  }
}
