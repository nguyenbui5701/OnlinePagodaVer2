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
import { AudioSettingsStore, SettingsStore } from '../../../packages/v2-live-gateway/settings.mjs';
import { mapEvent } from '../../../packages/v2-live-gateway/mapper.mjs';
import { liveDefaults } from '../src/live-settings.ts';

const origin = 'http://127.0.0.1:5189';
const api = 'http://127.0.0.1:5203';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const local = new URL('../evidence/p10b6-local/', import.meta.url);
const evidence = new URL('../../../packages/v2-live-gateway/evidence/p10b6/', import.meta.url);
const tmp = await mkdtemp(join(tmpdir(), 'pagoda-live-audio-'));
const room = '90001';
let receive;
let launches = 0;
let stops = 0;
let failLink = false;
let saves = 0;
const audioPaths = new Set();
const withoutIdle = process.argv.includes('--without-idle-library');
const gateway = new Gateway((username, deliver) => {
  assert.equal(username, 'audio_fixture');
  launches++;
  receive = deliver;
  return () => { stops++; };
});
const audio = new AudioSettingsStore(join(tmp, 'audio-settings.json'));
const server = createGatewayServer({ gateway, settings: new SettingsStore(join(tmp, 'settings.json')), audio });
const port = Number(process.env.V2_FIXTURE_VIEWER_PORT || 5193);
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const wait = async (fn, description, timeout = 20_000) => {
  const deadline = Date.now() + timeout;
  while (!fn()) {
    assert(Date.now() < deadline, description);
    await new Promise(resolve => setTimeout(resolve, 35));
  }
};
const waitPage = (page, fn, argument) => page.waitForFunction(fn, argument, { polling: 70, timeout: 24_000 });
const errors = [];
let browser;
let built;

async function browserContext(viewerPort) {
  const context = await browser.newContext({ viewport: { width: 720, height: 1280 } });
  await context.addInitScript(installCapture);
  await context.route(origin + '/**', async route => {
    const url = new URL(route.request().url());
    url.port = String(viewerPort);
    if (url.pathname.includes('/audio/')) audioPaths.add(url.pathname);
    if (withoutIdle && url.pathname === '/audio/vi-gtts-demo-v1/manifest.json') return route.fulfill({ status: 404, body: '' });
    const response = await fetch(url, { redirect: 'error' });
    await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') ?? undefined,
      body: Buffer.from(await response.arrayBuffer()) });
  });
  await context.route(api + '/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    url.port = String(server.address().port);
    if (failLink && url.pathname === '/poll' && request.method() === 'POST') return route.abort('connectionrefused');
    if (url.pathname === '/save-audio' && request.method() === 'POST') saves++;
    const headers = await request.allHeaders();
    delete headers.host;
    delete headers['content-length'];
    const response = await fetch(url, { method: request.method(), headers, body: request.postData() ?? undefined });
    const forwarded = Object.fromEntries(response.headers);
    delete forwarded['content-encoding'];
    delete forwarded['content-length'];
    await route.fulfill({ status: response.status, headers: forwarded, body: Buffer.from(await response.arrayBuffer()) });
  });
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  return context;
}

function installCapture() {
  // Passive tap on the existing output. A zero-gain branch keeps the PCM recorder running.
  const NativeContext = window.AudioContext;
  window.createdContexts = 0;
  window.AudioContext = class extends NativeContext {
    constructor() { super(); window.createdContexts++; }
  };
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (target, ...parameters) {
    const result = connect.call(this, target, ...parameters);
    const ctx = this.context;
    if (target !== ctx.destination || window.audioTap) return result;
    const pcm = [];
    const node = ctx.createScriptProcessor(1024, 1, 1);
    node.onaudioprocess = event => {
      const data = event.inputBuffer.getChannelData(0);
      for (const sample of data) pcm.push(Math.max(-32768, Math.min(32767, Math.round(sample * 32768))));
    };
    connect.call(this, node);
    const silent = ctx.createGain();
    silent.gain.value = 0;
    connect.call(node, silent);
    connect.call(silent, target);
    window.audioTap = {
      rate: ctx.sampleRate,
      sample: () => pcm.length,
      encode: () => {
        const bytes = new Uint8Array(Int16Array.from(pcm).buffer);
        let raw = '';
        for (let i = 0; i < bytes.length; i += 16384) raw += String.fromCharCode(...bytes.subarray(i, i + 16384));
        return btoa(raw);
      },
    };
    return result;
  };
}

