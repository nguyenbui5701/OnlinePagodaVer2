// Local integration evidence only. The injected provider does not contact TikTok.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { Gateway } from '../../../packages/v2-live-gateway/gateway.mjs';
import { mapEvent } from '../../../packages/v2-live-gateway/mapper.mjs';
import { createGatewayServer } from '../../../packages/v2-live-gateway/server.mjs';

const origin = 'http://127.0.0.1:5189';
const output = new URL('../../../packages/v2-live-gateway/evidence/', import.meta.url);
const token = randomBytes(32).toString('hex');
const room = '12345';
let transport;
const gateway = new Gateway((name, receive) => {
  assert.equal(name, 'gateway_fixture');
  transport = receive;
  return () => {};
});
const server = createGatewayServer({ token, gateway });
server.listen(5203, '127.0.0.1');
await once(server, 'listening');
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.V2_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  });
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
  const requests = [];
  const errors = [];
  const report = {};
  page.on('request', request => requests.push(new URL(request.url()).origin));
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin + '/?source=live&clean=1&profile=eco&seed=9&look=twilight&tree=r17b' +
    '&botanicals=on&diversity=on&presence=on&chatbubbles=on&gifticons=on&ambience=rich&seats=rings&shots=hero&blessing=on' +
    '&audio=on&dynamicvoice=on');
  const panel = page.locator('#live-controls');
  await panel.waitFor();
  assert.deepEqual([...new Set(requests)], [origin]);
  assert.equal(await page.locator('#audio-controls').count(), 0);
  const snapshot = () => page.evaluate(() => {
    const r = window.viewerReport;
    return { revision: r.repoRevision, status: r.liveStatus, counters: r.liveCounters, mode: r.mode,
      confirmed: r.confirmedGiftCount, community: r.community, focus: r.focus, graphics: r.graphics };
  });
  report.offline = await snapshot();
  assert.equal(report.offline.status, 'OFFLINE');
  assert.equal(report.offline.confirmed, 0);
  await panel.getByLabel('Tên kênh TikTok').fill('gateway_fixture');
  await panel.getByLabel('Mã gateway cục bộ').fill(token);
  await panel.getByRole('button', { name: 'Connect', exact: true }).click();
  await page.waitForFunction(() => window.viewerReport.liveStatus === 'CONNECTING');
  assert.equal(await panel.getByLabel('Mã gateway cục bộ').inputValue(), '');
  transport({ type: 'connected', room });
  await page.waitForFunction(() => window.viewerReport.liveStatus === 'CONNECTED_NO_EVENTS');
  report.connected = await snapshot();
  let message = 100;
  const raw = (id, fields) => ({ user: { id: String(id), nickname: 'Fixture ' + id },
    common: { msgId: String(++message), roomId: room, createTime: String(Date.now()) }, ...fields });
  const send = (kind, payload) => transport({ type: 'event', event: mapEvent(kind, payload, room, Date.now()) });
  send('chat', raw(1, { content: 'fixture greeting' }));
  send('member', raw(1, {}));
  send('like', raw(1, { count: 1 }));
  send('roomUser', raw(1, { total: '16' }));
  await page.waitForFunction(() => window.viewerReport.liveStatus === 'EVENTS_VERIFIED' &&
    window.viewerReport.community?.viewerCount === 16);
  report.ingress = await snapshot();
  assert.equal(report.ingress.community.realActors, 0);
  const rose = (id, phase) => raw(id, { giftId: '5655', groupId: String(200 + id), repeatEnd: phase, repeatCount: 1, gift: { type: 1 } });
  send('gift', rose(1, 0));
  send('gift', rose(1, 1));
  send('gift', rose(1, 1));
  for (const id of [2, 3, 4]) send('gift', rose(id, 1));
  await page.waitForFunction(() => window.viewerReport.confirmedGiftCount === 4 && window.viewerReport.mode === 'GIFT_FOCUS');
  report.focus = await snapshot();
  assert.equal(report.focus.focus.seatId, 'seat-1');
  assert.equal(report.focus.community.realActors, 3);
  assert.equal(report.focus.counters.giftFinal, 4);
  const png = await page.locator('#stage').screenshot();
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [720, 1280]);
  await panel.getByRole('button', { name: 'Disconnect', exact: true }).click();
  await page.waitForFunction(() => window.viewerReport.liveStatus === 'OFFLINE');
  report.disconnected = await snapshot();
  assert.equal(report.disconnected.confirmed, 4);
  assert.deepEqual(errors, []);
  assert.deepEqual([...new Set(requests)].sort(), [origin, 'http://127.0.0.1:5203'].sort());
  await mkdir(output, { recursive: true });
  await writeFile(new URL('fixture-focus.png', output), png);
  await writeFile(new URL('browser.json', output), JSON.stringify({
    method: 'Built Viewer and real loopback HTTP gateway with isolated provider fixture; no LIVE room or real gifts.',
    browser: browser.version(), checkpoints: report, errors, origins: [...new Set(requests)],
  }, null, 2) + '\n');
  console.log('Built Viewer LIVE input and WebGL fixture passed');
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}