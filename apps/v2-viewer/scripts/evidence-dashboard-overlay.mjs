import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { Gateway } from '../../../packages/v2-live-gateway/gateway.mjs';
import { createGatewayServer } from '../../../packages/v2-live-gateway/server.mjs';
import { SettingsStore } from '../../../packages/v2-live-gateway/settings.mjs';
import { mapEvent } from '../../../packages/v2-live-gateway/mapper.mjs';
import { liveDefaults, overlayQuery } from '../src/live-settings.ts';

const origin = 'http://127.0.0.1:5189';
const readinessCheck = process.argv.includes('--readiness-r1');
const api = 'http://127.0.0.1:5203';
const candidate = Number(process.env.V2_FIXTURE_VIEWER_PORT || 5191);
const baseline = Number(process.env.V2_FIXTURE_BASELINE_PORT || 5192);
for (const port of [candidate, baseline]) assert(Number.isInteger(port) && port > 0 && port <= 65535);
const resultDir = new URL('../../../packages/v2-live-gateway/evidence/p10b5/', import.meta.url);
const tmp = await mkdtemp(join(tmpdir(), 'pagoda-dashboard-evidence-'));
const room = '90001';
let receive;
let launches = 0;
let stops = 0;
const gateway = new Gateway((username, deliver) => {
  assert.equal(username, 'dashboard_fixture');
  launches++;
  receive = deliver;
  return () => { stops++; };
});
const path = join(tmp, 'settings.json');
if (readinessCheck) assert.equal(new SettingsStore(path).save(1, { ...liveDefaults, seed: 71 }), undefined);
const server = createGatewayServer({ gateway, settings: new SettingsStore(path) });
let gatewayPort;
async function startGateway() {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  gatewayPort = server.address().port;
}
if (!readinessCheck) await startGateway();
let browser;
const errors = [];
const sceneSize = { width: 720, height: 1280 };
const checksum = bytes => createHash('sha256').update(bytes).digest('hex');
const steps = {};
const requests = [];
const photos = new Map();
const wait = async predicate => {
  for (let step = 0; step < 220; step++) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  throw new Error('Fixture Gateway state timed out');
};

// Use fresh isolated listeners. The browser still sees the public loopback routes and the API validates its Origin.
async function context(port, viewport = sceneSize) {
  const ctx = await browser.newContext({ viewport });
  await ctx.route(origin + '/**', async route => {
    const url = new URL(route.request().url());
    url.port = String(port);
    const response = await fetch(url, { redirect: 'error' });
    await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') ?? undefined,
      body: Buffer.from(await response.arrayBuffer()) });
  });
  await ctx.route(api + '/**', async route => {
    if (!gatewayPort) { await route.abort('connectionrefused'); return; }
    const request = route.request();
    const url = new URL(request.url());
    url.port = String(gatewayPort);
    const headers = await request.allHeaders();
    delete headers.host;
    delete headers['content-length'];
    const method = request.method();
    requests.push({ page: new URL(request.frame().url()).pathname, route: url.pathname, method });
    const response = await fetch(url, { method, headers, body: request.postData() ?? undefined, redirect: 'error' });
    const forwarded = Object.fromEntries(response.headers);
    delete forwarded['content-encoding'];
    delete forwarded['content-length'];
    await route.fulfill({ status: response.status, headers: forwarded, body: Buffer.from(await response.arrayBuffer()) });
  });
  ctx.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  return ctx;
}

function scene(page, predicate, argument = {}) {
  return page.waitForFunction(predicate, argument, { polling: 100, timeout: 25_000 });
}
async function capture(page, file) {
  const png = await page.locator('#stage').screenshot();
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [720, 1280]);
  photos.set(file, png);
  return checksum(png);
}
async function closeOverlay(page) {
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await wait(() => !gateway.owner);
  await page.close();
}