async function interval(page, ms = 500) {
  const from = await page.evaluate(() => window.audioTap.sample());
  await page.waitForTimeout(ms);
  const to = await page.evaluate(() => window.audioTap.sample());
  assert(to > from, 'Web Audio PCM tap did not advance');
  return [from, to];
}

function metrics(pcm, [from, to] = [0, pcm.length / 2]) {
  let sum = 0;
  let peak = 0;
  let clipping = 0;
  for (let i = from; i < to; i++) {
    const sample = pcm.readInt16LE(i * 2);
    sum += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
    clipping += Number(Math.abs(sample) >= 32767);
  }
  const db = value => value ? Number((20 * Math.log10(value / 32768)).toFixed(2)) : null;
  return { from, to, rms: Math.sqrt(sum / (to - from)), peak, peakDbFS: db(peak), clipping };
}

function wav(pcm, rate) {
  const header = Buffer.alloc(44);
  header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

const result = { segments: {} };
try {
  built = await preview({ preview: { port } });
  browser = await chromium.launch({ executablePath: process.env.V2_BROWSER ||
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const live = await browserContext(port);
  let dashboard = await live.newPage();
  await dashboard.setViewportSize({ width: 1240, height: 1000 });
  await dashboard.goto(origin + '/dashboard/');
  const overlay = await live.newPage();
  await overlay.goto(origin + '/overlay/');
  await wait(() => gateway.overlayReady && gateway.audioApplied?.state === 'MUTED', 'default muted and attached');
  await overlay.locator('#capture').click();
  assert.equal(await overlay.evaluate(() => window.createdContexts), 0);
  const owner = gateway.owner;
  await dashboard.locator('#username').fill('audio_fixture');
  await dashboard.locator('#connect').click();
  await wait(() => launches === 1, 'fixture launch');
  receive({ type: 'connected', room });
  await wait(() => gateway.acknowledged === 1, 'accepted session ACK');
  const instance = await overlay.evaluate(() => { window.sceneIdentity = crypto.randomUUID(); return window.sceneIdentity; });

  const edit = changes => dashboard.evaluate(changes => {
    for (const [field, value] of Object.entries(changes)) {
      const input = document.getElementById('audio-' + field);
      if (typeof value === 'boolean') input.checked = value;
      else input.value = String(value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, changes);
  async function apply(changes, expected) {
    const revision = audio.snapshot.revision;
    await edit(changes);
    await wait(() => audio.snapshot.revision > revision && gateway.audioApplied?.revision === audio.snapshot.revision,
      'audio revision propagated to active receiver');
    if (expected) await wait(() => gateway.audioApplied?.state === expected, 'audio state ' + expected);
  }

  await apply({ master: true, wind: false, idleBell: false, 'water-volume': 75 }, 'LOCKED');
  await overlay.evaluate(() => document.querySelector('#capture').click());
  assert.equal(await overlay.evaluate(() => window.createdContexts), 0, 'synthetic click cannot unlock');
  await overlay.locator('#capture').click();
  await wait(() => gateway.audioApplied?.state === 'READY', 'native gesture unlocked connected Overlay');
  assert.equal(await overlay.evaluate(() => window.createdContexts), 1);
  assert.equal(await dashboard.evaluate(() => window.createdContexts), 0);
  await overlay.waitForTimeout(400);
  result.segments.waterHigh = await interval(overlay, 3200);

  const before = saves;
  const revision = audio.snapshot.revision;
  await dashboard.evaluate(() => {
    const slider = document.querySelector('#audio-water-volume');
    for (let v = 75; v >= 15; v--) {
      slider.value = String(v);
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    }
    slider.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await wait(() => gateway.audioApplied?.revision === revision + 1, 'final slider update');
  assert.equal(saves - before, 1);
  assert.equal(audio.snapshot.settings.water.volume, 15);
  await overlay.waitForTimeout(350);
  result.segments.waterLow = await interval(overlay, 3200);
  await apply({ water: false, wind: true, 'wind-volume': 80 }, 'READY');
  await overlay.waitForTimeout(350);
  result.segments.windOnly = await interval(overlay);
  await apply({ wind: false }, 'READY');
  await overlay.waitForTimeout(200);
  result.segments.bothBedsOff = await interval(overlay);

  const competing = await live.newPage();
  await competing.goto(origin + '/overlay/');
  await waitPage(competing, () => window.viewerReport?.liveReason === 'RECEIVER_BUSY');
  await competing.locator('#capture').click();
  assert.equal(await competing.evaluate(() => window.createdContexts), 0);
  await competing.close();
  assert.equal(gateway.owner, owner);
  // Reaffirm explicit activation in case the browser hid the primary Overlay while bringing tabs forward.
  await overlay.locator('#capture').click();
  await wait(() => gateway.audioApplied?.state === 'READY', 'primary Overlay still owns audio');
  const demo = await live.newPage();
  await demo.goto(origin + '/?demo=idle&audio=on&clean=1');
  await demo.locator('#audio-controls button').first().click();
  await waitPage(demo, () => window.viewerReport?.audio?.status === 'BLOCKED');
  assert.equal(await demo.evaluate(() => !!window.audioTap), false);
  await demo.close();
  await overlay.locator('#capture').click();
  await wait(() => gateway.audioApplied?.state === 'READY', 'Overlay retains Web Lock');

  await apply({ giftThanks: true, idleWish: true, 'idle-seconds': 10 }, 'READY');
  await wait(() => ['AVAILABLE', 'UNAVAILABLE'].includes(gateway.audioApplied?.wishes) &&
    ['AVAILABLE', 'UNAVAILABLE'].includes(gateway.audioApplied?.thanks), 'validated speech or truthful fallback');
  result.clips = { thanks: gateway.audioApplied.thanks, wishes: gateway.audioApplied.wishes };
  assert.equal(result.clips.thanks, 'AVAILABLE');
  const wishAvailable = result.clips.wishes === 'AVAILABLE';
  if (withoutIdle) assert.equal(wishAvailable, false);
  if (!wishAvailable) await apply({ idleBell: true }, 'READY');
  const idle = await waitPage(overlay, () => window.viewerReport?.audio?.marks.findLast(mark => mark.event === 'idle-start'));
  result.idleStarted = await idle.jsonValue();
  assert.match(result.idleStarted.variant, wishAvailable ? /^wish-/ : /^lotus-bell-/);
  await overlay.waitForTimeout(380);
  const gift = id => {
    const raw = { common: { roomId: room, msgId: String(id), createTime: String(Date.now()) },
      user: { id: '101', nickname: 'An' }, giftId: '5655', groupId: String(id), repeatEnd: 1, repeatCount: 1, gift: { type: 1 } };
    receive({ type: 'event', event: mapEvent('gift', raw, room, Date.now()) });
  };
  gift(501);
  gift(501);
  await waitPage(overlay, () => window.viewerReport?.audio?.marks.some(mark => mark.event === 'voice-start'));
  const focus = await overlay.evaluate(() => ({
    mode: window.viewerReport.mode, focus: window.viewerReport.focus, confirmed: window.viewerReport.confirmedGiftCount,
  }));
  assert.equal(focus.mode, 'GIFT_FOCUS');
  assert.equal(focus.confirmed, 1);
  assert.equal(focus.focus.seatId, 'seat-1');
  const focusPng = await overlay.locator('#stage').screenshot();
  assert.deepEqual([focusPng.readUInt32BE(16), focusPng.readUInt32BE(20)], [720, 1280]);
  await waitPage(overlay, () => window.viewerReport.audio.marks.some(mark => mark.event === 'voice-end'));
  const marks = await overlay.evaluate(() => window.viewerReport.audio.marks);
  const cut = marks.find(mark => mark.event === 'idle-cut' && mark.reason === 'gift-activity');
  const cutEnd = marks.find(mark => mark.event === 'idle-cut-end' && mark.reason === 'gift-activity');
  const voice = marks.filter(mark => mark.event === 'voice-start');
  const chime = marks.filter(mark => mark.event === 'sfx-start');
  assert.equal(voice.length, 1);
  assert.equal(chime.length, 1);
  assert.equal(voice[0].request, chime[0].request);
  assert.equal(voice[0].seat, focus.focus.seatId);
  assert.match(voice[0].variant, /^generic/);
  assert(cut && cutEnd && cutEnd.wallMs - cut.wallMs <= 100);
  assert(voice[0].contextSec > cutEnd.contextSec);
  result.gift = { focus, cutLatencyMs: cutEnd.wallMs - cut.wallMs, cut, cutEnd, voice: voice[0], chime: chime[0] };

  await dashboard.reload();
  await dashboard.locator('#audio-state').getByText(/Đã lưu r/).waitFor();
  assert.equal(await dashboard.evaluate(() => window.createdContexts), 0);
  await dashboard.locator('#audio-state').scrollIntoViewIfNeeded();
  const dashboardPng = await dashboard.screenshot({ fullPage: true });
  await apply({ master: false, water: true }, 'MUTED');
  gift(502);
  await waitPage(overlay, () => window.viewerReport.confirmedGiftCount === 2);
  await wait(() => gateway.acknowledged === gateway.sequence, 'muted gifts acknowledged normally');
  await overlay.waitForTimeout(200);
  result.segments.masterOff = await interval(overlay);
  assert.equal(await overlay.evaluate(() => window.viewerReport.audio.marks.filter(mark => mark.event === 'voice-start').length), 1);
  await apply({ master: true }, 'READY');
  await overlay.waitForTimeout(300);
  result.segments.resumed = await interval(overlay);
  await dashboard.close();
  const continued = await overlay.evaluate(() => ({ instance: window.sceneIdentity, noReplay:
    window.viewerReport.audio.marks.filter(mark => mark.event === 'voice-start').length }));
  assert.equal(continued.instance, instance);
  assert.equal(continued.noReplay, 1);
  assert.equal(gateway.owner, owner);
  assert.equal(launches, 1);
  assert.equal(stops, 0);
  assert.equal(gateway.connection, 1);
  assert.equal(gateway.appliedRevision, 1);
  assert.equal(gateway.acknowledged, gateway.sequence);
  result.continuity = { launches, stops, connection: gateway.connection, appliedVisual: gateway.appliedRevision,
    acknowledged: gateway.acknowledged, counters: { ...gateway.counters }, contexts: 1 };

  // Hidden-document behavior is triggered explicitly because headless Edge need not hide background tabs.
  await overlay.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await wait(() => gateway.audioApplied?.state === 'MUTED', 'hidden Overlay mutes');
  await overlay.waitForTimeout(150);
  result.segments.hidden = await interval(overlay, 160);
  await overlay.evaluate(() => { delete document.hidden; });
  dashboard = await live.newPage();
  await dashboard.goto(origin + '/dashboard/');
  await dashboard.locator('#audio-master').waitFor();
  await waitPage(dashboard, () => !document.getElementById('audio-fields').disabled);
  await apply({ 'water-volume': 50 }, 'MUTED');
  await dashboard.close();
  await overlay.locator('#capture').click();
  await wait(() => gateway.audioApplied?.state === 'READY', 'gesture after visibility mute');

  await overlay.evaluate(() => {
    window.gpuLoss = document.querySelector('#capture').getContext('webgl2').getExtension('WEBGL_lose_context');
    window.gpuLoss.loseContext();
  });
  await wait(() => !gateway.overlayReady && gateway.audioApplied?.state === 'MUTED', 'WebGL loss silences but retains session');
  await overlay.waitForTimeout(180);
  result.segments.webglLost = await interval(overlay, 160);
  await overlay.evaluate(() => window.gpuLoss.restoreContext());
  await wait(() => gateway.overlayReady, 'actual rendered recovery');
  assert.equal(gateway.audioApplied?.state, 'MUTED');
  assert.equal(gateway.owner, owner);
  assert.equal(launches, 1);
  assert.equal(stops, 0);
  await overlay.locator('#capture').click();
  await wait(() => gateway.audioApplied?.state === 'READY', 'gesture after WebGL recovery');

  failLink = true;
  await waitPage(overlay, () => window.viewerReport?.liveReason === 'LOCAL_LINK_LOST');
  await overlay.waitForTimeout(65);
  result.segments.linkLost = await interval(overlay, 150);
  failLink = false;
  await wait(() => gateway.audioApplied?.state === 'READY', 'healthy connection resumes');
  const finalControl = await live.newPage();
  await finalControl.goto(origin + '/dashboard/');
  await finalControl.locator('#disconnect').click();
  await wait(() => stops === 1 && gateway.audioApplied?.state === 'DISCONNECTED', 'disconnect mutes the Overlay');
  await overlay.waitForTimeout(180);
  result.segments.disconnected = await interval(overlay);

  const packed = await overlay.evaluate(() => ({ rate: window.audioTap.rate, data: window.audioTap.encode(),
    source: window.viewerReport.repoRevision, graphics: window.viewerReport.graphics,
    marks: window.viewerReport.audio.marks }));
  const pcm = Buffer.from(packed.data, 'base64');
  const recording = wav(pcm, packed.rate);
  for (const [name, bounds] of Object.entries(result.segments)) result.segments[name] = metrics(pcm, bounds);
  assert(result.segments.waterHigh.rms > result.segments.waterLow.rms * 2);
  assert(result.segments.waterLow.rms > 5);
  assert(result.segments.windOnly.rms > 5);
  assert(result.segments.resumed.rms > 5);
  for (const name of ['bothBedsOff', 'masterOff', 'hidden', 'webglLost', 'linkLost', 'disconnected']) {
    assert.equal(result.segments[name].peak, 0, name);
  }
  const recordingName = withoutIdle ? 'live-audio-fallback.wav' : 'live-audio.wav';
  result.recording = { ...metrics(pcm), seconds: pcm.length / 2 / packed.rate, rate: packed.rate, sha256: sha(recording),
    pcmSha256: sha(pcm), file: 'apps/v2-viewer/evidence/p10b6-local/' + recordingName };
  assert(result.recording.peakDbFS <= -1 && result.recording.clipping === 0);
  result.source = packed.source;
  result.graphics = packed.graphics;
  result.timeline = packed.marks;
  result.browser = browser.version();
  result.audioPaths = [...audioPaths];
  assert(result.audioPaths.every(path => path.startsWith('/audio/')));
  assert(result.audioPaths.some(path => path === '/audio/vi-v1-approved/generic.voice.json'));
  // Verify failure of Web Audio initialization cannot block an otherwise healthy receiver.
  await overlay.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await wait(() => !gateway.owner, 'first Overlay releases lease');
  await overlay.close();
  const broken = await live.newPage();
  await broken.addInitScript(() => {
    window.AudioContext = class {
      constructor() { throw new Error('evidence: audio device unavailable'); }
    };
  });
  await broken.goto(origin + '/overlay/');
  await wait(() => gateway.overlayReady && gateway.audioApplied?.state === 'LOCKED', 'readiness independent of audio');
  await broken.locator('#capture').click();
  await wait(() => gateway.audioApplied?.state === 'UNAVAILABLE', 'unavailable audio reported from real entrypoint');
  await finalControl.locator('#username').fill('audio_fixture');
  await finalControl.locator('#connect').click();
  await wait(() => launches === 2, 'Connect after audio failure');
  receive({ type: 'connected', room });
  gift(503);
  await waitPage(broken, () => window.viewerReport?.confirmedGiftCount === 1);
  await wait(() => gateway.acknowledged === 2, 'consumed ACK after audio failure');
  assert.equal(await broken.evaluate(() => !!window.audioTap), false);
  result.audioFailure = { state: gateway.audioApplied.state, acknowledged: gateway.acknowledged,
    confirmed: await broken.evaluate(() => window.viewerReport.confirmedGiftCount) };
  assert.deepEqual(errors, []);

  await mkdir(local, { recursive: true });
  await mkdir(evidence, { recursive: true });
  await writeFile(new URL(recordingName, local), recording);
  if (!withoutIdle) {
    await writeFile(new URL('dashboard.png', evidence), dashboardPng);
    await writeFile(new URL('overlay.png', evidence), focusPng);
    result.captures = { dashboard: sha(dashboardPng), overlay: sha(focusPng) };
  }
  if (process.env.V2_FIXTURE_BASELINE_PORT) {
    const [oldContext, newContext] = await Promise.all([
      browserContext(Number(process.env.V2_FIXTURE_BASELINE_PORT)), browserContext(port),
    ]);
    await live.close();
    gateway.release();
    const before = await oldContext.newPage();
    const after = await newContext.newPage();
    assert.equal(audio.save(audio.snapshot.revision, {
      ...audio.snapshot.settings, master: { ...audio.snapshot.settings.master, enabled: false },
    }), undefined);
    // Step the actual capture entries at frame zero with the same offline settings.
    const frames = await Promise.all([before, after].map(async page => {
      await page.addInitScript(() => {
        const frame = window.requestAnimationFrame.bind(window);
        window.requestAnimationFrame = callback => frame(() => callback(1000));
      });
      await page.goto(origin + '/overlay/');
      await waitPage(page, () => window.viewerReport?.elapsedSeconds === 0);
      const png = await page.locator('#stage').screenshot();
      return { sha256: sha(png), source: await page.evaluate(() => window.viewerReport.repoRevision) };
    }));
    assert.equal(frames[0].sha256, frames[1].sha256);
    result.parity = { seed: liveDefaults.seed, seconds: 0, pixels: [720, 1280], before: frames[0], after: frames[1] };
    await oldContext.close();
    await newContext.close();
  }
  await writeFile(new URL(withoutIdle ? 'fallback.json' : 'receipt.json', evidence), JSON.stringify({
    method: 'Built Edge Dashboard/Overlay, isolated loopback Gateway and synthetic provider fixture; PCM tapped after the actual Web Audio compressor and peak ceiling.',
    ...result,
  }, null, 2) + '\n');
  console.log('Live audio fixture passed', result.recording, result.clips);
} finally {
  await browser?.close();
  await built?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  await rm(tmp, { recursive: true, force: true });
}
