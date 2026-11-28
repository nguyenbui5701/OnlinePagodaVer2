import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { Gateway } from '../../../packages/v2-live-gateway/gateway.mjs';
import { createGatewayServer } from '../../../packages/v2-live-gateway/server.mjs';
import { AudioSettingsStore, PresenceSettingsStore, SettingsStore } from '../../../packages/v2-live-gateway/settings.mjs';
import { createIngress } from '../../../packages/v2-live-gateway/ingress.mjs';
import { audioDefaults } from '../src/live-audio-settings.ts';
import { liveDefaults } from '../src/live-settings.ts';

const baseline = process.argv.includes('--baseline');
const profile = process.env.V2_SOAK_PROFILE ?? 'eco';
const soakMs = Number(process.env.V2_SOAK_MS ?? 305_000);
const viewerPort = Number(process.env.V2_FIXTURE_VIEWER_PORT ?? 5196);
const origin = 'http://127.0.0.1:5189', api = 'http://127.0.0.1:5203';
const folder = resolve(process.env.V2_EVIDENCE_DIR ?? '../../packages/v2-live-gateway/evidence/p10b9-reliability');
const temp = await mkdtemp(join(tmpdir(), 'pagoda-26a-'));
const room = '98025';
const started = Date.now();
const trace = [];
const note = (event, details = {}) => {
  const entry = { event, sinceMs: Date.now() - started, ...details };
  trace.push(entry);
  console.log(JSON.stringify(entry));
};
let send;
let launches = 0;
const gateway = new Gateway((_, cb) => { send = cb; launches++; return () => {}; });
const settings = new SettingsStore(join(temp, 'settings.json'));
const audio = new AudioSettingsStore(join(temp, 'audio.json'));
const presence = new PresenceSettingsStore(join(temp, 'presence.json'));
assert.equal(settings.save(1, { ...liveDefaults, profile, tree: 'r18a', density: 'lush', environment: 'on' }), undefined);
assert.equal(audio.save(1, { ...audioDefaults, master: { enabled: true, volume: 100 }, idleSeconds: 10,
  giftThanks: { enabled: true, volume: 85 } }), undefined);
assert.equal(presence.patch(1, { seatExpiryEnabled: false }), undefined);
const server = createGatewayServer({ gateway, settings, audio, presence });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const ingress = createIngress((message, done) => { send(message); done(); return true; }, () => { throw Error('fixture IPC failed'); });
const fixtureStart = Date.now();
const wait = async (condition, label, timeout = 15000) => {
  const limit = Date.now() + timeout;
  let result;
  while (!(result = await condition())) {
    assert(Date.now() < limit, label);
    await new Promise(resolve => setTimeout(resolve, 35));
  }
  return result;
};

function captureAudio() {
  window.visibilityTrace = [{ at: Date.now(), state: document.visibilityState, focus: document.hasFocus() }];
  const change = () => window.visibilityTrace.push({ at: Date.now(), state: document.visibilityState, focus: document.hasFocus() });
  document.addEventListener('visibilitychange', change);
  window.addEventListener('focus', change);
  window.addEventListener('blur', change);
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (target, ...args) {
    const result = connect.call(this, target, ...args);
    const context = this.context;
    if (target !== context.destination || window.pcmTap) return result;
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    connect.call(this, analyser);
    const stream = context.createMediaStreamDestination();
    connect.call(this, stream);
    const recorder = new MediaRecorder(stream.stream, { mimeType: 'audio/webm;codecs=opus' });
    const bits = [];
    recorder.ondataavailable = event => bits.push(event.data);
    recorder.start(1000);
    const block = new Float32Array(analyser.fftSize);
    const states = [context.state];
    context.addEventListener('statechange', () => states.push(context.state));
    window.pcmTap = {
      context, states,
      measure() {
        analyser.getFloatTimeDomainData(block);
        return { rms: Math.sqrt(block.reduce((sum, x) => sum + x*x, 0) / block.length),
          peak: block.reduce((peak, x) => Math.max(peak, Math.abs(x)), 0), state: context.state,
          hidden: document.hidden, focus: document.hasFocus(), audioTime: context.currentTime };
      },
      finish: () => new Promise(resolve => {
        recorder.onstop = () => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(',')[1]);
          reader.readAsDataURL(new Blob(bits, { type: recorder.mimeType }));
        };
        recorder.stop();
      }),
    };
    return result;
  };
}

