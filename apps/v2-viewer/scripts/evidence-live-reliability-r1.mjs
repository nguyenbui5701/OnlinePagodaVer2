import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { Gateway } from '../../../packages/v2-live-gateway/gateway.mjs';
import { createGatewayServer } from '../../../packages/v2-live-gateway/server.mjs';
import { AudioSettingsStore, PresenceSettingsStore, SettingsStore } from '../../../packages/v2-live-gateway/settings.mjs';
import { createIngress } from '../../../packages/v2-live-gateway/ingress.mjs';
import { WebSocket, WebSocketServer } from '../../../packages/v2-live-gateway/node_modules/ws/wrapper.mjs';
import { audioDefaults } from '../src/live-audio-settings.ts';
import { liveDefaults } from '../src/live-settings.ts';

const origin = 'http://127.0.0.1:5189', room = '98026';
const temp = await mkdtemp(join(tmpdir(), 'pagoda-normal-'));
const folder = resolve(process.env.V2_EVIDENCE_DIR || '../../packages/v2-live-gateway/evidence/p10b9-reliability/r1');
mkdirSync(folder, { recursive: true });
const log = join(folder, 'quality-normal.jsonl');
writeFileSync(log, '');
const start = Date.now();
function note(event, details = {}) {
  const line = JSON.stringify({ event, sinceMs: Date.now() - start, ...details });
  appendFileSync(log, line + '\n');
  console.log(line);
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function wait(action, label, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await action();
    if (value) return value;
    await delay(100);
  }
  throw Error(label);
}

function captureAudio() {
  window.nativeVisibility = [{ at: Date.now(), state: document.visibilityState }];
  document.addEventListener('visibilitychange', () => {
    window.nativeVisibility.push({ at: Date.now(), state: document.visibilityState });
  });
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (target, ...args) {
    const result = connect.call(this, target, ...args);
    if (target !== this.context.destination || window.pcmTap) return result;
    const context = this.context;
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    // Passively inspect the real mixer output. This branch has no media stream or playback destination.
    connect.call(this, analyser);
    const pcm = new Float32Array(analyser.fftSize);
    window.pcmTap = () => {
      analyser.getFloatTimeDomainData(pcm);
      return { rms: Math.sqrt(pcm.reduce((sum, x) => sum + x*x, 0) / pcm.length),
        peak: pcm.reduce((peak, x) => Math.max(peak, Math.abs(x)), 0), audioTime: context.currentTime,
        context: context.state, hidden: document.hidden, focus: document.hasFocus(),
        visibility: window.nativeVisibility, cues: window.viewerReport.audio?.marks ?? [] };
    };
    return result;
  };
}

