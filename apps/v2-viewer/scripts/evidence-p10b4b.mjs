import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createVoiceServer } from '../../../packages/v2-voice/worker.mjs';

const base = '3f16a7dc607716f9cc3a05e232775745d5394de1';
const source = process.env.V2_CAPTURE_REVISION ?? execFileSync('git', ['rev-parse', 'HEAD'], {encoding:'utf8'}).trim();
const candidate = process.env.V2_CANDIDATE_ORIGIN ?? 'http://127.0.0.1:5220';
const baseline = process.env.V2_BASELINE_ORIGIN ?? 'http://127.0.0.1:5218';
for (const url of [candidate, baseline]) assert.match(url, /^http:\/\/127\.0\.0\.1:\d+$/);
const output = new URL('../evidence/p10b4b/', import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const viewport = { width: 720, height: 1280 };
const browser = await chromium.launch({
  executablePath: process.env.V2_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'], ignoreDefaultArgs: ['--mute-audio'],
});
const results = { source, base, browser: browser.version(), viewport, parity: [], guards: [] };
const flags = 'clean=1&seed=9&look=twilight&botanicals=on&diversity=on&blessing=on&presence=on&chatbubbles=on&gifticons=on&ambience=rich&seats=rings&shots=hero';

function monitor(page, origin, worker = false) {
  const external = [];
  const voice = [];
  const requests = [];
  const errors = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin !== origin && !(worker && url.origin === 'http://127.0.0.1:5202')) external.push(url.origin);
    if (url.pathname.endsWith('.voice.json')) voice.push(url.pathname);
    if (url.port === '5202') requests.push({ method: request.method(), path: url.pathname });
  });
  page.on('pageerror', error => errors.push(error.message));
  return { voice, requests, verify() { assert.deepEqual(external, []); assert.deepEqual(errors, []); } };
}

function tap() {
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (destination, ...params) {
    const connected = connect.call(this, destination, ...params);
    if (destination === this.context.destination && !window.stopTape) {
      const audio = this.context.createMediaStreamDestination();
      connect.call(this, audio);
      const recorder = new MediaRecorder(audio.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 96000 });
      const start = { wallMs: performance.now(), contextSec: this.context.currentTime };
      const chunks = [];
      const timeline = [];
      let prior;
      const timer = setInterval(() => {
        const r = window.viewerReport;
        const key = [r.mode, r.focus?.requestId, r.confirmedGiftCount, !!r.labels?.fallback].join('|');
        if (key === prior) return;
        prior = key;
        timeline.push({ wallMs: performance.now(), sceneMs: Math.round(r.elapsedSeconds * 1000),
          mode: r.mode, seat: r.focus?.seatId, giftCount: r.confirmedGiftCount, overlay: !!r.labels?.fallback });
      }, 35);
      recorder.ondataavailable = event => chunks.push(event.data);
      window.stopTape = () => new Promise(resolve => {
        recorder.onstop = () => {
          clearInterval(timer);
          const reader = new FileReader();
          reader.onload = () => resolve({ start, timeline, base64: reader.result.split(',')[1] });
          reader.readAsDataURL(new Blob(chunks, { type: recorder.mimeType }));
        };
        recorder.stop();
      });
      recorder.start(200);
    }
    return connected;
  };
}

function toWav(pcm) {
  const head = Buffer.alloc(44);
  head.write('RIFF', 0); head.writeUInt32LE(pcm.length + 36, 4);
  head.write('WAVEfmt ', 8); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22); head.writeUInt32LE(24000, 24); head.writeUInt32LE(48000, 28);
  head.writeUInt16LE(2, 32); head.writeUInt16LE(16, 34);
  head.write('data', 36); head.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([head, pcm]);
}

function signalCut(pcm, at) {
  const rows = [];
  for (let ms = -30; ms < 100; ms += 10) {
    const start = Math.round((at + ms / 1000) * 24000);
    const end = Math.round((at + (ms + 10) / 1000) * 24000);
    let peak = 0;
    for (let frame = start; frame < end; frame++) peak = Math.max(peak, Math.abs(pcm.readInt16LE(frame * 2)));
    rows.push({ ms, peak });
  }
  assert(rows[0].peak > 32, 'expected audible bell before cancellation');
  const silent = rows.findIndex((row, i) => row.ms >= 0 && rows.slice(i).every(window => window.peak <= 32));
  assert(silent >= 0, 'bell remains in the decoded PCM');
  return { alignment: 'AudioContext clock relative to its MediaRecorder tap start', windowMs: 10, thresholdPcm16: 32,
    firstSustainedQuietMs: rows[silent].ms, rows };
}

