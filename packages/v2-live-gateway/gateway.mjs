import { launchWorker } from './transport.mjs';

const queueLimit = 256;
const lowPriorityLimit = queueLimit - 32;
const leaseMs = 15_000;
const counts = () => ({ chat: 0, member: 0, like: 0, giftProgress: 0, giftFinal: 0, room: 0 });
const faults = new Set(['ROOM_OFFLINE', 'ACCESS_DENIED', 'PAID_ROUTE', 'SIGNING_FAILED', 'RATE_LIMITED',
  'NETWORK', 'UNKNOWN', 'INVALID_USERNAME', 'GIFT_UNMAPPED', 'GIFT_DELIVERY_FAILED']);

export class Gateway {
  owner;
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

  constructor(launch = launchWorker) { this.launch = launch; }

  connect(client, username) {
    if (this.limited || this.stopWorker || this.stopping || this.retry || (this.owner && this.owner !== client) || this.queue.length) return false;
    if (!this.owner) {
      this.owner = client;
      this.sequence = this.acknowledged = this.offered = 0;
    }
    this.attempts = 0;
    this.refreshLease();
    this.open(username);
    return true;
  }

  open(username) {
    const generation = ++this.generation;
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
        else if (value?.type === 'fault') this.fail(faults.has(value.code) ? value.code : 'UNKNOWN', username);
        else if (value?.type === 'event' && this.online) this.accept(value.event, username);
      }, code => {
        if (this.generation === generation) this.fail(code === 2 ? 'GIFT_DELIVERY_FAILED' : 'NETWORK', username);
      });
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
    }
    if (this.queue.length >= queueLimit) { this.fail('GIFT_DELIVERY_FAILED', username); return; }
    this.connection++;
    this.online = true;
    this.push({ type: 'session', action: sameRoom ? 'reconnect' : 'open' });
    this.status = 'CONNECTED_NO_EVENTS';
  }

  accept(event, username) {
    if (!event || typeof event.eventId !== 'string' || this.seen.has(event.eventId)) return;
    const kind = event.type === 'gift' ? (event.phase === 'final' ? 'giftFinal' : 'giftProgress') : event.type;
    if (!Object.hasOwn(this.counters, kind)) return;
    this.counters[kind]++;
    if (kind === 'room') this.viewerCount = event.count;
    this.status = 'EVENTS_VERIFIED';
    if (this.seen.size >= 8192) this.seen.delete(this.seen.values().next().value);
    this.seen.add(event.eventId);

    // Reserve capacity for confirmed gifts and session transitions when chat/like bursts arrive.
    const now = Date.now();
    const interval = kind === 'like' ? 200 : 0;
    if (kind === 'room') {
      const unsent = this.queue.findLast(item => item.seq > this.offered && item.event.type === 'room' &&
        item.event.roomEpoch === this.roomEpoch && item.event.connection === this.connection);
      if (unsent) {
        unsent.event = { ...unsent.event, count: event.count, eventId: event.eventId };
        return;
      }
    }
    if (kind !== 'giftFinal' && (this.queue.length >= lowPriorityLimit ||
        (interval && now - (this.priorityAt.get(kind) || 0) < interval))) { this.dropped++; return; }
    if (this.queue.length >= queueLimit) { this.fail('GIFT_DELIVERY_FAILED', username); return; }
    if (interval) this.priorityAt.set(kind, now);
    this.push(event);
  }

  push(event) {
    this.queue.push({ seq: ++this.sequence, event: { ...event, atMs: Date.now(), roomEpoch: this.roomEpoch, connection: this.connection } });
  }

  stop() {
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
    this.acknowledged = ack;
    while (this.queue.length && this.queue[0].seq <= ack) this.queue.shift();
    return true;
  }

  closeViewer(client, ack) {
    if (!this.acknowledge(client, ack)) return false;
    this.release();
    return true;
  }

  poll(client, ack) {
    if (!this.acknowledge(client, ack)) return;
    this.refreshLease();
    const entries = this.queue.slice(0, 48);
    this.offered = Math.max(this.offered, entries.at(-1)?.seq ?? ack);
    return { version: '0.2.0', entries, status: this.status, reason: this.reason, counters: this.counters,
      viewerCount: this.viewerCount, dropped: this.dropped, deliveryUncertain: this.deliveryUncertain };
  }

  refreshLease() {
    clearTimeout(this.lease);
    this.lease = setTimeout(() => this.release(), leaseMs);
    this.lease.unref();
  }

  release() {
    clearTimeout(this.lease);
    this.stop();
    this.owner = this.room = undefined;
    this.deliveryUncertain ||= this.queue.some(({ event }) => event.type === 'gift' && event.phase === 'final');
    this.queue.length = 0;
    this.counters = counts();
    this.viewerCount = this.dropped = 0;
    this.seen.clear();
    this.status = 'OFFLINE';
    this.reason = '';
  }
}