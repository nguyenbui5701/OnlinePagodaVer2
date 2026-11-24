import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { createServer as createHttpServer, request } from 'node:http';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer, normalizePath, preview, resolveConfig } from 'vite';

const configFile = fileURLToPath(new URL('../vite.config.ts', import.meta.url));

async function fixture(t) {
  const parent = await mkdtemp(fileURLToPath(new URL('../../../.viewer-capture-test-', import.meta.url)));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const root = join(parent, 'fixture');
  await mkdir(join(root, 'dist'), { recursive: true });
  const glbHeader = Buffer.from('glTF', 'ascii');
  await Promise.all([
    writeFile(join(root, 'inside.txt'), 'synthetic inside canary'),
    writeFile(join(root, 'dist', 'inside.txt'), 'synthetic inside canary'),
    writeFile(join(root, '.env.fixture'), 'synthetic denied canary'),
    writeFile(join(parent, 'outside.txt'), 'synthetic outside canary'),
    writeFile(join(root, 'dist', 'asset.glb'), glbHeader),
  ]);
  return { root, inside: normalizePath(join(root, 'inside.txt')), outside: normalizePath(join(parent, 'outside.txt')), glbHeader };
}

function get(port, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path, headers, agent: false }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.setTimeout(4000, () => req.destroy(new Error('HTTP fixture timeout')));
    req.end();
  });
}

async function checkHttpBoundary(port) {
  const host = `127.0.0.1:${port}`;
  const accepted = await get(port, '/inside.txt', { Origin: `http://${host}` });
  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.toString(), 'synthetic inside canary');
  assert.equal(accepted.headers['access-control-allow-origin'], undefined);
  assert.equal((await get(port, '/inside.txt', { Host: `localhost:${port}` })).status, 200);

  for (const headers of [
    { Host: `external.invalid:${port}` },
    { Host: '127.0.0.1:1' },
    { Origin: 'http://external.invalid' },
    { Origin: 'null' },
    { Origin: 'http://127.0.0.1:1' },
    { 'Sec-Fetch-Site': 'cross-site' },
    { 'Sec-Fetch-Site': 'same-site' },
  ]) {
    const blocked = await get(port, '/inside.txt', headers);
    assert.equal(blocked.status, 403);
    assert.equal(blocked.headers['access-control-allow-origin'], undefined);
    assert.doesNotMatch(blocked.body.toString(), /canary/);
  }
}

async function unusedPort() {
  const listener = createHttpServer();
  await new Promise((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  const port = listener.address().port;
  await new Promise((resolve, reject) => listener.close(error => error ? reject(error) : resolve()));
  return port;
}

async function checkNoWebSocket(port) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/`);
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('WebSocket fixture timeout')), 4000);
      ws.addEventListener('error', () => { clearTimeout(timer); resolve(); }, { once: true });
      ws.addEventListener('open', () => { clearTimeout(timer); reject(new Error('Unexpected WebSocket upgrade')); }, { once: true });
    });
  } finally {
    ws.close();
  }
}

test('dev fixture confines files, requests and WebSocket registration to the local contract', async t => {
  const { root, inside, outside } = await fixture(t);
  const server = await createServer({ configFile, root, logLevel: 'silent', server: { port: await unusedPort(), fs: { allow: [root] } } });
  try {
    await server.listen();
    const { address, port } = server.httpServer.address();
    assert.equal(address, '127.0.0.1');
    await checkHttpBoundary(port);
    const insideResponse = await get(port, '/@fs/' + encodeURI(inside));
    assert.equal(insideResponse.status, 200);
    assert.equal(insideResponse.body.toString(), 'synthetic inside canary');
    const outsideResponse = await get(port, '/@fs/' + encodeURI(outside));
    assert.equal(outsideResponse.status, 403);
    assert.doesNotMatch(outsideResponse.body.toString(), /synthetic outside canary/);
    assert.equal((await get(port, '/.env.fixture')).status, 403);
    assert.equal(server.config.server.ws, false);
    assert.equal(server.httpServer.listenerCount('upgrade'), 0);
    await checkNoWebSocket(port);
    t.diagnostic(`dev: 127.0.0.1; Host/Origin/Fetch Metadata 403; fs outside ${outsideResponse.status}; fs deny 403; WebSocket refused`);
  } finally {
    await server.close();
  }
});

test('built preview fixture serves an ordinary same-origin asset and refuses a foreign request', async t => {
  const { root, glbHeader } = await fixture(t);
  const server = await preview({ configFile, root, logLevel: 'silent', preview: { port: await unusedPort() } });
  try {
    const { address, port } = server.httpServer.address();
    assert.equal(address, '127.0.0.1');
    await checkHttpBoundary(port);
    const asset = await get(port, '/asset.glb', { Origin: `http://127.0.0.1:${port}` });
    assert.equal(asset.status, 200);
    assert.deepEqual(asset.body, glbHeader);
    assert.equal(server.httpServer.listenerCount('upgrade'), 0);
    await checkNoWebSocket(port);
    t.diagnostic('preview: 127.0.0.1; Host/Origin/Fetch Metadata 403; same-origin asset 200; WebSocket refused');
  } finally {
    await server.close();
  }
});

test('config refuses wildcard bind, permissive CORS and non-strict ports', async () => {
  for (const overrides of [
    { server: { host: '0.0.0.0' } },
    { preview: { host: true } },
    { preview: { cors: true } },
    { server: { allowedHosts: true } },
    { preview: { strictPort: false } },
    { server: { hmr: true } },
    { server: { fs: { strict: false } } },
  ]) {
    await assert.rejects(resolveConfig(overrides, 'serve'), /Viewer requires/);
  }
});

test('preview strictPort rejects an occupied port without choosing another', async t => {
  const { root } = await fixture(t);
  const incumbent = await preview({ configFile, root, logLevel: 'silent', preview: { port: await unusedPort() } });
  try {
    const port = incumbent.httpServer.address().port;
    await assert.rejects(preview({ configFile, root, logLevel: 'silent', preview: { port } }), /already in use/);
  } finally {
    await incumbent.close();
  }
});