async function measureExisting() {
  const path = new URL('recording.json', output);
  const recording = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(recording.source, source);
  const detail = recording.capture;
  const cut = detail.marks.find(mark => mark.event === 'idle-cut');
  const wav = await readFile(new URL(detail.files[0].name, output));
  assert.equal(hash(wav), detail.files[0].sha256);
  detail.waveformCut = signalCut(wav.subarray(44), cut.contextSec - detail.start.contextSec);
  await writeFile(path, JSON.stringify(recording, null, 2) + '\n');
}

async function capture() {
  const token = randomBytes(32).toString('hex');
  const service = createVoiceServer({ token, origin: candidate });
  await new Promise((resolve, reject) => {
    service.once('error', reject);
    service.listen(5202, '127.0.0.1', resolve);
  });
  const page = await browser.newPage({ viewport });
  await page.addInitScript(tap);
  const seen = monitor(page, candidate, true);
  const workerStatuses = [];
  page.on('response', response => {
    if (new URL(response.url()).port === '5202') workerStatuses.push(response.status());
  });
  try {
    await page.goto(candidate + '/?demo=capacity&profile=eco&tree=r17b&audio=on&idlevoice=on&idlegap=13.6&dynamicvoice=on&' + flags);
    await page.waitForFunction(() => window.viewerReport.elapsedSeconds > 0);
    assert.equal(await page.evaluate(() => window.viewerReport.repoRevision), source);
    assert.deepEqual(seen.voice, []);
    await page.locator('#audio-controls input[type=password]').fill(token);
    await page.locator('#audio-controls button').last().click();
    await page.locator('#audio-controls button').first().click();
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(() => window.viewerReport.audio?.voice?.ready === 4);
    await page.waitForFunction(() => window.viewerReport.audio?.marks.filter(mark => mark.event === 'idle-end').length === 2,
      {}, { timeout: 46000 });
    const reconfiguredGapSec = await page.evaluate(() => {
      // Use the real operator control to place the third bell across the built-in 46 s gift.
      // The gift fixture and browser clock continue unmodified.
      const current = window.viewerReport.elapsedSeconds;
      const field = document.querySelector('#audio-controls input[type=number]');
      field.value = String(Math.max(10, 45.20 - current));
      field.dispatchEvent(new Event('change'));
      return Number(field.value);
    });
    await page.waitForFunction(() => window.viewerReport.elapsedSeconds >= 83, {}, { timeout: 105000 });
    const report = await page.evaluate(() => window.viewerReport);
    const tape = await page.evaluate(() => window.stopTape());
    assert.equal(report.confirmedGiftCount, 8);
    assert.equal(report.mode, 'CINEMATIC');
    assert.equal(report.audio.dynamic, 'DYNAMIC_TTS_BLOCKED');
    assert.equal(report.audio.idle.speech, 'IDLE_SPEECH_LIBRARY_PENDING');
    assert.deepEqual(report.errors, []);
    assert.equal(seen.voice.length, 4);
    assert.deepEqual(workerStatuses.filter(status => status !== 204), [503]);
    assert.deepEqual(seen.requests.filter(item => item.method === 'POST'), [{ method: 'POST', path: '/demo-voice' }]);
    const marks = report.audio.marks;
    const idle = marks.filter(mark => mark.event === 'idle-start');
    const cuts = marks.filter(mark => mark.event === 'idle-cut');
    const starts = marks.filter(mark => mark.event === 'voice-start');
    const ends = marks.filter(mark => mark.event === 'voice-end');
    const sfx = marks.filter(mark => mark.event === 'sfx-start');
    console.log('native idle starts and cuts', idle.map(mark => mark.sceneMs), cuts.map(mark => mark.sceneMs));
    assert(idle.length >= 4);
    assert(idle.every(mark => mark.variant.startsWith('lotus-bell-')));
    assert.equal(cuts.length, 1);
    assert.equal(cuts[0].reason, 'gift-activity');
    assert(cuts[0].sceneMs >= 46000 && cuts[0].sceneMs < 46600);
    assert.equal(cuts[0].seconds, .030);
    assert(idle.at(-1).sceneMs >= 65000 + reconfiguredGapSec * 1000 - 1);
    assert.deepEqual(starts.map(mark => mark.seat), ['seat-1', 'seat-2', 'seat-3']);
    assert.deepEqual(sfx.map(mark => mark.seat), starts.map(mark => mark.seat));
    const voiceAfterSfxMs = starts.map((mark, i) => mark.sceneMs - sfx[i].sceneMs);
    assert(voiceAfterSfxMs.every(lag => lag >= 0 && lag <= 350));
    assert(starts.every(mark => mark.variant === 'rose'));
    assert.equal(ends.length, 3);
    assert(starts.every((mark, i) => !i || mark.contextSec > ends[i - 1].contextSec));
    assert.equal(report.audio.suppressed.expired, 1);
    const official = [47050, 52900, 58750];
    for (const [i, mark] of starts.entries()) {
      assert(mark.sceneMs >= official[i] && mark.sceneMs - official[i] < 450);
      assert(tape.timeline.some(row => row.mode === 'GIFT_FOCUS' && row.seat === mark.seat));
    }
    const decoded = spawnSync('ffmpeg', ['-hide_banner','-v','error','-i','pipe:0','-ac','1','-ar','24000','-f','s16le','pipe:1'],
      { input: Buffer.from(tape.base64, 'base64'), maxBuffer: 8000000 });
    assert.equal(decoded.status, 0, decoded.stderr?.toString());
    const pcm = decoded.stdout;
    const frameCount = pcm.length / 2;
    let peak = 0, sum = 0, clipped = 0;
    for (let i = 0; i < pcm.length; i += 2) {
      const value = Math.abs(pcm.readInt16LE(i));
      peak = Math.max(peak, value);
      sum += value * value;
      if (value >= 32767) clipped++;
    }
    const db = n => 20 * Math.log10(n / 32768);
    assert.equal(clipped, 0);
    assert(db(peak) <= -1 && peak > 3000);
    assert(frameCount / 24000 >= 76);
    const cutSec = cuts[0].contextSec - tape.start.contextSec;
    const cutWallSec = (cuts[0].wallMs - tape.start.wallMs) / 1000;
    // Examine both clock offsets with a conservative late window to accommodate recorder alignment.
    const quiet = [];
    for (let ms = 100; ms <= 240; ms += 20) {
      let p = 0;
      const at = Math.max(cutSec, cutWallSec) + ms / 1000;
      for (let i = Math.round(at * 24000); i < Math.round((at + .01) * 24000); i++) {
        p = Math.max(p, Math.abs(pcm.readInt16LE(i * 2)));
      }
      quiet.push({ ms, peak: p });
    }
    assert(quiet.every(frame => frame.peak <= 32));
    const end = marks.find(mark => mark.event === 'idle-cut-end');
    assert(end && end.contextSec >= cuts[0].contextSec);
    const full = toWav(pcm);
    const at = Math.floor((idle.at(-1).contextSec - tape.start.contextSec) * 24000);
    const excerpt = toWav(pcm.subarray((at - 4800) * 2, Math.min(frameCount, at + 2 * 24000) * 2));
    const files = [['idle-and-gifts-demo.wav', full], ['listen-idle-bell.wav', excerpt]];
    for (const [name, data] of files) await writeFile(new URL(name, output), data);
    results.capture = { asset: report.asset.sha256, graphics: report.graphics, start: tape.start,
      method: 'Real-time Edge native Web Audio destination tap, Recorder Opus to PCM16 via FFmpeg, no microphone.',
      files: files.map(([name, data]) => ({ name, bytes: data.length, sha256: hash(data),
        durationSec: (data.length - 44) / 48000, format: 'WAV PCM16 LE mono 24000 Hz' })),
      peakDbfs: db(peak), rmsDbfs: db(Math.sqrt(sum / frameCount)), clipped, marks, timeline: tape.timeline,
      quiet, waveformCut: signalCut(pcm, cutSec), reconfiguredGapSec, voiceAfterSfxMs, cutScheduledMs: cuts[0].seconds * 1000, cutObservedCallbackMs: (end.contextSec - cuts[0].contextSec) * 1000,
      dynamic: report.audio.dynamic, workerStatuses, attempts: seen.requests, gifters: 3, confirmedGiftCount: 8 };
    seen.verify();
    console.log('native idle and fallback recording', frameCount / 24000, db(peak), idle.length);
  } finally {
    await page.close();
    service.closeAllConnections();
    await new Promise(resolve => service.close(resolve));
  }
}

