import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { Gateway } from '../../../packages/v2-live-gateway/gateway.mjs';
import { createGatewayServer } from '../../../packages/v2-live-gateway/server.mjs';
import { AudioSettingsStore, PresenceSettingsStore, SettingsStore } from '../../../packages/v2-live-gateway/settings.mjs';
import { mapEvent } from '../../../packages/v2-live-gateway/mapper.mjs';

const origin = 'http://127.0.0.1:5189';
const api = 'http://127.0.0.1:5203';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const tmp = await mkdtemp(join(tmpdir(), 'pagoda-seating-'));
const room = '90002';
let receive;
let launches = 0;
let stops = 0;
const gateway = new Gateway((username, deliver) => {
  assert.equal(username, 'seating_fixture');
  launches++;
  receive = deliver;
  return () => { stops++; };
});
const path = join(tmp, 'presence-settings.json');
const presence = new PresenceSettingsStore(path);
const server = createGatewayServer({ gateway, presence, settings: new SettingsStore(join(tmp, 'visual.json')),
  audio: new AudioSettingsStore(join(tmp, 'audio.json')) });
const port = Number(process.env.V2_FIXTURE_VIEWER_PORT ?? 5196);
const out = new URL('../../../packages/v2-live-gateway/evidence/p10b7/', import.meta.url);
server.listen(0, '127.0.0.1');
await once(server, 'listening');

async function wait(test, message, timeout = 18_000) {
  const end = Date.now() + timeout;
  while (!test()) {
    assert(Date.now() < end, message);
    await new Promise(resolve => setTimeout(resolve, 25));
  }
}
const scene = (page, predicate, input = null) => page.waitForFunction(predicate, input, { polling: 'raf', timeout: 28_000 });
const errors = [];
let browser;
let viewer;
let overlay;

