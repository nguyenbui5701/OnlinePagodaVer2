import { timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { Gateway } from './gateway.mjs';
import { normalizeUsername } from './mapper.mjs';

const viewerOrigin = 'http://127.0.0.1:5189';
const allowedHeaders = new Set(['authorization', 'content-type']);
const hex = value => typeof value === 'string' && /^[a-f0-9]{32}$/.test(value);
const natural = n => Number.isSafeInteger(n) && n >= 0;
const routes = new Set(['/connect', '/poll', '/disconnect', '/degraded']);

export function createGatewayServer({ token, gateway = new Gateway(), clock = Date.now }) {
  if (!/^[a-f0-9]{64}$/.test(token ?? '')) throw new Error('Invalid local gateway token');
  const auth = Buffer.from('Bearer ' + token);
  const expires = clock() + 8 * 60 * 60 * 1000;
  let starts = 0;
  let windowStart = clock();
  let requests = 0;
  return createServer({ headersTimeout: 4000, requestTimeout: 4000, connectionsCheckingInterval: 1000 },
    async (req, res) => {
      const reply = (status, body) => {
        res.writeHead(status, body ? { 'Content-Type': 'application/json' } : {});
        res.end(body ? JSON.stringify(body) : undefined);
      };
      res.setHeader('Cache-Control', 'no-store');
      if (req.socket.localAddress !== '127.0.0.1' || req.socket.remoteAddress !== '127.0.0.1' ||
          req.headers.host !== '127.0.0.1:' + req.socket.localPort || req.headers.origin !== viewerOrigin) return reply(403);
      if (!routes.has(req.url)) return reply(404);
      res.setHeader('Access-Control-Allow-Origin', viewerOrigin);
      res.setHeader('Vary', 'Origin');
      if (req.method === 'OPTIONS') {
        const headers = String(req.headers['access-control-request-headers'] ?? '').toLowerCase().split(',').map(x => x.trim());
        if (req.headers['access-control-request-method'] !== 'POST' || headers.some(x => !allowedHeaders.has(x))) return reply(403);
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        return reply(204);
      }
      if (req.method !== 'POST') return reply(405);
      const supplied = Buffer.from(req.headers.authorization ?? '');
      if (clock() >= expires || supplied.length !== auth.length || !timingSafeEqual(supplied, auth)) return reply(401);
      if (req.headers['content-type'] !== 'application/json') return reply(415);
      const size = Number(req.headers['content-length']);
      if (!Number.isInteger(size) || size < 2 || size > 256) return reply(413);
      if (clock() - windowStart >= 60_000) { starts = requests = 0; windowStart = clock(); }
      if (++requests > 350 || (req.url === '/connect' && ++starts > 4)) return reply(429, { reason: 'LOCAL_RATE_LIMITED' });
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
      if (!hex(data?.client)) return reply(400);
      if (req.url === '/connect') {
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
  const token = process.env.V2_LIVE_TOKEN;
  delete process.env.V2_LIVE_TOKEN;
  const gateway = new Gateway();
  const server = createGatewayServer({ token, gateway });
  server.on('close', () => {
    if (gateway.deliveryUncertain) console.warn('GIFT_DELIVERY_UNCERTAIN: some final gifts were not confirmed by the Viewer.');
  });
  server.listen(5203, '127.0.0.1', () => console.log('LIVE gateway ready at 127.0.0.1:5203'));
  process.once('SIGINT', () => server.close());
  process.once('SIGTERM', () => server.close());
}