try {
  browser = await chromium.launch({ executablePath: process.env.V2_BROWSER ||
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  if (readinessCheck) {
    const contextR1 = await context(candidate);
    await contextR1.addInitScript(() => {
      if (location.pathname !== '/overlay/') return;
      const request = window.requestAnimationFrame.bind(window);
      const cancel = window.cancelAnimationFrame.bind(window);
      const queued = new Map();
      let held = true;
      let next = -1;
      window.holdFrames = () => { held = true; window.frameQueued = false; };
      window.releaseFrames = () => {
        held = false;
        for (const callback of queued.values()) request(callback);
        queued.clear();
      };
      window.requestAnimationFrame = callback => {
        if (!held) return request(callback);
        window.frameQueued = true;
        queued.set(--next, callback);
        return next;
      };
      window.cancelAnimationFrame = handle => {
        if (handle < 0) queued.delete(handle);
        else cancel(handle);
      };
    });
    const control = await contextR1.newPage();
    const overlay = await contextR1.newPage();
    await control.goto(origin + '/dashboard/');
    await overlay.goto(origin + '/overlay/');
    await overlay.getByText(/Đang chờ cấu hình từ Gateway/).waitFor();
    const connect = control.getByRole('button', { name: 'Kết nối', exact: true });
    assert(await connect.isDisabled());
    assert.equal(requests.filter(r => r.route === '/attach').length, 0);
    assert.equal(launches, 0);
    steps.beforeGateway = { rendererStarted: await overlay.evaluate(() => !!window.viewerReport), launches };

    await startGateway();
    await scene(overlay, () => window.frameQueued === true);
    const requestedSeed = await overlay.evaluate(() => window.viewerReport.seed);
    assert.equal(requestedSeed, 71);
    assert.equal(gateway.owner, undefined);
    assert(await connect.isDisabled());
    const post = (path, data) => fetch('http://127.0.0.1:' + gatewayPort + path, {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    const zero = await post('/attach', { client: 'a'.repeat(32), revision: 0 });
    assert.equal(zero.status, 400);
    assert.equal((await post('/operate', { action: 'connect', username: 'dashboard_fixture' })).status, 409);
    steps.beforeFirstFrame = { zeroRevisionStatus: zero.status, requestedSeed, launches };

    await overlay.evaluate(() => window.releaseFrames());
    await wait(() => gateway.overlayReady);
    await control.getByText('Overlay sẵn sàng', { exact: true }).waitFor();
    const revision = await overlay.evaluate(() => window.viewerReport.appliedSettingsRevision);
    assert.equal(revision, 2);
    async function lose() {
      await overlay.evaluate(() => {
        const canvas = document.querySelector('#capture');
        const ext = canvas.getContext('webgl2').getExtension('WEBGL_lose_context');
        if (!ext) throw new Error('WEBGL_lose_context unavailable');
        window.fixtureGlLoss = ext;
        ext.loseContext();
      });
      await wait(() => !gateway.overlayReady);
    }
    async function restore() {
      const count = await overlay.evaluate(() => window.viewerReport.contextRestores);
      await overlay.evaluate(() => window.fixtureGlLoss.restoreContext());
      await scene(overlay, n => window.viewerReport.contextRestores > n, count);
    }
    await lose();
    await control.getByText(/Đang chờ khung hình WebGL/).waitFor();
    assert(await connect.isDisabled());
    const refused = await post('/operate', { action: 'connect', username: 'dashboard_fixture' });
    assert.equal(refused.status, 409);
    assert.equal((await refused.json()).reason, 'OVERLAY_NOT_READY');
    assert.equal(launches, 0);
    await overlay.evaluate(() => window.holdFrames());
    await restore();
    await scene(overlay, () => window.frameQueued === true);
    assert.equal(gateway.overlayReady, false);
    steps.beforeConnectLoss = { connectStatus: refused.status, launches, readyAfterRestoreEventWithoutFrame: gateway.overlayReady };
    await overlay.evaluate(() => window.releaseFrames());
    await control.getByText('Overlay sẵn sàng', { exact: true }).waitFor();
    await control.getByLabel('Tên kênh TikTok').fill('dashboard_fixture');
    await connect.click();
    await wait(() => launches === 1);
    receive({ type: 'connected', room });
    await wait(() => gateway.acknowledged === 1);
    await lose();
    receive({ type: 'event', event: { type: 'gift', eventId: 'r1-final', phase: 'final', giftId: '5655',
      viewer: { userKey: 'r1-fixture', name: 'Fixture' }, count: 1 } });
    await wait(() => gateway.offered === 2);
    assert.equal(gateway.acknowledged, 1);
    assert.equal(stops, 0);
    await restore();
    await wait(() => gateway.overlayReady && gateway.acknowledged === 2);
    assert.equal(await overlay.evaluate(() => window.viewerReport.confirmedGiftCount), 1);
    assert.equal(launches, 1);
    assert.equal(stops, 0);
    assert.equal(gateway.connection, 1);
    assert.equal(gateway.deliveryUncertain, false);
    steps.activeRecovery = { revision, launches, stops, connection: gateway.connection, ackPaused: 1, ackRecovered: 2, confirmed: 1 };

    // A transient lost loopback response keeps the same receiver lease and consumed ACK.
    let failPoll = true;
    await contextR1.route(api + '/poll', async route => {
      if (failPoll && route.request().method() === 'POST') {
        failPoll = false;
        await route.abort('connectionrefused');
      } else await route.fallback();
    });
    await scene(overlay, () => window.viewerReport.liveReason === 'LOCAL_LINK_LOST');
    await scene(overlay, () => window.viewerReport.liveStatus === 'EVENTS_VERIFIED');
    assert.equal(gateway.acknowledged, 2);
    assert.equal(stops, 0);
    steps.transientGatewayLoss = { ack: gateway.acknowledged, launches, stops };
    const source = await overlay.evaluate(() => window.viewerReport.repoRevision);
    gatewayPort = undefined;
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await control.getByText('Đang chờ Gateway cục bộ.').waitFor();
    await scene(overlay, () => window.viewerReport.liveStatus === 'DEGRADED');
    assert(await connect.isDisabled());
    await startGateway();
    await control.getByText('Chưa có Overlay sẵn sàng.').waitFor();
    assert(await connect.isDisabled());
    await overlay.reload();
    await scene(overlay, () => window.frameQueued === true);
    await overlay.evaluate(() => window.releaseFrames());
    await control.getByText('Overlay sẵn sàng', { exact: true }).waitFor();
    assert.equal(launches, 1);
    assert.equal(stops, 1);
    steps.gatewayRestart = { automaticLaunches: launches - 1, stops, appliedRevision: gateway.appliedRevision };
    await closeOverlay(overlay);
    assert.deepEqual(errors, []);
    await mkdir(resultDir, { recursive: true });
    await writeFile(new URL('readiness-r1.json', resultDir), JSON.stringify({
      source,
      method: 'Built two-page Edge fixture, persisted seed 71 and native WEBGL_lose_context. Loopback interception only.',
      browser: browser.version(), steps, errors,
    }, null, 2) + '\n');
    console.log('P1-01 readiness fixture passed');
  } else {
    const beforeContext = await context(baseline);
    const before = await beforeContext.newPage();
    const legacyQuery = overlayQuery(liveDefaults);
    legacyQuery.set('time', '0');
    await before.goto(origin + '/?' + legacyQuery);
    await scene(before, () => window.viewerReport?.elapsedSeconds === 0);
    const baselineSource = await before.evaluate(() => window.viewerReport.repoRevision);
    assert.equal(baselineSource, 'f8773cd35476924e0f68204b0d0e82b7e0e87d26');
    const reference = await capture(before, 'baseline-offline.png');
    await beforeContext.close();

    const live = await context(candidate);
    const dashboard = await live.newPage();
    await dashboard.setViewportSize({ width: 1200, height: 950 });
    await dashboard.goto(origin + '/dashboard/');
    await dashboard.getByText('Chưa có Overlay sẵn sàng.').waitFor();
    assert.equal(await dashboard.locator('canvas, audio').count(), 0);
    assert(await dashboard.getByRole('button', { name: 'Kết nối', exact: true }).isDisabled());
    const parity = await live.newPage();
    await parity.addInitScript(() => {
      const frame = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = callback => frame(() => callback(1000));
    });
    await parity.goto(origin + '/overlay/');
    await scene(parity, () => window.viewerReport?.elapsedSeconds === 0);
    await wait(() => gateway.receiver === 'overlay');
    const defaultFrame = await capture(parity, 'overlay-offline.png');
    assert.equal(defaultFrame, reference);
    steps.parity = { baselineSource, before: reference, after: defaultFrame, timeSec: 0, seed: 9, pixels: [720, 1280] };
    await closeOverlay(parity);

    const seed = dashboard.getByLabel('Seed camera');
    await seed.fill('71');
    await dashboard.getByRole('button', { name: 'Lưu cấu hình' }).click();
    await dashboard.getByText('Đã lưu cấu hình.', { exact: true }).waitFor();
    await dashboard.reload();
    await dashboard.getByText(/Đã lưu r2/).waitFor();
    assert.equal(await seed.inputValue(), '71');

    const opened = dashboard.waitForEvent('popup');
    await dashboard.getByRole('link', { name: 'Mở Overlay' }).click();
    const overlay = await opened;
    await overlay.setViewportSize(sceneSize);
    await scene(overlay, () => window.viewerReport?.appliedSettingsRevision === 2 && window.viewerReport.elapsedSeconds > 0);
    await dashboard.getByText('Overlay sẵn sàng', { exact: true }).waitFor();
    assert.equal(await overlay.locator('aside, form, #diagnostics, #live-controls, #audio-controls').count(), 0);
    assert.equal(await overlay.locator('#status').isVisible(), false);
    assert.equal(await overlay.evaluate(() => window.viewerReport.seed), 71);
    await dashboard.getByLabel('Tên kênh TikTok').fill('dashboard_fixture');
    await dashboard.getByRole('button', { name: 'Kết nối', exact: true }).click();
    await wait(() => launches === 1);
    const leaseOwner = gateway.owner;
    receive({ type: 'connected', room });
    const event = (id, type, extra = {}) => {
      const raw = { common: { roomId: room, msgId: String(400 + id), createTime: String(Date.now()) },
        user: { id: String(100 + id), nickname: 'Fixture ' + id }, ...extra };
      receive({ type: 'event', event: mapEvent(type, raw, room, Date.now()) });
    };
    const gift = id => event(id, 'gift', { giftId: '5655', groupId: String(200 + id), repeatEnd: 1, repeatCount: 1, gift: { type: 1 } });
    gift(1);
    await scene(overlay, () => window.viewerReport.confirmedGiftCount === 1);
    await dashboard.reload();
    await dashboard.getByText('Đã nhận sự kiện').waitFor();
    assert.equal(gateway.owner, leaseOwner);
    assert.equal(stops, 0);
    await seed.fill('1337');
    await dashboard.getByRole('button', { name: 'Lưu cấu hình' }).click();
    await dashboard.getByText(/Đã lưu r3 .*Overlay r2 .*Chờ áp dụng/).waitFor();
    assert(await dashboard.getByRole('button', { name: 'Áp dụng vào Overlay' }).isDisabled());
    photos.set('dashboard.png', await dashboard.screenshot({ fullPage: true }));
    await dashboard.close();
    gift(2);
    gift(2);
    gift(3);
    gift(4);
    await scene(overlay, () => window.viewerReport.confirmedGiftCount === 4 &&
      window.viewerReport.mode === 'GIFT_FOCUS' && window.viewerReport.focus?.seatId === 'seat-1');
    await wait(() => gateway.acknowledged === gateway.sequence);
    assert.equal(gateway.owner, leaseOwner);
    assert.equal(gateway.connection, 1);
    assert.equal(launches, 1);
    assert.equal(stops, 0);
    const focusHash = await capture(overlay, 'overlay-gift-focus.png');
    const head = await overlay.evaluate(() => ({
      source: window.viewerReport.repoRevision, confirmed: window.viewerReport.confirmedGiftCount,
      seat: window.viewerReport.focus?.seatId, graphics: window.viewerReport.graphics,
    }));
    steps.dashboardContinuity = { launches, stops, connection: gateway.connection, acknowledged: gateway.acknowledged,
      phase: gateway.status, counters: { ...gateway.counters }, focusHash, ...head };

    const returned = await live.newPage();
    await returned.goto(origin + '/dashboard/');
    await returned.getByText('Đã nhận sự kiện').waitFor();
    await returned.getByRole('button', { name: 'Ngắt kết nối' }).click();
    const apply = returned.getByRole('button', { name: 'Áp dụng vào Overlay' });
    await apply.click();
    await scene(overlay, () => window.viewerReport?.appliedSettingsRevision === 3 && window.viewerReport.seed === 1337);
    await returned.getByText(/Đã lưu r3 .*Overlay r3/).waitFor();
    assert.equal(stops, 1);
    assert.equal(launches, 1);
    steps.applied = { revision: gateway.appliedRevision, uncertainty: gateway.deliveryUncertain, automaticConnects: launches - 1 };

    await returned.getByLabel('Tên kênh TikTok').fill('dashboard_fixture');
    await returned.getByRole('button', { name: 'Kết nối', exact: true }).click();
    await wait(() => launches === 2);
    receive({ type: 'connected', room });
    await wait(() => gateway.acknowledged === 1);
    await overlay.locator('#capture').dispatchEvent('webglcontextlost', { cancelable: true });
    gift(5);
    await wait(() => gateway.offered === 2);
    assert.equal(gateway.acknowledged, 1);
    await closeOverlay(overlay);
    await returned.locator('#delivery-warning').waitFor();
    assert.equal(stops, 2);
    steps.closedOverlay = { offered: 2, ack: gateway.acknowledged, uncertain: gateway.deliveryUncertain };

    const demo = await live.newPage();
    await demo.goto(origin + '/?demo=gifts&clean=1');
    await scene(demo, () => window.viewerReport?.scenario === 'gifts' && window.viewerReport.confirmedGiftCount === 0);
    steps.demo = 'root route rendered with gifts scenario';
    assert(!requests.some(r => r.page === '/dashboard/' && ['/poll', '/disconnect', '/attach'].includes(r.route)));
    assert.deepEqual(errors, []);
    await mkdir(resultDir, { recursive: true });
    for (const [name, bytes] of photos) await writeFile(new URL(name, resultDir), bytes);
    await writeFile(new URL('receipt.json', resultDir), JSON.stringify({
      method: 'Built Edge pages and isolated loopback Gateway with provider fixture. Browser test routes forward to temporary local listeners.',
      browser: browser.version(), captures: Object.fromEntries([...photos].map(([name, bytes]) => [name, checksum(bytes)])),
      steps, errors,
    }, null, 2) + '\n');
    console.log('Dashboard/Overlay two-page fixture and default pixel parity passed');
  }
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  await rm(tmp, { recursive: true, force: true });
}