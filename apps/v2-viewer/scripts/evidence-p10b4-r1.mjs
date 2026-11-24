import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const reviewed = '0f158bf9e5b79c56c3a5cc8c18dadf97a99eea03';
const source = process.env.V2_CAPTURE_REVISION ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const baseline = 'http://127.0.0.1:5198';
const candidate = 'http://127.0.0.1:5189';
const dev = 'http://127.0.0.1:5201';
const output = new URL('../evidence/p10b4/r1/', import.meta.url);
const viewport = { width: 720, height: 1280 };
const browser = await chromium.launch({
  executablePath: process.env.V2_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  ignoreDefaultArgs: ['--mute-audio'],
});
const result = { reviewed, source, browser: browser.version(), viewport, session: {}, failures: {}, parity: [] };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

async function usePage(origin, run, audio = false) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  const external = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (new URL(request.url()).origin !== origin) external.push(request.url()); });
  const voiceRequests = [];
  page.on('request', request => { if (request.url().endsWith('.voice.json')) voiceRequests.push(new URL(request.url()).pathname); });
  if (audio) await page.addInitScript(() => {
    // Test-only observation of the native signal on the same node as the browser destination.
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (target, ...args) {
      const connected = connect.call(this, target, ...args);
      if (this.context.destination === target && !window.readOutput) {
        const analyser = this.context.createAnalyser();
        analyser.fftSize = 256;
        connect.call(this, analyser);
        const data = new Float32Array(analyser.fftSize);
        window.readOutput = () => {
          analyser.getFloatTimeDomainData(data);
          return Math.max(...data.map(Math.abs));
        };
      }
      return connected;
    };
  });
  try {
    await run(page, voiceRequests);
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
  } finally {
    await page.close();
  }
}

const toggle = page => page.locator('#audio-controls button').first();
const bell = page => page.locator('#audio-controls button').nth(1);
const enable = async page => {
  await page.locator('#audio-controls input[type=checkbox]').check();
  await toggle(page).click();
  await page.evaluate(() => scrollTo(0, 0));
};

async function community() {
  await usePage(candidate, async (page, requests) => {
    await page.goto(candidate + '/?demo=community&profile=eco&clean=1&audio=on&tree=r17b&shots=hero&fx=off');
    await page.waitForFunction(() => window.viewerReport.elapsedSeconds > 0);
    assert.equal(await page.evaluate(() => window.viewerReport.repoRevision), source);
    await enable(page);
    await page.waitForFunction(() => window.viewerReport.audio?.status === 'READY');
    await page.evaluate(() => {
      window.r1Samples = [];
      window.r1Timer = setInterval(() => {
        const r = window.viewerReport;
        if (r.elapsedSeconds < 12 || r.elapsedSeconds > 13.3) return;
        const button = document.querySelectorAll('#audio-controls button')[1];
        window.r1Samples.push({ sceneMs: Math.round(r.elapsedSeconds * 1000), wallMs: performance.now(),
          connected: r.audio.connected, status: r.audio.status, enabled: r.audio.outputEnabled,
          ambience: r.audio.ambience, testDisabled: button.disabled, peak: window.readOutput() });
      }, 16);
    });
    await page.waitForFunction(() => window.viewerReport.elapsedSeconds >= 13.3, {}, { timeout: 20000 });
    const samples = await page.evaluate(() => { clearInterval(window.r1Timer); return window.r1Samples; });
    const before = samples.filter(x => x.sceneMs < 12500);
    const lost = samples.filter(x => x.sceneMs >= 12500 && x.sceneMs < 12800);
    const after = samples.filter(x => x.sceneMs >= 12800);
    assert(before.some(x => x.enabled && x.peak > .0001));
    assert(lost.length > 0 && lost.every(x => !x.connected && !x.enabled && !x.ambience &&
      x.status === 'DISCONNECTED' && x.testDisabled));
    assert(lost.some(x => x.peak <= .000001), JSON.stringify(lost));
    assert(after.some(x => x.enabled && x.status === 'READY' && x.peak > .0001));
    assert.equal(requests.length, 4);
    result.session.community = { samples, requests: requests.length };
  }, true);
  console.log('built community disconnect and reconnect verified');
}

// Route a disposable test page through the existing dev server. All runtime modules are the real Viewer modules.
const fixture = `<!doctype html><meta charset="utf-8"><main></main><script type="module">
import { AudioManager } from '/src/audio/manager.ts';
import { SliceDriver, timing } from '/src/slice-driver.ts';
const gift = (eventId, atMs, connection) => ({
  type: 'gift', phase: 'final', eventId, atMs, connection, roomEpoch: 1,
  viewer: { userKey: 'community-demo-a', name: 'An' }, giftId: 'rose', count: 1
});
const driver = new SliceDriver('community', [gift('r1-start',10800,1), gift('r1-after',13000,2)], true);
let now = 0;
const audio = new AudioManager(timing.focusHoldMs, () => now);
window.stepR1 = at => {
  now = at;
  const frame = driver.update(at);
  audio.frame(frame.state, frame.audio, frame.actor);
  const { connected, atMs, roomSessionId, camera, confirmedGiftCount } = frame.state;
  return structuredClone({ connected, atMs, roomSessionId, camera, confirmedGiftCount, epoch: frame.audio.epoch,
    audio: audio.report, testDisabled: document.querySelectorAll('#audio-controls button')[1].disabled });
};
window.stepR1(0);
</script>`;

