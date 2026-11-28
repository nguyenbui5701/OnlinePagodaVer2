import { launchWorker } from './transport.mjs';
import { ingressKeys, newIngress } from './ingress.mjs';
import { admissionSettings, admissionTier } from './admission.mjs';

const queueLimit = 256;
const caps = { activity: 192, like: 200, chat: 216, member: 224, giftFinal: queueLimit };
const leaseMs = 15_000;
const counts = () => ({ chat: 0, member: 0, like: 0, giftProgress: 0, giftFinal: 0, room: 0 });
const faults = new Set(['ROOM_OFFLINE', 'ACCESS_DENIED', 'PAID_ROUTE', 'SIGNING_FAILED', 'RATE_LIMITED',
  'NETWORK', 'UNKNOWN', 'INVALID_USERNAME', 'GIFT_UNMAPPED', 'GIFT_DELIVERY_FAILED']);

export class Gateway {
  owner;
  receiver;
  appliedRevision = null;
  overlayReady = false;
  applyPending = false;
  status = 'OFFLINE';
  reason = '';
  deliveryUncertain = false;
  counters = counts();
  viewerCount = 0;
  dropped = 0;
  queue = [];
  roomEpoch = Date.now();
  connection = 0;
  sequence = 0;
  acknowledged = 0;
  offered = 0;
  online = false;
  room;
  seen = new Set();
  stopWorker;
  stopping;
  deadline;
  retry;
  lease;
  generation = 0;
  attempts = 0;
  limited = false;
  priorityAt = new Map();
  admission = admissionSettings();
  likeAt = new Map();
  observed = new Set();
  observedCapped = false;
  ingress = newIngress();
  ingressSnapshot = newIngress();
  ingressReports = 0;
  ingressIncomplete = 0;
  flow = { mapped: 0, dedup: 0, queued: 0, coalesced: 0, pressure: 0, throttled: 0, sessionDrop: 0,
    overflow: 0, invalid: 0, entries: 0, consumed: 0, abandoned: 0 };
  presenceFlow;

  constructor(launch = launchWorker) { this.launch = launch; }

  claim(client, receiver) {
    this.owner = client;
    this.receiver = receiver;
    this.sequence = this.acknowledged = this.offered = 0;
  }

  attach(client, revision) {
    if (!Number.isSafeInteger(revision) || revision < 1) return false;
    if (this.owner) {
      if (this.receiver !== 'overlay' || this.owner !== client || this.appliedRevision !== revision) return false;
    } else {
      this.claim(client, 'overlay');
      this.appliedRevision = revision;
    }
    this.refreshLease();
    return true;
  }

  get canApply() {
    return this.receiver === 'overlay' && !this.online && !this.stopWorker && !this.stopping &&
      !this.retry && !this.queue.length && !this.applyPending;
  }

  statusSnapshot() {
    return {
      status: this.status, reason: this.reason, counters: this.counters, viewerCount: this.viewerCount,
      dropped: this.dropped, deliveryUncertain: this.deliveryUncertain,
      receiver: this.receiver ?? null, appliedRevision: this.appliedRevision, applyPending: this.applyPending,
      overlayReady: this.overlayReady, canApply: this.canApply, canConnect: this.overlayReady && this.canApply && !this.limited,
      canDisconnect: !!(this.online || this.stopWorker || this.retry),
      presenceDiagnostics: { ingress: this.ingress, ingressReports: this.ingressReports,
        ingressIncomplete: this.ingressIncomplete, ...this.flow,
        observed: this.observed.size, observedCapped: this.observedCapped,
        offered: this.offered, acknowledged: this.acknowledged, pending: this.queue.length },
      presenceFlow: this.presenceFlow,
    };
  }

  configurePresence(settings) {
    const next = admissionSettings(settings);
    if (Object.keys(next).every(key => next[key] === this.admission[key])) return;
    this.admission = next;
    this.stopWorker?.configurePresence?.(next);
  }

  connect(client, username, receiver = 'legacy') {
    if (this.limited || this.stopWorker || this.stopping || this.retry || this.applyPending ||
        (this.owner && (this.owner !== client || this.receiver !== receiver)) || this.queue.length ||
        (receiver === 'overlay' && (!this.owner || !this.overlayReady))) return false;
    if (!this.owner) this.claim(client, receiver);
    this.attempts = 0;
    this.refreshLease();
    this.open(username);
    return true;
  }

