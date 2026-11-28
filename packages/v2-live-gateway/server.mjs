import { createLiveVoice } from './live-voice.mjs';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { Gateway } from './gateway.mjs';
import { normalizeUsername } from './mapper.mjs';
import { validWorldApplied } from '../../apps/v2-viewer/src/live-settings.ts';
import { validPresenceApplied, validPresenceFlow } from '../v2-events/src/presence.ts';
import { AudioSettingsStore, PresenceSettingsStore, SettingsStore } from './settings.mjs';
import { validAudioApplied } from '../../apps/v2-viewer/src/live-audio-settings.ts';

const viewerOrigin = 'http://127.0.0.1:5189';
const hex = value => typeof value === 'string' && /^[a-f0-9]{32}$/.test(value);
const natural = n => Number.isSafeInteger(n) && n >= 0;
const receiverRoutes = new Set(['/attach', '/connect', '/poll', '/disconnect', '/degraded', '/named-voice']);
const operatorRoutes = new Set(['/status', '/settings', '/save-settings', '/save-audio', '/patch-audio', '/mute-audio', '/patch-presence', '/operate', '/apply']);

export function createGatewayServer({ gateway = new Gateway(), settings = new SettingsStore(), audio = new AudioSettingsStore(), presence = new PresenceSettingsStore(), voice = createLiveVoice(), clock = Date.now } = {}) {
  gateway.likeAdmission = presence.snapshot.settings.autoJoinLike;
  gateway.onVoiceGift = entry => voice.remember(entry, audio.snapshot.settings);
  gateway.onVoiceReset = () => voice.reset();
  let starts = 0;
  let voiceRequests = 0;
  let windowStart = clock();
  let requests = 0;
  let operatorRequests = 0;
  let muteRequests = 0;
  let audioWrites = 0;
  return createServer({ headersTimeout: 4000, requestTimeout: 4000, connectionsCheckingInterval: 1000 },
    async (req, res) => {
      const reply = (status, body) => {
        res.writeHead(status, body ? { 'Content-Type': 'application/json' } : {});
        res.end(body ? JSON.stringify(body) : undefined);
      };
      res.setHeader('Cache-Control', 'no-store');
      if (req.socket.localAddress !== '127.0.0.1' || req.socket.remoteAddress !== '127.0.0.1' ||
          req.headers.host !== '127.0.0.1:' + req.socket.localPort || req.headers.origin !== viewerOrigin) return reply(403);
      const operator = operatorRoutes.has(req.url);
      if (!operator && !receiverRoutes.has(req.url)) return reply(404);
      res.setHeader('Access-Control-Allow-Origin', viewerOrigin);
      res.setHeader('Vary', 'Origin');
      if (req.method === 'OPTIONS') {
        const headers = String(req.headers['access-control-request-headers'] ?? '').toLowerCase().split(',').map(x => x.trim());
        if (req.headers['access-control-request-method'] !== 'POST' || headers.some(x => x !== 'content-type')) return reply(403);
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return reply(204);
      }
      if (req.method !== 'POST') return reply(405);

      if (req.headers['content-type'] !== 'application/json') return reply(415);
      const size = Number(req.headers['content-length']);
      if (!Number.isInteger(size) || size < 2 || size > (['/save-settings', '/save-audio', '/patch-audio'].includes(req.url) ? 1024 : req.url === '/poll' ? 768 : 256)) return reply(413);
      const rateLimit = () => reply(429, { reason: 'LOCAL_RATE_LIMITED' });
      if (clock() - windowStart >= 60_000) { starts = requests = operatorRequests = audioWrites = muteRequests = voiceRequests = 0; windowStart = clock(); }
      if (req.url === '/named-voice') {
        if (++voiceRequests > 48) return rateLimit();
      } else if (req.url === '/mute-audio') {
        if (++muteRequests > 30) return rateLimit();
      } else if (req.url === '/patch-audio') {
        if (++audioWrites > 90) return rateLimit();
      } else if (operator ? ++operatorRequests > 75 : ++requests > 275) return rateLimit();
      let data;
      try {
        const chunks = [];
        let received = 0;
        for await (const chunk of req) {
          received += chunk.length;
          if (received > size) return reply(413);
          chunks.push(chunk);
        }
        if (received !== size) return reply(400);
        data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch { return reply(400); }
      if (!data || typeof data !== 'object' || Array.isArray(data)) return reply(400);
      const fields = Object.keys(data).length;
      const conflict = reason => reply(409, { reason });
      if (operator) {
        if (req.url === '/status' && fields === 0) return reply(200, {
          ...gateway.statusSnapshot(), desired: settings.snapshot, audioDesired: audio.desired, audioApplied: gateway.audioApplied ?? null,
          namedProvider: voice.status(audio.snapshot.settings),
          presenceDesired: presence.snapshot, presenceApplied: gateway.presenceApplied ?? null, world: gateway.worldApplied ?? null,
        });
        if (req.url === '/mute-audio' && fields === 0) {
          const muted = audio.mute();
          voice.update(muted.settings);
          return reply(200, muted);
        }
        if (req.url === '/patch-audio' && fields === 3 && natural(data.revision) && typeof data.fence === 'string') {
          const error = audio.patch(data.revision, data.fence, data.patch);
          if (error === 'SETTINGS_CONFLICT' || error === 'STALE_ENABLE') return reply(409, { reason: error, audio: audio.desired });
          if (error) return reply(error === 'INVALID_SETTINGS' ? 400 : 500, { reason: error });
          voice.update(audio.snapshot.settings);
          return reply(200, audio.desired);
        }
        if (req.url === '/patch-presence' && fields === 2 && natural(data.revision)) {
          const error = presence.patch(data.revision, data.patch);
          if (error === 'SETTINGS_CONFLICT') return reply(409, { reason: error, presence: presence.snapshot });
          if (error) return reply(error === 'INVALID_SETTINGS' ? 400 : 500, { reason: error });
          gateway.likeAdmission = presence.snapshot.settings.autoJoinLike;
          return reply(200, presence.snapshot);
        }
        if (req.url === '/settings' && fields === 0) return reply(200, settings.snapshot);
        if (['/save-settings', '/save-audio'].includes(req.url) && fields === 2 && natural(data.revision)) {
          const store = req.url === '/save-audio' ? audio : settings;
          if (store === audio && audio.priorityUsed && data.settings?.master?.enabled === true) return conflict('STALE_ENABLE');
          const error = store.save(data.revision, data.settings);
          if (error === 'SETTINGS_CONFLICT') return conflict(error);
          if (error) return reply(error === 'INVALID_SETTINGS' ? 400 : 500, { reason: error });
          if (store === audio) voice.update(audio.snapshot.settings);
          return reply(200, store.snapshot);
        }
        if (req.url === '/apply' && fields === 1 && natural(data.revision)) {
          if (gateway.receiver !== 'overlay') return conflict('OVERLAY_NOT_READY');
          if (data.revision !== settings.snapshot.revision) return conflict('SETTINGS_CONFLICT');
          if (!gateway.canApply) return conflict('APPLY_BLOCKED');
          if (gateway.appliedRevision !== data.revision) gateway.applyPending = true;
          return reply(204);
        }
        if (req.url === '/operate') {
          if (data.action === 'disconnect' && fields === 1) {
            if (gateway.receiver !== 'overlay') return conflict('OVERLAY_NOT_READY');
            return reply(gateway.disconnect(gateway.owner) ? 204 : 409);
          }
          const username = normalizeUsername(data.username);
          if (data.action === 'connect' && fields === 2 && username) {
            if (!gateway.overlayReady) return conflict('OVERLAY_NOT_READY');
            if (++starts > 4) return rateLimit();
            if (gateway.limited) return reply(429, { reason: 'RATE_LIMITED' });
            return gateway.connect(gateway.owner, username, 'overlay') ? reply(204) : conflict('SOURCE_BUSY');
          }
        }
        return reply(400);
      }
      if (!hex(data.client)) return reply(400);
      if (req.url === '/named-voice') {
        if (fields !== 6 || !natural(data.seq) || !natural(data.roomEpoch) || !natural(data.connection) ||
            !natural(data.count) || typeof data.alias !== 'string' || data.alias.length > 24) return reply(400);
        const controller = new AbortController();
        res.once('close', () => controller.abort());
        const started = performance.now();
        try {
          const result = await voice.request(gateway, audio.snapshot.settings, data, controller.signal);
          if (!res.destroyed) {
            res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': result.audio.length,
              'Server-Timing': result.mode + ';dur=' + (performance.now() - started).toFixed(1) + ', template;desc="' + result.template + '"' });
            res.end(result.audio);
          }
        } catch (error) {
          const codes = { 'service-rate-limited': 'GTTS_HTTP_429', 'service-forbidden': 'GTTS_HTTP_403',
            'service-unreachable': 'GTTS_SERVICE_UNREACHABLE', 'service-http-failure': 'GTTS_SERVICE_HTTP_FAILURE',
            'dependency-unavailable': 'GTTS_DEPENDENCY_UNAVAILABLE', 'python-unavailable': 'GTTS_PYTHON_UNAVAILABLE' };
          if (!res.destroyed) return reply(error.message === 'busy' ? 429 :
            ['session', 'receipt'].includes(error.message) ? 409 : 503, { reason: codes[error.message] ?? 'NAMED_VOICE_UNAVAILABLE' });
        }
        return;
      }
      if (req.url === '/attach') {
        if (fields !== 2 || !natural(data.revision) || data.revision < 1 || data.revision > settings.snapshot.revision) return reply(400);
        return gateway.attach(data.client, data.revision) ? reply(204) : conflict('RECEIVER_BUSY');
      }
      if (req.url === '/connect') {
        if (++starts > 4) return rateLimit();
        const username = normalizeUsername(data.username);
        if (!username || Object.keys(data).length !== 2) return reply(400);
        if (gateway.limited) return reply(429, { reason: 'RATE_LIMITED' });
        return reply(gateway.connect(data.client, username) ? 204 : 409);
      }
      if (req.url === '/poll') {
        const hasReadiness = typeof data.ready === 'boolean';
        const hasAudio = Object.hasOwn(data, 'audio');
        const hasPresence = Object.hasOwn(data, 'presence');
        const hasFlow = Object.hasOwn(data, 'flow');
        const hasWorld = Object.hasOwn(data, 'world');
        if (!natural(data.ack) || fields !== (hasReadiness ? 3 : 2) + Number(hasAudio) + Number(hasPresence) + Number(hasWorld) + Number(hasFlow) ||
            ((hasAudio || hasPresence || hasWorld || hasFlow) && !hasReadiness)) return reply(400);
        if (gateway.owner === data.client && (gateway.receiver === 'overlay') !== hasReadiness) return reply(400);
        const state = gateway.poll(data.client, data.ack, data.ready);
        if (!state) return reply(409);
        if (!hasReadiness) return reply(200, state);
        // An invalid or stale audio report must not interfere with delivery or its ACK.
        gateway.audioApplied = validAudioApplied(data.audio, audio.snapshot.revision) ? data.audio : undefined;
        if (gateway.online && data.ready) {
          const settings = audio.snapshot.settings;
          if (['READY', 'PLAYING'].includes(gateway.audioApplied?.state)) voice.update(settings);
        }
        gateway.worldApplied = validWorldApplied(data.world) ? data.world : undefined;
        gateway.presenceFlow = validPresenceFlow(data.flow) ? data.flow : undefined;
        gateway.presenceApplied = validPresenceApplied(data.presence, presence.snapshot.revision) ? data.presence : undefined;
        return reply(200, { ...state, audioDesired: audio.desired, presenceDesired: presence.snapshot });
      }
      if (req.url === '/disconnect' && data.closing === true) {
        if (!natural(data.ack) || Object.keys(data).length !== 3) return reply(400);
        return reply(gateway.closeViewer(data.client, data.ack) ? 204 : 409);
      }
      if (Object.keys(data).length !== 1) return reply(400);
      return reply(gateway.disconnect(data.client, req.url === '/degraded') ? 204 : 409);
    }).on('close', () => gateway.release());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const gateway = new Gateway();
  const server = createGatewayServer({ gateway });
  server.on('close', () => {
    if (gateway.deliveryUncertain) console.warn('GIFT_DELIVERY_UNCERTAIN: some final gifts were not confirmed by the Viewer.');
  });
  server.listen(5203, '127.0.0.1', () => console.log('LIVE gateway ready at 127.0.0.1:5203'));
  process.once('SIGINT', () => server.close());
  process.once('SIGTERM', () => server.close());
}