async function sessionFixture(singleFrame) {
  await usePage(dev, async (page, requests) => {
    await page.route('**/p10b4-r1-harness.html', route => route.fulfill({ contentType: 'text/html', body: fixture }));
    await page.goto(dev + '/p10b4-r1-harness.html');
    await page.waitForFunction(() => window.stepR1);
    await enable(page);
    await page.waitForFunction(() => window.stepR1(0).audio.status === 'READY');
    const step = at => page.evaluate(at => window.stepR1(at), at);
    const outputPeak = () => page.evaluate(() => window.readOutput());
    const started = await step(11900);
    assert.equal(started.camera.mode, 'GIFT_FOCUS');
    assert.deepEqual(started.audio.marks.filter(m => m.event === 'voice-start').map(m => m.seat), ['seat-1']);
    assert.equal(started.audio.marks.filter(m => m.event === 'sfx-start').length, 1);
    await page.waitForFunction(() => window.readOutput() > .005);
    const activePeak = await outputPeak();
    let sustained;
    if (!singleFrame) {
      const disconnected = await step(12550);
      assert.equal(disconnected.camera.mode, 'GIFT_FOCUS');
      assert.equal(disconnected.audio.status, 'DISCONNECTED');
      assert.equal(disconnected.audio.outputEnabled, false);
      assert.equal(disconnected.audio.ambience, false);
      assert.equal(disconnected.audio.queue, 0);
      assert.equal(disconnected.testDisabled, true);
      assert.equal(disconnected.audio.marks.find(m => m.event === 'voice-cut')?.reason, 'disconnect');
      await page.evaluate(() => document.querySelectorAll('#audio-controls button')[1].click());
      const peaks = [];
      const wallStart = Date.now();
      for (let i = 0; i < 5; i++) {
        await page.waitForTimeout(150);
        peaks.push(await outputPeak());
      }
      assert(peaks.every(peak => peak <= .000001));
      await toggle(page).click(); // Explicit mute while disconnected must survive reconnect.
      sustained = { disconnected, peaks, wallMs: Date.now() - wallStart };
    }
    const rejoined = await step(13005);
    assert.equal(rejoined.epoch - started.epoch, 2);
    assert(rejoined.connected);
    assert.equal(rejoined.roomSessionId, started.roomSessionId);
    assert.equal(rejoined.audio.status, singleFrame ? 'READY' : 'MUTED');
    assert.equal(rejoined.audio.marks.filter(m => m.event === 'voice-start').length, 1);
    assert.equal(rejoined.audio.marks.filter(m => m.event === 'sfx-start').length, 1);
    assert.equal(rejoined.audio.marks.filter(m => m.event === 'test-start').length, 0);
    assert.equal(rejoined.audio.queue, 0);
    assert(rejoined.audio.marks.some(m => m.event === 'voice-cut' &&
      m.reason === (singleFrame ? 'session-change' : 'disconnect')));
    if (!singleFrame) {
      await toggle(page).click();
      await page.waitForFunction(() => window.stepR1(13005).audio.status === 'READY');
    }
    await page.waitForFunction(() => window.readOutput() > .0001);
    const restored = await step(13500);
    assert.equal(restored.audio.marks.filter(m => m.event === 'voice-start').length, 1);
    const reset = await step(40000);
    assert.notEqual(reset.roomSessionId, started.roomSessionId);
    assert.equal(reset.audio.queue, 0);
    assert.equal(reset.audio.marks.filter(m => m.event === 'voice-start').length, 1);
    assert.equal(requests.length, 4);
    result.session[singleFrame ? 'sameFrame' : 'sustained'] = { started, activePeak, sustained, rejoined, restored, reset };
  }, true);
  console.log(singleFrame ? 'same-frame reset verified' : 'sustained silence and mute-aware resume verified');
}