async function offParity() {
  for (const [profile, tree, demo, t] of [
    ['eco', 'r16', 'idle', 1], ['eco', 'r17b', 'capacity', 47.3],
    ['quality', 'r16', 'idle', 22], ['quality', 'r17b', 'capacity', 64.1],
  ]) {
    const pair = [];
    for (const [origin, revision, label] of [[baseline, base, 'baseline'], [candidate, source, 'candidate']]) {
      const page = await browser.newPage({ viewport });
      const seen = monitor(page, origin);
      await page.addInitScript(() => {
        const NativeContext = window.AudioContext;
        window.audioContexts = 0;
        window.AudioContext = class extends NativeContext {
          constructor(...args) { super(...args); window.audioContexts++; }
        };
      });
      try {
        await page.goto(`${origin}/?demo=${demo}&profile=${profile}&tree=${tree}&inspect=1&idlevoice=on&dynamicvoice=on&${flags}`);
        await page.waitForFunction(() => window.p08Review);
        await page.addStyleTag({ content: '#gift-fx { animation:none }' });
        const r = await page.evaluate(at => {
          for (let i = 0; i / 60 < at; i++) window.p08Review.step(i / 60, false);
          return window.p08Review.step(at, true);
        }, t);
        assert.equal(r.repoRevision, revision);
        assert.deepEqual(r.errors, []);
        assert.equal(await page.locator('#audio-controls').count(), 0);
        assert.equal(await page.evaluate(() => window.audioContexts), 0);
        assert.deepEqual(seen.voice, []);
        const png = await page.locator('#stage').screenshot();
        assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [720, 1280]);
        const name = `${profile}-${tree}-${label}.png`;
        await writeFile(new URL(name, output), png);
        pair.push({ name, revision, hash: hash(png), asset: r.asset.sha256, mode: r.mode, camera: [r.position, r.target, r.fov] });
        seen.verify();
      } finally { await page.close(); }
    }
    assert.equal(pair[0].hash, pair[1].hash);
    assert.equal(pair[0].asset, pair[1].asset);
    assert.deepEqual(pair[0].camera, pair[1].camera);
    results.parity.push({ profile, tree, t, pair });
  }
}

