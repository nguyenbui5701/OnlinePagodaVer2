import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { Gateway } from '../../../packages/v2-live-gateway/gateway.mjs';
import { createGatewayServer } from '../../../packages/v2-live-gateway/server.mjs';
import { AudioSettingsStore, PresenceSettingsStore, SettingsStore } from '../../../packages/v2-live-gateway/settings.mjs';
import { liveDefaults } from '../src/live-settings.ts';
import r17b from '../src/sakura-r17b.json' with { type: 'json' };

const origin = 'http://127.0.0.1:5189';
const tmp = await mkdtemp(join(tmpdir(), 'pagoda-world-browser-'));
const gateway = new Gateway(() => { throw new Error('Provider must stay offline'); });
let server;
let viewer;
let browser;
try {
  const settings = new SettingsStore(join(tmp, 'visual.json'));
  assert.equal(settings.save(1, { ...liveDefaults, tree: 'r18a', density: 'lush' }), undefined);
  server = createGatewayServer({ gateway, settings, audio: new AudioSettingsStore(join(tmp, 'audio.json')),
    presence: new PresenceSettingsStore(join(tmp, 'presence.json')) });
  server.listen(5203, '127.0.0.1');
  await once(server, 'listening');
  viewer = await preview({ preview: { host: '127.0.0.1', port: 5189, strictPort: true } });
  const executablePath = process.env.V2_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  browser = await chromium.launch({ executablePath });
  const corrupt = Buffer.alloc(r17b.profiles.eco.bytes);
  const results = [];
  for (const [tree, text] of [
    ['R18A', 'Cây đang dùng R18A · Đầm sen dày theo cụm'],
    ['R17B', 'Cây đang dùng R17B · Đã dùng dự phòng thay cho R18A (R18A – thiếu GLB) · Đầm sen dày theo cụm'],
    ['R16', 'Cây đang dùng R16 · Đã dùng dự phòng thay cho R18A (R18A – thiếu GLB, R17B – lỗi kiểm tra tính toàn vẹn) · Đầm sen dày theo cụm'],
  ]) {
    const context = await browser.newContext({ viewport: { width: 720, height: 1280 } });
    try {
      if (tree !== 'R18A') await context.route('**/r18a/*.glb', route => route.fulfill({ status: 404 }));
      if (tree === 'R16') await context.route('**/r17b/*.glb', route =>
        route.fulfill({ contentType: 'model/gltf-binary', body: corrupt }));
      const overlay = await context.newPage();
      const dashboard = await context.newPage();
      await Promise.all([overlay.goto(origin + '/overlay/'), dashboard.goto(origin + '/dashboard/')]);
      await dashboard.waitForFunction(expected => document.getElementById('world-applied')?.textContent === expected,
        text, { timeout: 30_000 });
      assert.equal(gateway.worldApplied.tree, tree);
      results.push({ text: await dashboard.locator('#world-applied').textContent(), world: gateway.worldApplied });
    } finally {
      await context.close();
      gateway.release();
    }
  }
  console.log(JSON.stringify({ browser: browser.version(), results }, null, 2));
} finally {
  await browser?.close();
  gateway.release();
  await viewer?.close();
  if (server) {
    server.closeAllConnections();
    await new Promise(done => server.close(done));
  }
  await rm(tmp, { recursive: true, force: true });
}