try {
  viewer = await preview({ preview: { port } });
  browser = await chromium.launch({ executablePath: process.env.V2_BROWSER ||
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const context = await browser.newContext({ viewport: { width: 720, height: 1280 } });
  for (const [base, target] of [[origin, port], [api, server.address().port]]) {
    await context.route(base + '/**', async route => {
      const request = route.request();
      const url = new URL(request.url());
      url.port = String(target);
      if (base === origin) {
        const response = await fetch(url, { redirect: 'error' });
        return route.fulfill({ status: response.status, contentType: response.headers.get('content-type') ?? undefined,
          body: Buffer.from(await response.arrayBuffer()) });
      }
      const headers = await request.allHeaders();
      delete headers.host;
      delete headers['content-length'];
      const response = await fetch(url, { method: request.method(), headers, body: request.postData() ?? undefined });
      const forwarded = Object.fromEntries(response.headers);
      delete forwarded['content-length'];
      delete forwarded['content-encoding'];
      await route.fulfill({ status: response.status, headers: forwarded, body: Buffer.from(await response.arrayBuffer()) });
    });
  }
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  const dashboard = await context.newPage();
  await dashboard.setViewportSize({ width: 1240, height: 1000 });
  await dashboard.goto(origin + '/dashboard/');
  overlay = await context.newPage();
  await overlay.goto(origin + '/overlay/');
  await wait(() => gateway.overlayReady && gateway.presenceApplied?.revision === 1, 'Overlay applies defaults');
  assert(await dashboard.locator('#presence-autoJoinMember').isChecked());
  assert(await dashboard.locator('#presence-autoJoinChat').isChecked());
  assert(await dashboard.locator('#presence-seatExpiryEnabled').isChecked());
  assert.equal(await dashboard.locator('#presence-idleSeconds').inputValue(), '60');
  const owner = gateway.owner;
  const identity = await overlay.evaluate(() => window.fixtureScene = crypto.randomUUID());

  async function edit(field, value) {
    const revision = presence.snapshot.revision;
    const input = dashboard.locator('#presence-' + field);
    if (typeof value === 'boolean') await input.setChecked(value);
    else {
      await input.fill(String(value));
      await input.blur();
    }
    await wait(() => presence.snapshot.revision > revision && gateway.presenceApplied?.revision === presence.snapshot.revision,
      'hot revision ' + field);
    assert.equal(presence.snapshot.settings[field], value);
  }
  async function counts(occupied, waiting) {
    await wait(() => gateway.presenceApplied?.occupied === occupied && gateway.presenceApplied?.waiting === waiting,
      'seating ' + occupied + '/' + waiting);
  }
  const consumed = () => wait(() => gateway.sequence === gateway.acknowledged, 'consumed prefix');
  function packet(kind, id, user, name, fields = {}) {
    const event = mapEvent(kind, { common: { roomId: room, msgId: String(id), createTime: String(Date.now()) },
      user: { id: String(user), nickname: name }, ...fields }, room, Date.now());
    assert(event, 'mapped ' + kind);
    const wall = Date.now();
    receive({ type: 'event', event });
    return wall;
  }
  function gift(id, user, name, phase = 1) {
    return packet('gift', id * 2 + phase, user, name, {
      giftId: '5655', groupId: String(id), repeatEnd: phase, repeatCount: 2, gift: { type: 1 },
    });
  }
  const idAt = seat => overlay.locator(`.persistent-nameplate[data-seat="${seat}"]`).getAttribute('data-actor');

  await edit('seatExpiryEnabled', false);
  await dashboard.locator('#username').fill('seating_fixture');
  await dashboard.locator('#connect').click();
  await wait(() => launches === 1, 'fixture source started');
  receive({ type: 'connected', room });
  await consumed();

  const memberStart = packet('member', 101, 11, 'An Mây');
  const firstBound = await scene(overlay, () => {
    const plate = document.querySelector('.persistent-nameplate[data-seat="seat-1"][data-actor]');
    if (plate?.textContent.includes('An Mây')) return Date.now();
  });
  const boundMs = (await firstBound.jsonValue()) - memberStart;
  const firstVisible = await scene(overlay, () => {
    const plate = document.querySelector('.persistent-nameplate[data-seat="seat-1"]:not([hidden])');
    if (plate?.textContent.includes('An Mây')) return { wall: Date.now(), shot: window.viewerReport.shot };
  });
  const visible = await firstVisible.jsonValue();
  const memberNameMs = visible.wall - memberStart;
  const originalActor = await idAt('seat-1');
  const firstPng = await overlay.locator('#stage').screenshot();
  assert.deepEqual([firstPng.readUInt32BE(16), firstPng.readUInt32BE(20)], [720, 1280]);
  packet('member', 101, 11, 'Duplicate');
  packet('member', 102, 11, 'An Lam');
  packet('chat', 103, 12, 'Bình Mây', { content: 'Chúc bình an' });
  await counts(2, 0);
  await scene(overlay, () => document.querySelector('.persistent-nameplate[data-seat="seat-1"]').textContent.includes('An Lam'));
  assert.equal(await idAt('seat-1'), originalActor);

  const duration = dashboard.locator('#presence-idleSeconds');
  await duration.fill('3');
  await duration.blur();
  await dashboard.locator('#presence-invalid').waitFor();
  await edit('autoJoinMember', false);
  assert.equal(await duration.inputValue(), '3');
  packet('member', 104, 13, 'Chi Mây');
  await consumed();
  await counts(2, 0);
  packet('chat', 105, 13, 'Chi Mây', { content: 'Xin chào' });
  await counts(3, 0);
  await edit('autoJoinMember', true);
  packet('member', 106, 14, 'Dương Mây');
  packet('member', 107, 15, 'Em Mây');
  await counts(3, 2);
  await dashboard.locator('#presence-counts').getByText(/3\/3 ghế.*2 đang chờ/).waitFor();
  const dashboardPng = await dashboard.screenshot({ fullPage: true });
  await edit('idleSeconds', 6);
  await dashboard.reload();
  await dashboard.waitForFunction(() => document.querySelector('#presence-idleSeconds').value === '6');
  assert.equal(await dashboard.locator('#presence-seatExpiryEnabled').isChecked(), false);
  await overlay.waitForTimeout(6200);
  await counts(3, 2);
  packet('member', 108, 14, 'Dương Mây');
  packet('member', 109, 15, 'Em Mây');
  await consumed();
  await edit('seatExpiryEnabled', true);
  await counts(2, 0);
  await edit('seatExpiryEnabled', false);
  packet('member', 110, 13, 'Chi Mây');
  await counts(3, 0);
  const seatActors = await Promise.all(['seat-1', 'seat-2', 'seat-3'].map(idAt));

  gift(211, 14, 'Dương Mây', 0);
  gift(212, 15, 'Em Mây', 0);
  gift(213, 16, 'Lam Mây', 0);
  await consumed();
  assert.deepEqual(await Promise.all(['seat-1', 'seat-2', 'seat-3'].map(idAt)), seatActors);
  gift(213, 16, 'Lam Mây');
  gift(213, 16, 'Lam Mây');
  gift(211, 14, 'Dương Mây');
  gift(212, 15, 'Em Mây');
  gift(214, 17, 'Vân Mây');
  await consumed();
  await counts(3, 0);
  assert.equal(gateway.counters.giftFinal, 4);
  assert.equal(await idAt('seat-1'), seatActors[0]);
  assert.equal(await idAt('seat-2'), seatActors[1]);
  const reused = await idAt('seat-3');
  assert.notEqual(reused, seatActors[2]);

  const focus = [];
  for (const [seat, name] of [['seat-1', 'Dương Mây'], ['seat-2', 'Em Mây'], ['seat-3', 'Lam Mây']]) {
    await scene(overlay, ([seat, name]) => window.viewerReport.mode === 'GIFT_FOCUS' &&
      window.viewerReport.focus?.seatId === seat && window.viewerReport.focus?.name === name, [seat, name]);
    focus.push(await overlay.evaluate(() => {
      const { actorId, requestId, seatId } = window.viewerReport.focus;
      return { actorId, requestId, seatId };
    }));
  }
  assert.equal(focus[2].actorId, reused);
  await scene(overlay, () => document.querySelector('.persistent-nameplate[data-seat="seat-3"]:not([hidden])')?.textContent.includes('Lam Mây'));
  const giftPng = await overlay.locator('#stage').screenshot();
  assert.deepEqual([giftPng.readUInt32BE(16), giftPng.readUInt32BE(20)], [720, 1280]);
  const runtime = await overlay.evaluate(() => ({
    source: window.viewerReport.repoRevision, confirmedGiftCount: window.viewerReport.confirmedGiftCount,
    graphics: window.viewerReport.graphics, visual: window.viewerReport.appliedSettingsRevision,
    scene: window.fixtureScene, audio: window.viewerReport.audio?.applied?.revision,
  }));
  assert.equal(runtime.scene, identity);
  assert.equal(runtime.confirmedGiftCount, 8);
  assert.equal(runtime.visual, 1);
  assert.equal(runtime.audio, 1);
  assert.equal(gateway.owner, owner);
  assert.equal(gateway.connection, 1);
  assert.equal(launches, 1);
  assert.equal(stops, 0);
  assert.equal(gateway.deliveryUncertain, false);
  assert.deepEqual(new PresenceSettingsStore(path).snapshot, presence.snapshot);
  assert.deepEqual(errors, []);
  const final = { ...runtime, scene: undefined, launches, stops, connection: gateway.connection,
    acknowledged: gateway.acknowledged, counters: { ...gateway.counters }, presence: gateway.presenceApplied };
  packet('member', 111, 18, 'Ngân Mây');
  await counts(3, 1);
  await dashboard.locator('#disconnect').click();
  await wait(() => stops === 1 && gateway.presenceApplied?.waiting === 0, 'disconnect clears queue');

  const photos = { 'member.png': firstPng, 'gift-focus.png': giftPng, 'dashboard.png': dashboardPng };
  const receipt = {
    method: 'Built Edge Overlay and Dashboard, loopback Gateway with mapped synthetic Member, Chat and Gift packets.',
    browser: browser.version(), member: { boundMs, visibleMs: memberNameMs, shot: visible.shot, goalMet: memberNameMs <= 500 },
    waiting: { full: 2, refilled: 2, clearedOnDisconnect: true }, focus, final,
    captures: Object.fromEntries(Object.entries(photos).map(([key, png]) => [key, sha(png)])),
  };
  await mkdir(out, { recursive: true });
  for (const [key, png] of Object.entries(photos)) await writeFile(new URL(key, out), png);
  await writeFile(new URL('receipt.json', out), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify(receipt, null, 2));
} catch (error) {
  const report = await overlay?.evaluate(() => ({
    status: document.querySelector('#status')?.textContent,
    receiver: window.viewerReport?.liveStatus, seating: window.viewerReport?.seating, camera: window.viewerReport?.mode,
  })).catch(() => undefined);
  console.error('Fixture diagnostics', { report, errors, ready: gateway.overlayReady, applied: gateway.presenceApplied });
  throw error;
} finally {
  await browser?.close();
  await viewer?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  await rm(tmp, { force: true, recursive: true });
}