  open(username) {
    const generation = ++this.generation;
    this.ingressSnapshot = newIngress();
    this.status = this.attempts ? 'RECONNECTING' : 'CONNECTING';
    this.reason = '';
    if (this.stopping) {
      void this.stopping.then(() => { if (this.generation === generation) this.open(username); });
      return;
    }
    try {
      this.stopWorker = this.launch(username, value => {
        if (this.generation !== generation) return;
        if (value?.type === 'connected') this.connected(value.room, username);
        else if (value?.type === 'fault') {
          if (value.ingressIncomplete === true) this.ingressIncomplete++;
          this.fail(faults.has(value.code) ? value.code : 'UNKNOWN', username);
        }
        else if (value?.type === 'ingress') this.recordIngress(value.counts);
        else if (value?.type === 'event') {
          if (this.online) this.accept(value.event, username);
          else this.flow.sessionDrop++;
        }
      }, code => {
        if (this.generation !== generation) return;
        if (code === 2) this.ingressIncomplete++;
        this.fail(code === 2 ? 'GIFT_DELIVERY_FAILED' : 'NETWORK', username);
      }, this.admission);
      this.deadline = setTimeout(() => this.fail('NETWORK', username), 30_000);
      this.deadline.unref();
    } catch {
      this.fail('UNKNOWN', username);
    }
  }

  connected(room, username) {
    if (this.online || typeof room !== 'string' || !/^[1-9][0-9]{0,29}$/.test(room)) {
      this.fail('UNKNOWN', username); return;
    }
    clearTimeout(this.deadline);
    const sameRoom = this.room === room;
    if (!sameRoom) {
      this.room = room;
      this.roomEpoch++;
      this.connection = 0;
      this.counters = counts();
      this.viewerCount = this.dropped = 0;
      this.seen.clear();
      this.priorityAt.clear();
      this.likeAt.clear();
      this.observed.clear();
      this.observedCapped = false;
    }
    if (this.queue.length >= queueLimit) { this.fail('GIFT_DELIVERY_FAILED', username); return; }
    this.connection++;
    this.online = true;
    this.push({ type: 'session', action: sameRoom ? 'reconnect' : 'open' });
    this.status = 'CONNECTED_NO_EVENTS';
  }

  recordIngress(counts) {
    if (!counts || !ingressKeys.every(key => Number.isSafeInteger(counts[key]) && counts[key] >= 0)) return;
    this.ingressReports++;
    for (const key of ingressKeys) this.ingress[key] += counts[key] - this.ingressSnapshot[key];
    this.ingressSnapshot = Object.fromEntries(ingressKeys.map(key => [key, counts[key]]));
  }

  rememberEvent(eventId) {
    if (this.seen.size >= 8192) this.seen.delete(this.seen.values().next().value);
    this.seen.add(eventId);
  }

  accept(event, username) {
    this.flow.mapped++;
    if (!event || typeof event.eventId !== 'string') { this.flow.invalid++; return; }
    if (this.seen.has(event.eventId)) { this.flow.dedup++; return; }
    const kind = event.type === 'gift' ? (event.phase === 'final' ? 'giftFinal' : 'giftProgress') : event.type;
    if (!Object.hasOwn(this.counters, kind)) { this.flow.invalid++; return; }
    this.counters[kind]++;
    if (kind === 'room') this.viewerCount = event.count;
    this.status = 'EVENTS_VERIFIED';
    const key = event.viewer?.userKey;
    if (key && !this.observed.has(key)) {
      if (this.observed.size < 8192) this.observed.add(key);
      else this.observedCapped = true;
    }

    // Reserve progressively for admission sources. Outstanding entries include the offered, unacknowledged prefix.
    const now = Date.now();
    const tier = admissionTier(event, this.admission);
    const identityLike = tier === 'like' && now - (this.likeAt.get(key) ?? 0) >= 3000;
    const interval = kind === 'like' && !identityLike ? 200 : 0;
    if (kind === 'room') {
      const unsent = this.queue.findLast(item => item.seq > this.offered && item.event.type === 'room' &&
        item.event.roomEpoch === this.roomEpoch && item.event.connection === this.connection);
      if (unsent) {
        unsent.event = { ...unsent.event, count: event.count, eventId: event.eventId };
        this.rememberEvent(event.eventId);
        this.flow.coalesced++;
        return;
      }
    }
    const repeatsIdentity = this.queue.length >= caps.activity && tier !== 'activity' &&
      this.queue.some(({ event: pending }) => pending.roomEpoch === this.roomEpoch &&
        pending.connection === this.connection && pending.type === tier && pending.viewer?.userKey === key);
    const priority = repeatsIdentity || (kind === 'like' && !identityLike) ? 'activity' : tier;
    if (kind !== 'giftFinal' && this.queue.length >= caps[priority]) {
      this.flow.pressure++;
      this.dropped++;
      return;
    }
    if (interval && now - (this.priorityAt.get(kind) || 0) < interval) {
      this.flow.throttled++;
      this.dropped++;
      return;
    }
    if (this.queue.length >= caps.giftFinal) { this.flow.overflow++; this.fail('GIFT_DELIVERY_FAILED', username); return; }
    if (interval) this.priorityAt.set(kind, now);
    if (identityLike) {
      if (this.likeAt.size >= 8192 && !this.likeAt.has(key)) this.likeAt.delete(this.likeAt.keys().next().value);
      this.likeAt.set(key, now);
    } else if (kind === 'like' && event.viewer) {
      const { viewer, ...aggregateLike } = event;
      event = aggregateLike;
    }
    this.rememberEvent(event.eventId);
    this.flow.queued++;
    this.push(event);
  }

