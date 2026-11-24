import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { Gateway } from './gateway.mjs';
import { normalizeUsername } from './mapper.mjs';
import { SettingsStore } from './settings.mjs';

const viewerOrigin = 'http://127.0.0.1:5189';
const hex = value => typeof value === 'string' && /^[a-f0-9]{32}$/.test(value);
const natural = n => Number.isSafeInteger(n) && n >= 0;
const receiverRoutes = new Set(['/attach', '/connect', '/poll', '/disconnect', '/degraded']);
const operatorRoutes = new Set(['/status', '/settings', '/save-settings', '/operate', '/apply']);

export function createGatewayServer({ gateway = new Gateway(), settings = new SettingsStore(), clock = Date.now } = {}) {
  let starts = 0;
  let windowStart = clock();
  let requests = 0;
  let operatorRequests = 0;
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
      if (!Number.isInteger(size) || size < 2 || size > (req.url === '/save-settings' ? 1024 : 256)) return reply(413);
      const rateLimit = () => reply(429, { reason: 'LOCAL_RATE_LIMITED' });
      if (clock() - windowStart >= 60_000) { starts = requests = operatorRequests = 0; windowStart = clock(); }
      if (operator ? ++operatorRequests > 75 : ++requests > 275) return rateLimit();
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
        if (req.url === '/status' && fields === 0) return reply(200, { ...gateway.statusSnapshot(), desired: settings.snapshot });
        if (req.url === '/settings' && fields === 0) return reply(200, settings.snapshot);
        if (req.url === '/save-settings' && fields === 2 && natural(data.revision)) {
          const error = settings.save(data.revision, data.settings);
          if (error === 'SETTINGS_CONFLICT') return conflict(error);
          if (error) return reply(error === 'INVALID_SETTINGS' ? 400 : 500, { reason: error });
          return reply(200, settings.snapshot);
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
            if (gateway.receiver !== 'overlay') return conflict('OVERLAY_NOT_READY');
            if (++starts > 4) return rateLimit();
            if (gateway.limited) return reply(429, { reason: 'RATE_LIMITED' });
            return gateway.connect(gateway.owner, username, 'overlay') ? reply(204) : conflict('SOURCE_BUSY');
          }
        }
        return reply(400);
      }
      if (!hex(data.client)) return reply(400);
      if (req.url === '/attach') {
        if (fields !== 2 || !natural(data.revision) || data.revision > settings.snapshot.revision) return reply(400);
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
        if (!natural(data.ack) || Object.keys(data).length !== 2) return reply(400);
        const state = gateway.poll(data.client, data.ack);
        return state ? reply(200, state) : reply(409);
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