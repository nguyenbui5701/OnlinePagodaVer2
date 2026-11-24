import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spokenAlias } from '../../apps/v2-viewer/src/audio/live-alias.ts';
import { decodeNamedPcm } from '../../apps/v2-viewer/src/audio/named-voice.ts';
import { warmSynthesizer } from '../v2-voice/process.mjs';

const script = fileURLToPath(new URL('../v2-voice/synthesize-live.py', import.meta.url));
const failure = new Set(['service-unreachable', 'service-http-failure', 'service-rate-limited', 'service-forbidden', 'dependency-unavailable', 'python-unavailable']);
const cacheTTL = 15 * 60_000;
export const createLiveVoice = () => new LiveVoice(process.env.V2_LIVE_GTTS_ENABLED === '1'
  ? () => warmSynthesizer(script, { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }) : undefined);

export class LiveVoice {
  receipts = new Map();
  cache = new Map();
  bytes = 0;
  recent = [];
  queue = [];
  active;
  scope = new AbortController();
  provider;
  cooldown = 0;
  succeeded = false;

  constructor(start, clock = Date.now) { this.start = start; this.clock = clock; }

  status(settings) {
    if (!settings.namedEnabled) return 'OFF';
    if (!this.start || this.cooldown > this.clock()) return 'UNAVAILABLE';
    if (!settings.master.enabled || !settings.giftThanks.enabled) return 'STANDBY';
    return this.succeeded ? 'READY' : 'PENDING';
  }

  update(settings) {
    if (this.start && settings.master.enabled && settings.giftThanks.enabled && settings.namedEnabled) {
      if (this.cooldown <= this.clock()) this.provider ??= this.start();
    } else if (this.provider || this.receipts.size || this.cache.size) {
      this.reset();
    }
  }

  remember(entry, settings) {
    if (!this.start || !settings.master.enabled || !settings.giftThanks.enabled || !settings.namedEnabled) return;
    const event = entry.event;
    const alias = spokenAlias(event.viewer?.name);
    if (!alias || !Number.isInteger(event.count) || event.count < 1 || event.count > 9999 ||
        typeof event.viewer?.userKey !== 'string') return;
    while (this.receipts.size >= 128) this.receipts.delete(this.receipts.keys().next().value);
    this.receipts.set(entry.seq, { alias, count: event.count, actor: event.viewer.userKey, giftId: event.giftId,
      group: event.streakId, roomEpoch: event.roomEpoch, connection: event.connection, until: this.clock() + 20_000 });
  }

  reset() {
    this.scope.abort();
    this.scope = new AbortController();
    this.receipts.clear();
    this.cache.clear();
    this.bytes = 0;
    this.recent.length = 0;
    this.provider?.close();
    this.provider = undefined;
    this.succeeded = false;
  }

  async request(gateway, settings, data, clientSignal) {
    if (!this.start || !settings.master.enabled || !settings.giftThanks.enabled || !settings.namedEnabled ||
        this.cooldown > this.clock()) throw new Error('unavailable');
    if (gateway.receiver !== 'overlay' || gateway.owner !== data.client || !gateway.online || !gateway.overlayReady ||
        !['READY', 'PLAYING'].includes(gateway.audioApplied?.state)) throw new Error('session');
    const row = this.receipts.get(data.seq);
    if (!row || row.used || row.until <= this.clock() || data.seq > gateway.offered ||
        row.roomEpoch !== gateway.roomEpoch || row.connection !== gateway.connection ||
        row.roomEpoch !== data.roomEpoch || row.connection !== data.connection ||
        row.alias !== data.alias || row.count !== data.count) throw new Error('receipt');
    row.used = true;
    if (this.active && this.queue.length >= 4) throw new Error('busy');
    const countAllowed = row.count >= 2 && row.count <= 8;
    let template = 0;
    if (settings.namedVariety !== false) {
      const choices = Array.from({ length: countAllowed ? 10 : 9 }, (_, i) => i).filter(i => !this.recent.includes(i));
      template = choices[(Number(data.seq) + Number(data.roomEpoch % 11)) % choices.length];
      this.recent.push(template);
      if (this.recent.length > 5) this.recent.shift();
    }
    const key = createHash('sha256').update(JSON.stringify(
      [row.roomEpoch, row.connection, row.actor, row.alias, template, row.giftId, row.count, 'gtts-2.5.4-vi-v1']
    )).digest('hex');
    const signal = AbortSignal.any([clientSignal, this.scope.signal, AbortSignal.timeout(8000)]);
    const cached = this.cache.get(key);
    if (cached) {
      this.cache.delete(key);
      if (cached.until > this.clock()) {
        this.cache.set(key, cached);
        signal.throwIfAborted();
        return { audio: cached.audio, mode: 'cache', template };
      }
      this.bytes -= cached.audio.length;
    }
    return new Promise((resolve, reject) => {
      const remove = () => {
        const index = this.queue.indexOf(job);
        if (index >= 0) this.queue.splice(index, 1);
        reject(new Error('cancelled'));
      };
      const job = { key, template, row, signal, resolve, reject, remove };
      signal.addEventListener('abort', remove, { once: true });
      if (signal.aborted) { remove(); return; }
      this.queue.push(job);
      this.next();
    });
  }

  next() {
    if (this.active || !this.queue.length) return;
    const job = this.queue.shift();
    this.active = job;
    void this.run(job).then(job.resolve, job.reject).finally(() => {
      job.signal.removeEventListener('abort', job.remove);
      this.active = undefined;
      this.next();
    });
  }

  async run(job) {
    job.signal.throwIfAborted();
    if (this.cooldown > this.clock()) throw new Error('unavailable');
    const cold = !this.succeeded;
    this.provider ??= this.start();
    try {
      const audio = await this.provider.run({ alias: job.row.alias, template: job.template, count: job.row.count }, job.signal);
      job.signal.throwIfAborted();
      decodeNamedPcm(audio);
      this.succeeded = true;
      while (this.cache.size && (this.cache.size >= 32 || this.bytes + audio.length > 8 * 1024 * 1024)) {
        const key = this.cache.keys().next().value;
        this.bytes -= this.cache.get(key).audio.length;
        this.cache.delete(key);
      }
      const previous = this.cache.get(job.key);
      if (previous) this.bytes -= previous.audio.length;
      this.cache.set(job.key, { audio, until: this.clock() + cacheTTL });
      this.bytes += audio.length;
      return { audio, mode: cold ? 'cold' : 'warm', template: job.template };
    } catch (error) {
      if (!job.signal.aborted && failure.has(error.message)) {
        this.cooldown = this.clock() + 60_000;
        this.provider?.close();
        this.provider = undefined;
      }
      throw error;
    }
  }
}
