import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { demoEnabled, synthesize } from './process.mjs';

export const maxBytes = 192000;
const allowedNames = new Set(['an', 'binh', 'chi', 'duyen']);
const allowedGifts = new Set(['rose', 'lantern']);
const ttl = 15 * 60 * 1000;
const stopOnFailure = new Set(['service-unreachable', 'service-http-failure',
  'python-unavailable', 'dependency-unavailable', 'disabled']);

function templateOf(json) {
  if (!json || typeof json !== 'object' || Object.keys(json).length !== 3 ||
      !allowedNames.has(json.nameId) || !allowedGifts.has(json.gift) ||
      !Number.isInteger(json.count) || json.count < 1 || json.count > 8) return;
  return { nameId: json.nameId, gift: json.gift, count: json.count };
}

class SynthesisQueue {
  active = 0;
  pending = [];
  cache = new Map();
  bytes = 0;

  constructor(run, clock) { this.run = run; this.clock = clock; }

  get(template, signal) {
    const key = JSON.stringify(template);
    const found = this.cache.get(key);
    if (found) {
      this.cache.delete(key);
      if (found.until > this.clock()) {
        this.cache.set(key, found);
        return Promise.resolve(found.audio);
      }
      this.bytes -= found.audio.length;
    }
    if (this.active && this.pending.length >= 4) return Promise.reject(new Error('busy'));
    return new Promise((resolve, reject) => {
      if (signal.aborted) { reject(new Error('aborted')); return; }
      const remove = () => {
        const index = this.pending.indexOf(job);
        if (index >= 0) this.pending.splice(index, 1);
        reject(new Error('aborted'));
      };
      const job = { key, template, signal, resolve, reject, remove };
      signal.addEventListener('abort', remove, { once: true });
      this.pending.push(job);
      this.next();
    });
  }

  next() {
    if (this.active || !this.pending.length) return;
    const job = this.pending.shift();
    const cached = this.cache.get(job.key);
    this.active = 1;
    const signal = AbortSignal.any([job.signal, AbortSignal.timeout(8_000)]);
    void Promise.resolve().then(() => cached?.until > this.clock() ? cached.audio :
      this.run(job.template, signal)).then(audio => {
      signal.throwIfAborted();
      if (!Buffer.isBuffer(audio) || audio.length < 4800 || audio.length > maxBytes || audio.length % 2) throw new Error('pcm');
      let peak = 0;
      for (let offset = 0; offset < audio.length; offset += 2) peak = Math.max(peak, Math.abs(audio.readInt16LE(offset)));
      if (peak < 328 || peak >= 32767) throw new Error('pcm');
      const previous = this.cache.get(job.key);
      if (previous) this.bytes -= previous.audio.length;
      this.cache.delete(job.key);
      while (this.cache.size >= 32 || this.bytes + audio.length > 8 * 1024 * 1024) {
        const key = this.cache.keys().next().value;
        this.bytes -= this.cache.get(key).audio.length;
        this.cache.delete(key);
      }
      this.cache.set(job.key, { audio, until: cached?.audio === audio ? cached.until : this.clock() + ttl });
      this.bytes += audio.length;
      job.resolve(audio);
    }).catch(job.reject).finally(() => {
      job.signal.removeEventListener('abort', job.remove);
      this.active = 0;
      this.next();
    });
  }
}

export function createVoiceServer({ token, run, diagnostic = () => {}, clock = Date.now, origin = 'http://127.0.0.1:5189' }) {
  if (!/^[0-9a-f]{64}$/.test(token ?? '')) throw new Error('An ephemeral 32-byte hexadecimal token is required.');
  const auth = Buffer.from('Bearer ' + token);
  if (!/^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/.test(origin)) throw new Error('Viewer origin must be IPv4 loopback.');
  let stopped = false;
  const queue = run && new SynthesisQueue(async (template, signal) => {
    if (stopped) throw new Error('service-stopped');
    try {
      return await run(template, signal);
    } catch (error) {
      if (stopOnFailure.has(error.message)) {
        stopped = true;
        diagnostic(error.message);
      }
      throw error;
    }
  }, clock);
  let windowStart = clock();
  let requests = 0;
  return createServer({ headersTimeout: 4000, requestTimeout: 4000, connectionsCheckingInterval: 1000 }, async (req, res) => {
    const reply = code => { res.writeHead(code); res.end(); };
    res.setHeader('Cache-Control', 'no-store');
    if (req.socket.localAddress !== '127.0.0.1' || req.headers.host !== '127.0.0.1:' + req.socket.localPort ||
        req.headers.origin !== origin) return reply(403);
    if (req.url !== '/demo-voice') return reply(404);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    if (req.method === 'OPTIONS') {
      const names = String(req.headers['access-control-request-headers'] ?? '').toLowerCase().split(',').map(value => value.trim());
      if (req.headers['access-control-request-method'] !== 'POST' ||
          names.some(name => name !== 'authorization' && name !== 'content-type')) return reply(403);
      res.setHeader('Access-Control-Allow-Methods', 'POST');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      return reply(204);
    }
    if (req.method !== 'POST') return reply(405);
    const supplied = Buffer.from(req.headers.authorization ?? '');
    if (supplied.length !== auth.length || !timingSafeEqual(supplied, auth)) return reply(401);
    if (req.headers['content-type'] !== 'application/json') return reply(415);
    const expected = Number(req.headers['content-length']);
    if (!Number.isInteger(expected) || expected < 2 || expected > 256) return reply(413);
    if (clock() - windowStart >= 60_000) { windowStart = clock(); requests = 0; }
    if (++requests > 30) return reply(429);
    const body = [];
    let size = 0;
    try {
      for await (const chunk of req) {
        size += chunk.length;
        if (size > expected || size > 256) return reply(413);
        body.push(chunk);
      }
    } catch { return; }
    let template;
    try { if (size === expected) template = templateOf(JSON.parse(Buffer.concat(body))); } catch {}
    if (!template) return reply(400);
    if (!queue) return reply(503);
    if (stopped) return reply(502);
    const controller = new AbortController();
    res.once('close', () => controller.abort());
    try {
      const audio = await queue.get(template, controller.signal);
      if (!res.destroyed) {
        res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': audio.length });
        res.end(audio);
      }
    } catch (error) {
      if (!res.destroyed) reply(error.message === 'busy' ? 429 : 502);
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const enabled = demoEnabled();
  createVoiceServer({ token: process.env.V2_TTS_TOKEN, run: enabled ? synthesize : undefined,
    diagnostic: code => console.error('Local DEMO voice stopped:', code) })
    .listen(5202, '127.0.0.1', () => console.log('Local DEMO voice worker:', enabled ? 'GTTS_ENABLED' : 'GTTS_OFF'));
}
