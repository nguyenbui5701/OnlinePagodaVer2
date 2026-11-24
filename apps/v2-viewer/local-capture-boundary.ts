import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

export const loopback = '127.0.0.1';

function localRequest(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const authority = req.headers.host;
  const port = req.socket.localPort;
  const localHost = authority === `${loopback}:${port}` || authority === `localhost:${port}`;
  const origin = req.headers.origin;
  const fetchSite = req.headers['sec-fetch-site'];
  const localOrigin = origin === undefined || origin === `http://${authority}`;
  const localFetch = fetchSite === undefined || fetchSite === 'same-origin' || fetchSite === 'none';

  if (req.socket.localAddress === loopback && localHost && localOrigin && localFetch) {
    next();
    return;
  }
  res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end('Local Viewer request required.\n');
}

export function localCaptureBoundary(): Plugin {
  return {
    name: 'local-capture-boundary',
    configureServer(server) {
      server.middlewares.use(localRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use(localRequest);
    },
    configResolved({ server, preview }) {
      if (server.ws !== false || server.hmr !== false || !server.fs.strict) {
        throw new Error('Viewer requires strict dev file access with WebSocket and HMR disabled.');
      }
      for (const options of [server, preview]) {
        if (options.host !== loopback || options.cors !== false || !options.strictPort ||
            options.allowedHosts === true || options.https) {
          throw new Error('Viewer requires strict HTTP on 127.0.0.1 with CORS disabled.');
        }
      }
    },
  };
}