let viewer;
let browser;
try {
  await mkdir(folder, { recursive: true });
  viewer = await preview({ ...(baseline && { root: process.env.V2_PR30_APP }), preview: { port: viewerPort } });
  browser = await chromium.launch({ headless: false, executablePath: process.env.V2_BROWSER ||
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--window-size=1000,900'] });
  const context = await browser.newContext({ viewport: { width: 720, height: 1280 } });
  await context.addInitScript(captureAudio);
  const errors = [];
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  for (const [host, target] of [[origin, viewerPort], [api, server.address().port]]) {
    await context.route(host + '/**', async route => {
      const request = route.request(), url = new URL(request.url());
      url.port = String(target);
      const headers = host === origin ? {} : await request.allHeaders();
      delete headers.host;
      delete headers['content-length'];
      const response = await fetch(url, { method: request.method(), headers, body: request.postData() ?? undefined });
      const output = Object.fromEntries(response.headers);
      delete output['content-length'];
      delete output['content-encoding'];
      await route.fulfill({ status: response.status, headers: output, body: Buffer.from(await response.arrayBuffer()) });
    });
  }
  const overlay = await context.newPage();
  await overlay.goto(origin + '/overlay/');
  await wait(() => gateway.overlayReady, 'Overlay attach');
  const dashboard = await context.newPage();
  await dashboard.setViewportSize({ width: 1150, height: 900 });
  await dashboard.goto(origin + '/dashboard/');
  await dashboard.locator('#username').fill('reliability_fixture');
  await dashboard.locator('#connect').click();
  await wait(() => launches === 1, 'fixture worker active');
  send({ type: 'connected', room });
  ingress.flush();
  await wait(() => gateway.acknowledged === 1, 'open consumed');
  await overlay.bringToFront();
  const measure = () => overlay.evaluate(() => window.pcmTap?.measure());
  const read = () => overlay.evaluate(() => ({ source: window.viewerReport.repoRevision, gpu: window.viewerReport.graphics,
    marks: window.viewerReport.audio?.marks ?? [], suppressed: window.viewerReport.audio?.suppressed,
    tick: window.viewerReport.liveTickMs, ...window.viewerReport.audio?.applied }));
  assert.equal(await measure(), undefined, 'no context before trusted gesture');
  await overlay.locator('#capture').click();
  await wait(async () => (await measure())?.rms > .0001, 'foreground Web Audio signal');
  const owner = gateway.owner;
  const source = (await read()).source;
  note('foreground', { source, gpu: (await read()).gpu, ...(await measure()) });
  const waitAck = () => wait(() => gateway.acknowledged === gateway.sequence, 'consumed ACK prefix');
  let message = 900;
  function packet(kind, id, fields = {}) {
    const at = Date.now();
    ingress.receive(kind, { common: { roomId: room, msgId: String(++message), createTime: String(at) },
      user: id === undefined ? undefined : { id: String(id), nickname: 'DEMO ' + id }, ...fields }, room, fixtureStart, at);
    ingress.flush();
    return at;
  }
  function gift(id) {
    const group = String(++message);
    return packet('gift', id, { giftId: '1', groupId: group, repeatCount: 1, repeatEnd: 1, gift: { type: 1 } });
  }
  const seatLatencies = [];
  async function joined(kind, id, expected, fields) {
    const at = packet(kind, id, fields);
    await wait(() => gateway.presenceApplied?.occupied === expected, 'seat ' + expected);
    await waitAck();
    seatLatencies.push(Date.now() - at);
  }
  await joined('member', 11, 1);
  await dashboard.bringToFront();
  await wait(async () => (await measure())?.hidden, 'real Dashboard foreground did not hide Overlay');
  if (baseline) {
    const sample = await wait(async () => {
      const pcm = await measure(), state = await read();
      return pcm.rms === 0 && state.state === 'MUTED' && pcm;
    }, 'baseline visibility-only mute');
    note('baseline-hidden-mute', sample);
  } else {
    const hiddenAt = Date.now();
    await joined('chat', 12, 2, { content: 'Synthetic chat' });
    await dashboard.locator('#presence-autoJoinLike').check();
    await wait(() => gateway.presenceApplied?.revision === presence.snapshot.revision, 'opt-in Like settings applied');
    await joined('like', 13, 3, { count: 1 });
    const waitingAt = packet('member', 14);
    await wait(() => gateway.presenceApplied?.waiting === 1, 'waiting shown');
    const waitingMs = Date.now() - waitingAt;
    gift(11);
    await waitAck();
    await wait(async () => (await read()).marks.some(mark => mark.event === 'sfx-start' && !mark.seat), 'offscreen chime');
    await wait(async () => (await read()).marks.some(mark => mark.event === 'idle-start'), 'idle cue while hidden', 20000);
    await wait(() => Date.now() - hiddenAt > 16000, 'hidden interval');
    assert.equal(gateway.owner, owner);
    const hidden = await measure();
    assert(hidden.hidden && hidden.rms > .0001);
    note('hidden-over-15s', { waitingMs, seatLatencies, ack: gateway.acknowledged, ...hidden });
    await dashboard.locator('#audio-mute').click();
    await wait(async () => (await measure())?.rms === 0 && gateway.audioApplied?.state === 'MUTED', 'silent after Master OFF');
    note('master-off-hidden', await measure());
    await dashboard.locator('#audio-master').check();
    await wait(async () => (await measure())?.rms > .0001, 'Master ON with prior gesture');
    note('master-on-hidden', await measure());

    const other = await context.newPage();
    await other.goto('about:blank');
    await other.bringToFront();
    await wait(async () => (await measure())?.hidden, 'other tab hides source');
    note('other-tab', await measure());
    const child = context.waitForEvent('page');
    await dashboard.evaluate(() => window.open('about:blank', '_blank', 'popup,width=360,height=320'));
    const popup = await child;
    const cdp = await context.newCDPSession(overlay);
    const overlayWindow = await cdp.send('Browser.getWindowForTarget');
    const remote = await context.newCDPSession(popup);
    const popupWindow = await remote.send('Browser.getWindowForTarget');
    await popup.bringToFront();
    assert.notEqual(popupWindow.windowId, overlayWindow.windowId, 'popup is a distinct native window');
    note('separate-window', { distinct: true, ...(await measure()) });
    await cdp.send('Browser.setWindowBounds', { windowId: overlayWindow.windowId, bounds: { windowState: 'minimized' } });
    await wait(async () => (await measure())?.hidden, 'native minimize hides source');
    const bounds = await cdp.send('Browser.getWindowBounds', { windowId: overlayWindow.windowId });
    assert.equal(bounds.bounds.windowState, 'minimized');
    assert((await measure()).rms > .0001);
    note('native-minimize', { state: bounds.bounds.windowState, ...(await measure()) });
    await cdp.send('Browser.setWindowBounds', { windowId: overlayWindow.windowId, bounds: { windowState: 'normal' } });
    await popup.close();

    const soakStart = Date.now();
    let segment = 0, maxGap = 0;
    const seenGifts = new Set();
    while (Date.now() - soakStart < soakMs) {
      const phase = segment++ % 3;
      await (phase === 0 ? overlay : phase === 1 ? dashboard : other).bringToFront();
      await wait(async () => (await measure()).hidden === (phase !== 0), 'actual visibility follows foreground');
      const before = (await read()).tick;
      const at = packet('member', 11);
      if (phase !== 0) gift(12);
      await waitAck();
      maxGap = Math.max(maxGap, Date.now() - at);
      const until = Math.min(soakStart + soakMs, Date.now() + 18700);
      while (Date.now() < until) await new Promise(resolve => setTimeout(resolve, 200));
      const pcm = await measure(), state = await read();
      assert(pcm.rms > .0001 && pcm.state === 'running' && state.tick > before);
      assert.equal(gateway.owner, owner);
      assert.equal(launches, 1);
      for (const mark of state.marks.filter(mark => mark.event === 'sfx-start' && !mark.seat)) seenGifts.add(mark.request);
      note('soak-segment', { segment, ack: gateway.acknowledged, state: state.state, tick: state.tick, ...pcm });
    }
    const soakElapsed = Date.now() - soakStart;
    await overlay.bringToFront();
    await wait(async () => !(await measure()).hidden, 'return visible');
    const hiddenVoices = (await read()).marks.filter(mark => mark.event === 'voice-start').length;
    assert.equal(hiddenVoices, 0, 'offscreen gifts must not replay upon return');
    gift(11);
    await wait(async () => (await read()).marks.some(mark => mark.event === 'voice-start' && mark.seat === 'seat-1'), 'visible Gift Camera and approved voice');
    await wait(async () => (await read()).marks.some(mark => mark.event === 'voice-end'), 'audible voice ends');
    const statesBefore = await overlay.evaluate(() => window.pcmTap.states.length);
    await overlay.evaluate(() => window.pcmTap.context.suspend());
    await wait(async () => (await measure())?.rms > .0001, 'recover genuinely suspended Web Audio context');
    const states = await overlay.evaluate(n => window.pcmTap.states.slice(n), statesBefore);
    assert(states.includes('suspended') && states.includes('running'));
    note('soak-complete', { soakElapsed, maxGap, seenOffscreenChimes: seenGifts.size, states });

    const duplicate = await context.newPage();
    await duplicate.goto(origin + '/overlay/');
    await wait(() => gateway.owner === owner, 'receiver ownership');
    await duplicate.locator('#capture').click();
    assert.equal(await duplicate.evaluate(() => !!window.pcmTap), false);
    await dashboard.bringToFront();
    await dashboard.locator('#disconnect').click();
    await wait(() => gateway.audioApplied?.state === 'DISCONNECTED', 'disconnected audio state');
    await wait(async () => (await measure())?.rms === 0, 'disconnected PCM silence');
    note('disconnect-silent', await measure());
    const encoded = await overlay.evaluate(() => window.pcmTap.finish());
    await writeFile(join(folder, profile + '-output.webm'), Buffer.from(encoded, 'base64'));
    await duplicate.close();
    await overlay.close();
    await wait(() => gateway.owner === undefined, 'pagehide releases receiver');
    const restarted = await context.newPage();
    await restarted.goto(origin + '/overlay/');
    await wait(() => gateway.overlayReady, 'new load claims receiver');
    assert.notEqual(gateway.owner, owner);
    assert.equal(await restarted.evaluate(() => !!window.pcmTap), false);
    note('close-reload', { oldOwnerReleased: true, gestureRequired: true });
    await dashboard.screenshot({ path: join(folder, profile + '-dashboard.png'), fullPage: true });
  }
  assert.deepEqual(errors, []);
  const out = { profile, baseline, source, browser: browser.version(), seatLatencies, trace,
    diagnostics: gateway.statusSnapshot().presenceDiagnostics };
  await writeFile(join(folder, (baseline ? 'baseline-' : '') + profile + '.json'), JSON.stringify(out, null, 2) + '\n');
} finally {
  await browser?.close();
  await viewer?.close();
  gateway.release();
  server.closeAllConnections();
  await new Promise(done => server.close(done));
  await rm(temp, { recursive: true, force: true });
}