let send, viewer, browser, relay, edge, server;
let launches = 0;
const gateway = new Gateway((_, callback) => { send = callback; launches++; return () => {}; });
try {
  const settings = new SettingsStore(join(temp, 'visual.json'));
  const audio = new AudioSettingsStore(join(temp, 'audio.json'));
  const presence = new PresenceSettingsStore(join(temp, 'presence.json'));
  assert.equal(settings.save(1, { ...liveDefaults, profile: 'quality', tree: 'r18a', density: 'lush', environment: 'on' }), undefined);
  assert.equal(audio.save(1, { ...audioDefaults, master: { enabled: true, volume: 100 }, idleSeconds: 10 }), undefined);
  assert.equal(presence.patch(1, { seatExpiryEnabled: false }), undefined);
  server = createGatewayServer({ gateway, settings, audio, presence });
  server.listen(5203, '127.0.0.1');
  await once(server, 'listening');
  viewer = await preview({ preview: { host: '127.0.0.1', port: 5189, strictPort: true } });
  const userDir = join(temp, 'browser');
  edge = spawn(process.env.V2_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    ['--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check',
      '--window-size=1000,900', '--user-data-dir=' + userDir, 'about:blank'],
    { stdio: 'ignore' });
  const port = await wait(async () => {
    try { return (await readFile(join(userDir, 'DevToolsActivePort'), 'utf8')).split(/\r?\n/)[0]; }
    catch (error) { if (error.code !== 'ENOENT' && error.code !== 'EBUSY') throw error; }
  }, 'native browser DevTools port');
  const version = await fetch('http://127.0.0.1:' + port + '/json/version').then(response => response.json());
  // Playwright turns on focus emulation per attached session. Leave native page visibility in charge.
  relay = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  await once(relay, 'listening');
  relay.on('connection', client => {
    const native = new WebSocket(version.webSocketDebuggerUrl);
    const opened = once(native, 'open');
    client.on('message', async payload => {
      const { id, sessionId, method } = JSON.parse(payload);
      if (method === 'Emulation.setFocusEmulationEnabled') {
        client.send(JSON.stringify({ id, sessionId, result: {} }));
        return;
      }
      await opened;
      if (native.readyState === WebSocket.OPEN) native.send(payload.toString());
    });
    native.on('message', payload => { if (client.readyState === WebSocket.OPEN) client.send(payload.toString()); });
    native.on('close', () => client.close());
    client.on('close', () => native.close());
  });
  browser = await chromium.connectOverCDP('ws://127.0.0.1:' + relay.address().port);
  const [context] = browser.contexts();
  await context.addInitScript(captureAudio);
  const [overlay] = context.pages();
  const errors = [];
  overlay.on('pageerror', error => errors.push(error.message));
  const overlayCDP = await context.newCDPSession(overlay);
  const { windowId } = await overlayCDP.send('Browser.getWindowForTarget');
  const windowState = state => overlayCDP.send('Browser.setWindowBounds', { windowId, bounds: { windowState: state } });
  const activate = () => (spawnSync('powershell.exe', ['-NoProfile', '-Command', `
    Add-Type -Name Window -Namespace Fixture -MemberDefinition '
      [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr window);
    '
    $handle = (Get-Process -Id ${edge.pid}).MainWindowHandle
    if ($handle -ne [IntPtr]::Zero) { [void][Fixture.Window]::BringWindowToTop($handle) }
    (New-Object -ComObject WScript.Shell).AppActivate(${edge.pid})
  `], { windowsHide: true, encoding: 'utf8' })
    .stdout?.trim() === 'True');
  const nativeActivated = activate();
  await overlay.bringToFront();
  await overlay.setViewportSize({ width: 720, height: 1280 });
  await overlay.goto(origin + '/overlay/');
  try {
    if (await overlay.evaluate(() => document.hidden)) {
      // Move the real window to trigger a fresh native occlusion calculation.
      await windowState('minimized');
      await windowState('normal');
      await overlayCDP.send('Browser.setWindowBounds', { windowId, bounds: { left: 12, top: 24, width: 1120, height: 870 } });
      activate();
      await overlay.bringToFront();
    }
    await wait(() => gateway.overlayReady, 'Overlay never rendered ready');
  } catch (error) {
    note('startup-diagnostics', { nativeActivated, errors, overlay: await overlay.evaluate(() => ({
      visibility: document.visibilityState, focus: document.hasFocus(), draws: window.viewerReport?.drawCalls,
    })) });
    throw error;
  }
  const root = await browser.newBrowserCDPSession();
  const tab = await root.send('Target.createTarget', { url: origin + '/dashboard/' });
  const dashboard = await wait(() => context.pages().find(page => page.url().endsWith('/dashboard/')), 'native Dashboard tab missing');
  await dashboard.bringToFront();
  await dashboard.locator('#username').fill('synthetic_r1');
  await dashboard.locator('#connect').click();
  await wait(() => launches === 1, 'local synthetic provider did not connect');
  send({ type: 'connected', room });
  const ingress = createIngress((message, done) => { send(message); done(); return true; }, () => assert.fail('IPC broke'));
  await overlay.bringToFront();
  await wait(() => gateway.acknowledged === 1, 'open not ACKed');
  const pcm = () => overlay.evaluate(() => window.pcmTap?.());
  assert.equal(await pcm(), undefined, 'autoplay before trusted gesture');
  await overlay.locator('#capture').click();
  await wait(async () => (await pcm())?.rms > .0001, 'no foreground PCM after gesture');
  const browserState = await overlay.evaluate(() => ({ source: window.viewerReport.repoRevision,
    graphics: window.viewerReport.graphics, world: window.viewerReport.world }));
  assert.equal(browserState.world.pond, true);
  const owner = gateway.owner;
  function ack() {
    return wait(() => gateway.owner === owner && gateway.sequence === gateway.acknowledged, 'lost receiver or ACK');
  }
  let packet = 10;
  function provide(kind, id, fields = {}) {
    const at = Date.now();
    ingress.receive(kind, { common: { roomId: room, msgId: String(++packet), createTime: String(at) },
      user: { id: String(id), nickname: 'Synthetic ' + id }, ...fields }, room, start, at);
    ingress.flush();
    return at;
  }
  async function member(id, seats) {
    const at = provide('member', id);
    await wait(() => gateway.presenceApplied?.occupied === seats, 'member did not acquire an available seat');
    await ack();
    return Date.now() - at;
  }
  function sample(value) {
    const { cues, visibility, ...levels } = value;
    return { ...levels, cues: cues.map(({ event, variant, seat }) => ({ event, variant, seat })),
      ack: gateway.acknowledged, offered: gateway.offered, pending: gateway.queue.length, ownerRetained: gateway.owner === owner };
  }
  note('foreground', { browser: browser.version(), profile: 'quality', ...browserState, ...sample(await pcm()) });
  await member(11, 1);
  activate();
  await dashboard.bringToFront();
  const firstHidden = await wait(async () => {
    const value = await pcm(); return value.hidden && value;
  }, 'native Dashboard tab did not hide Overlay');
  const hiddenFrom = firstHidden.visibility.at(-1).at;
  note('dashboard-tab', { ...sample(firstHidden), targetCreated: !!tab.targetId });
  const latency = await member(12, 2);
  note('hidden-member', { latency, ...sample(await pcm()) });

  const hiddenSamples = [];
  let issuedGift = false;
  while (Date.now() - hiddenFrom < 65_000) {
    const value = await pcm();
    assert(value.hidden, 'native visibility was interrupted');
    assert.equal(gateway.owner, owner, 'lease expired while hidden');
    hiddenSamples.push(value.rms);
    if (!issuedGift && Date.now() - hiddenFrom > 39_000) {
      issuedGift = true;
      provide('gift', 11, { giftId: '1', groupId: String(packet + 1), repeatCount: 1, repeatEnd: 1, gift: { type: 1 } });
      await ack();
      note('hidden-gift-ack', sample(await pcm()));
    }
    if (hiddenSamples.length % 5 === 1) note('hidden-sample', sample(value));
    await delay(700);
  }
  const hiddenEnd = await pcm();
  assert(hiddenEnd.hidden && hiddenEnd.visibility.at(-1).at === hiddenFrom);
  assert(issuedGift && hiddenSamples.every(rms => rms > 0));
  assert(hiddenSamples.some(rms => rms > .008), 'no measurable cue-level signal');
  assert(hiddenEnd.cues.some(cue => cue.event === 'idle-start') && hiddenEnd.cues.some(cue => cue.event === 'idle-end'));
  assert.deepEqual(hiddenEnd.cues.filter(cue => cue.event === 'sfx-start').map(cue => cue.seat), [undefined]);
  assert.equal(hiddenEnd.cues.filter(cue => cue.event === 'voice-start').length, 0);
  note('hidden-interval', { durationMs: Date.now() - hiddenFrom, samples: hiddenSamples.length,
    minRms: Math.min(...hiddenSamples), maxRms: Math.max(...hiddenSamples), ...sample(hiddenEnd) });

  await dashboard.bringToFront();
  await dashboard.locator('#audio-mute').click({ force: true });
  const muted = await wait(async () => {
    const value = await pcm(); return gateway.audioApplied?.state === 'MUTED' && value.rms === 0 && value;
  }, 'Master OFF did not mute actual background samples');
  assert(muted.hidden);
  note('master-off', sample(muted));
  await dashboard.locator('#audio-master').check({ force: true });
  const restored = await wait(async () => {
    const value = await pcm(); return value.rms > .0001 && value;
  }, 'Master ON did not restore actual background samples');
  assert(restored.hidden);
  note('master-on', sample(restored));

  activate();
  await overlay.bringToFront();
  let visibleSince;
  const returned = await wait(async () => {
    const value = await pcm();
    if (value.hidden || value.rms === 0) { visibleSince = undefined; return; }
    visibleSince ??= Date.now();
    return Date.now() - visibleSince >= 2500 && value;
  }, 'native Overlay did not return with sustained foreground PCM');
  assert.equal(returned.cues.filter(cue => cue.event === 'sfx-start').length, 1);
  assert.equal(returned.cues.filter(cue => cue.event === 'voice-start').length, 0);
  assert.equal(launches, 1);
  assert.equal(gateway.owner, owner);
  await ack();
  assert.deepEqual(errors, []);
  note('return-no-replay', { ...sample(returned), visibility: returned.visibility, launches,
    diagnostics: gateway.statusSnapshot().presenceDiagnostics });
  await root.send('Target.createTarget', { url: 'about:blank#separate', newWindow: true });
  const popup = await wait(() => context.pages().find(page => page.url() === 'about:blank#separate'), 'separate window missing');
  const popupCDP = await context.newCDPSession(popup);
  const popupWindow = (await popupCDP.send('Browser.getWindowForTarget')).windowId;
  assert.notEqual(windowId, popupWindow);
  await popup.bringToFront();
  const switched = await pcm();
  assert(!switched.focus && switched.rms > 0);
  note('separate-native-window', { distinct: true, ...sample(switched) });
  await windowState('minimized');
  const actual = await overlayCDP.send('Browser.getWindowBounds', { windowId });
  assert.equal(actual.bounds.windowState, 'minimized');
  const min = await pcm();
  assert(min.hidden && min.rms > 0);
  note('native-minimize', { windowState: actual.bounds.windowState, ...sample(min) });

  await ack();
  note('complete', { profile: 'quality', ownerRetained: gateway.owner === owner });
} catch (error) {
  note('failed', { error: error.message, status: gateway.status, ack: gateway.acknowledged });
  throw error;
} finally {
  if (browser?.isConnected()) {
    const root = await browser.newBrowserCDPSession();
    await root.send('Browser.close').catch(() => {});
    await browser.close();
  }
  if (edge && edge.exitCode === null && edge.signalCode === null) { edge.kill(); await once(edge, 'exit'); }
  if (relay) await new Promise(resolve => relay.close(resolve));
  await viewer?.close();
  gateway.release();
  if (server) {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
  await rm(temp, { recursive: true, force: true, maxRetries: 5 }).catch(() => {});
}