async function guardedModes() {
  for (const [mode, extras] of [
    ['off', ''], ['inspect', '&audio=on&inspect=1'], ['frozen', '&audio=on&time=50'], ['offline', '&audio=on&source=live'],
  ]) {
    const page = await browser.newPage({ viewport });
    await page.addInitScript(() => {
      const NativeContext = window.AudioContext;
      window.audioContexts = 0;
      window.AudioContext = class extends NativeContext {
        constructor(...args) { super(...args); window.audioContexts++; }
      };
    });
    const seen = monitor(page, candidate);
    try {
      await page.goto(candidate + '/?demo=capacity&idlevoice=on&dynamicvoice=on&' + flags + extras);
      if (mode === 'inspect') {
        await page.waitForFunction(() => window.p08Review);
        await page.evaluate(() => window.p08Review.step(50));
      } else await page.waitForFunction(() => Number.isFinite(window.viewerReport.elapsedSeconds));
      const state = await page.evaluate(() => window.viewerReport);
      assert.equal(state.audio, undefined);
      assert.equal(await page.evaluate(() => window.audioContexts), 0);
      assert.deepEqual(seen.voice, []);
      if (mode === 'offline') {
        assert.equal(state.liveStatus, 'OFFLINE');
        assert.equal(state.community.realActors, 0);
        assert.equal(state.confirmedGiftCount, 0);
      }
      results.guards.push({ mode, contexts: 0, voiceRequests: 0 });
      seen.verify();
    } finally { await page.close(); }
  }
}