  push(event) {
    const entry = { seq: ++this.sequence, event: { ...event, atMs: Date.now(), roomEpoch: this.roomEpoch, connection: this.connection } };
    this.queue.push(entry);
    this.flow.entries++;
    if (event.type === 'gift' && event.phase === 'final') this.onVoiceGift?.(entry);
  }

  stop() {
    this.onVoiceReset?.();
    this.generation++;
    clearTimeout(this.deadline);
    clearTimeout(this.retry);
    this.retry = undefined;
    const closing = this.stopWorker?.();
    this.stopWorker = undefined;
    if (closing) {
      this.stopping = closing;
      void closing.then(() => { if (this.stopping === closing) this.stopping = undefined; });
    }
    if (this.online) this.push({ type: 'session', action: 'disconnect' }); // reserved terminal slot
    this.online = false;
  }

  fail(code, username) {
    this.stop();
    this.reason = code;
    if (code === 'NETWORK' && this.attempts < 2) {
      this.status = 'RECONNECTING';
      this.retry = setTimeout(() => this.open(username), 2000 * 2 ** this.attempts++);
      this.retry.unref();
      return;
    }
    if (code === 'RATE_LIMITED') this.limited = true;
    const deliveryFailure = code === 'GIFT_DELIVERY_FAILED' || code === 'GIFT_UNMAPPED';
    this.deliveryUncertain ||= deliveryFailure;
    this.status = code === 'ROOM_OFFLINE' ? 'OFFLINE' : deliveryFailure ? 'DEGRADED' : 'ERROR';
  }

  disconnect(client, degraded = false) {
    if (this.owner !== client) return false;
    this.stop();
    if (degraded) {
      this.status = 'DEGRADED';
      this.reason = 'GIFT_DELIVERY_FAILED';
      this.deliveryUncertain = true;
    } else if (this.status !== 'DEGRADED') {
      this.status = 'OFFLINE';
      this.reason = '';
    }
    return true;
  }

  acknowledge(client, ack) {
    if (this.owner !== client || !Number.isSafeInteger(ack) || ack < this.acknowledged || ack > this.offered) return false;
    this.flow.consumed += ack - this.acknowledged;
    this.acknowledged = ack;
    while (this.queue.length && this.queue[0].seq <= ack) this.queue.shift();
    return true;
  }

  closeViewer(client, ack) {
    if (!this.acknowledge(client, ack)) return false;
    this.release();
    return true;
  }

  poll(client, ack, ready) {
    if (!this.acknowledge(client, ack)) return;
    if (this.receiver === 'overlay') this.overlayReady = ready === true;
    this.refreshLease();
    const entries = this.queue.slice(0, 48);
    this.offered = Math.max(this.offered, entries.at(-1)?.seq ?? ack);
    return { version: '0.2.0', entries, status: this.status, reason: this.reason, counters: this.counters,
      viewerCount: this.viewerCount, dropped: this.dropped, deliveryUncertain: this.deliveryUncertain, applyPending: this.applyPending };
  }

  refreshLease() {
    clearTimeout(this.lease);
    this.lease = setTimeout(() => this.release(), leaseMs);
    this.lease.unref();
  }

  release() {
    clearTimeout(this.lease);
    this.stop();
    this.owner = this.room = this.receiver = undefined;
    this.appliedRevision = null;
    this.audioApplied = undefined;
    this.presenceApplied = undefined;
    this.presenceFlow = undefined;
    this.observed.clear();
    this.observedCapped = false;
    this.likeAt.clear();
    this.worldApplied = undefined;
    this.overlayReady = false;
    this.applyPending = false;
    this.deliveryUncertain ||= this.queue.some(({ event }) => event.type === 'gift' && event.phase === 'final');
    this.flow.abandoned += this.queue.length;
    this.queue.length = 0;
    this.counters = counts();
    this.viewerCount = this.dropped = 0;
    this.seen.clear();
    this.status = 'OFFLINE';
    this.reason = '';
  }
}