async function unavailable(partial) {
  await usePage(partial ? dev : candidate, async (page, requests) => {
    const payload = JSON.parse(await readFile(new URL('../public/audio/vi-v1-approved/lantern.voice.json', import.meta.url), 'utf8'));
    const damaged = Buffer.from(payload.wavBase64, 'base64');
    damaged[damaged.length - 1] ^= 1;
    await page.route('**/*.voice.json', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith('/lantern.voice.json')) await route.fulfill({ json: { wavBase64: damaged.toString('base64') } });
      else if (!partial || path.endsWith('/rose.voice.json')) await route.fulfill({ status: 404 });
      else await route.continue();
    });
    if (partial) {
      await page.route('**/p10b4-r1-harness.html', route => route.fulfill({ contentType: 'text/html', body: fixture }));
      await page.goto(dev + '/p10b4-r1-harness.html');
      await page.waitForFunction(() => window.stepR1);
      await enable(page);
      await page.waitForFunction(() => window.stepR1(0).audio.status === 'VOICE_DEGRADED');
      const r = await page.evaluate(() => window.stepR1(11900));
      assert.equal(r.audio.marks.find(m => m.event === 'voice-start')?.variant, 'generic');
      assert.equal(r.audio.voice.ready, 2);
      assert.equal(requests.length, 4);
      result.failures.partial = { r, requests };
      return;
    }
    await page.goto(candidate + '/?demo=community&profile=eco&clean=1&audio=on&tree=r17b&shots=hero&fx=off');
    await page.waitForFunction(() => window.viewerReport.elapsedSeconds > 0);
    assert.equal(await page.evaluate(() => window.viewerReport.repoRevision), source);
    await enable(page);
    await page.waitForFunction(() => window.viewerReport.audio?.status === 'VOICE_LOADING');
    const loading = await page.locator('#audio-controls [role=status]').textContent();
    await page.waitForFunction(() => window.viewerReport.audio?.status === 'VOICE_UNAVAILABLE');
    const message = await page.locator('#audio-controls [role=status]').textContent();
    assert.equal(await bell(page).isEnabled(), true);
    await toggle(page).click();
    await page.waitForFunction(() => window.viewerReport.audio?.status === 'MUTED');
    await toggle(page).click();
    await page.waitForFunction(() => window.viewerReport.audio?.status === 'VOICE_UNAVAILABLE');
    await bell(page).click();
    await page.waitForFunction(() => window.viewerReport.audio?.marks.some(m => m.event === 'test-start'));
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(() => window.viewerReport.elapsedSeconds >= 18, {}, { timeout: 27000 });
    const r = await page.evaluate(() => window.viewerReport);
    assert.equal(r.audio.status, 'VOICE_UNAVAILABLE');
    assert.equal(r.audio.voice.ready, 0);
    assert.equal(r.audio.voice.waiting, 0);
    assert(r.audio.outputEnabled && r.audio.sfxAvailable && r.audio.ambience);
    assert.equal(r.confirmedGiftCount, 3);
    assert.equal(r.mode, 'GIFT_FOCUS');
    assert.equal(r.focus.seatId, 'seat-1');
    assert.equal(r.audio.marks.filter(m => m.event === 'voice-asset-unavailable').length, 4);
    assert.equal(r.audio.marks.filter(m => m.event === 'voice-start').length, 0);
    assert.deepEqual(r.audio.marks.filter(m => m.event === 'sfx-start').map(m => m.seat), ['seat-1']);
    assert.equal(requests.length, 4);
    result.failures.all = { loading, message, requests, sceneMs: r.elapsedSeconds * 1000, mode: r.mode, focus: r.focus,
      confirmedGiftCount: r.confirmedGiftCount, audio: r.audio };
  }, true);
  console.log(partial ? 'partial fallback preserved' : 'four asset failures and unchanged gift focus verified');
}

async function parity() {
  for (const [profile, tree, t] of [['eco', 'r16', 1], ['quality', 'r17b', 17.43]]) {
    const entries = [];
    for (const [origin, revision] of [[baseline, reviewed], [candidate, source]]) {
      await usePage(origin, async (page, requests) => {
        await page.goto(origin + '/?demo=community&seed=9&look=twilight&clean=1&inspect=1&shots=hero&profile=' + profile + '&tree=' + tree);
        await page.waitForFunction(() => window.p08Review);
        await page.addStyleTag({ content: '#gift-fx { animation:none }' });
        const r = await page.evaluate(t => {
          for (let i = 0; i / 60 < t; i++) window.p08Review.step(i / 60, false);
          return window.p08Review.step(t, true);
        }, t);
        assert.equal(r.repoRevision, revision);
        assert.equal(r.audio, undefined);
        assert.equal(await page.locator('#audio-controls').count(), 0);
        assert.deepEqual(requests, []);
        const png = await page.locator('#stage').screenshot();
        assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [720, 1280]);
        const file = profile + '-' + tree + '-' + (origin === baseline ? 'reviewed' : 'corrected') + '.png';
        await writeFile(new URL(file, output), png);
        entries.push({ revision, file, sha256: hash(png), asset: r.asset.sha256, shot: r.shot, mode: r.mode });
      });
    }
    assert.equal(entries[0].sha256, entries[1].sha256);
    assert.equal(entries[0].asset, entries[1].asset);
    result.parity.push({ profile, tree, time: t, entries });
  }
}

try {
  await mkdir(output, { recursive: true });
  await community();
  await sessionFixture(false);
  await sessionFixture(true);
  await unavailable(true);
  await unavailable(false);
  await parity();
  await writeFile(new URL('browser.json', output), JSON.stringify(result, null, 2) + '\n');
} finally {
  await browser.close();
}