const dev = 'http://127.0.0.1:5221';
const harness = `<!doctype html><meta charset="utf-8"><main></main><script type="module">
import { AudioManager } from '/src/audio/manager.ts';
import { SliceDriver, timing } from '/src/slice-driver.ts';
const driver = new SliceDriver('capacity', [], true);
let now = 0;
let requests = 0;
const pcm = new Uint8Array(14400);
const data = new DataView(pcm.buffer);
for (let i = 0; i < data.byteLength / 2; i++) {
  data.setInt16(i*2, Math.round(Math.sin(i/10) * 3200 * Math.min(i/400, (7200-i)/400, 1)), true);
}
const speech = Float32Array.from({length: 48000}, (_,i) => .07 * Math.sin(i/10));
const audio = new AudioManager(timing.focusHoldMs, () => now, { idle:{seed:9,gap:10000},
  idleSpeech:new Map([['fixture-idle-speech',speech]]),
  namedProvider: async (_template, signal) => { signal.throwIfAborted(); requests++; return pcm; } });
window.fixtureStep = t => {
  now = t;
  const frame = driver.update(t);
  audio.frame(frame.state, frame.audio, frame.actor);
  return structuredClone({ now:t, requests, mode:frame.state.camera.mode, giftCount:frame.state.confirmedGiftCount,
    seat:frame.actor?.seatId, audio:audio.report });
};
window.fixtureStep(0);
</script>`;

async function fixtureIntegration() {
  const page = await browser.newPage({ viewport });
  const seen = monitor(page, dev);
  try {
    await page.route('**/audio-fixture.html', route => route.fulfill({ contentType: 'text/html', body: harness }));
    await page.goto(dev + '/audio-fixture.html');
    await page.waitForFunction(() => window.fixtureStep);
    const checks = page.locator('#audio-controls input[type=checkbox]');
    await checks.nth(1).uncheck();
    await checks.nth(2).check();
    await page.locator('#audio-controls button').first().click();
    await page.waitForFunction(() => window.fixtureStep(0).audio.voice?.ready === 4);
    const step = at => page.evaluate(at => window.fixtureStep(at), at);
    const idle = await step(10000);
    assert.equal(idle.audio.marks.find(mark => mark.event === 'idle-start').variant, 'fixture-idle-speech');
    const progress = await step(46000);
    assert.equal(progress.requests, 0);
    assert(progress.audio.marks.some(mark => mark.event === 'idle-cut' && mark.reason === 'gift-activity' && mark.seconds === .030));
    assert.equal(progress.audio.marks.filter(mark => mark.event === 'voice-start').length, 0);
    await step(46306);
    await page.waitForTimeout(60);
    const a = await step(47050);
    await page.waitForTimeout(400);
    await step(48201);
    await page.waitForTimeout(60);
    const b = await step(52900);
    await page.waitForTimeout(400);
    const c = await step(58750);
    await page.waitForTimeout(400);
    const final = await step(65000);
    const starts = final.audio.marks.filter(mark => mark.event === 'voice-start');
    assert.deepEqual(starts.map(mark => [mark.seat, mark.sceneMs, mark.variant]), [
      ['seat-1',47050,'named'], ['seat-2',52900,'named'], ['seat-3',58750,'named'],
    ]);
    assert.equal(final.requests, 3);
    assert.equal(final.audio.dynamic, 'DYNAMIC_TTS_FIXTURE');
    assert.equal(final.mode, 'CINEMATIC');
    assert.equal(final.giftCount, 8);
    assert([a,b,c].every(frame => frame.mode === 'GIFT_FOCUS'));
    results.fixture = { method: 'Edge Web Audio with injected non-speech PCM and existing DEMO SliceDriver stepped on a synthetic clock',
      idle, progress, checkpoints: [a,b,c].map(({now,mode,seat}) => ({now,mode,seat})), final };
    seen.verify();
  } finally { await page.close(); }
}

try {
  await mkdir(output, { recursive: true });
  if (process.argv.includes('--measure-existing')) {
    await measureExisting();
  } else {
    if (!process.argv.includes('--checks-only')) {
      await capture();
      await writeFile(new URL('recording.json', output), JSON.stringify(results, null, 2) + '\n');
    }
    if (!process.argv.includes('--record-only')) {
      await fixtureIntegration();
      await offParity();
      await guardedModes();
      await writeFile(new URL('checks.json', output), JSON.stringify({ ...results, capture: undefined }, null, 2) + '\n');
      console.log('named and idle speech fixtures, OFF parity, and guards passed');
    }
  }
} finally {
  await browser.close();
}
