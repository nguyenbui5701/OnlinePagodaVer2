import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { Vector3 } from 'three';

const base = 'fd5dc6655ad6b600c1fe9a3220a1bca193f1d4de';
const source = process.env.V2_CAPTURE_REVISION;
assert.match(source, /^[a-f0-9]{40}$/);
const candidate = process.env.V2_CANDIDATE_ORIGIN ?? 'http://127.0.0.1:5189';
const baseline = process.env.V2_BASELINE_ORIGIN ?? 'http://127.0.0.1:5198';
for (const origin of [baseline, candidate]) assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
const output = new URL('../evidence/p10b4/', import.meta.url);
const hash = data => createHash('sha256').update(data).digest('hex');
const browser = await chromium.launch({
  executablePath: process.env.V2_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  ignoreDefaultArgs: ['--mute-audio'],
});
const result = { source, base, browser: browser.version(), matches: [], checks: {} };
const viewport = { width: 720, height: 1280 };
const flags = 'clean=1&seed=9&look=twilight&botanicals=on&diversity=on&blessing=on&presence=on&chatbubbles=on&gifticons=on&ambience=rich&seats=rings&shots=hero';
const button = (page, name) => page.locator('#audio-controls').getByRole('button', { name });

function url(origin, profile, scenario, tree, extras) {
  return `${origin}/?${flags}&profile=${profile}&demo=${scenario}${tree === 'r17b' ? '&tree=r17b' : ''}${extras}`;
}

async function watch(page, origin, allowAudio) {
  const external = [];
  const audio = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const request = new URL(route.request().url());
    if (request.origin !== origin) {
      external.push(request.origin);
      await route.abort();
      return;
    }
    if (request.pathname.endsWith('.voice.json')) audio.push(request.pathname);
    await route.continue();
  });
  return {
    audio,
    check() {
      assert.deepEqual(external, []);
      assert.deepEqual(errors, []);
      if (!allowAudio) assert.deepEqual(audio, []);
    },
  };
}

async function draw(page, t, pose) {
  return page.evaluate(({ t, pose }) => {
    const first = Math.floor((window.viewerReport.elapsedSeconds ?? 0) * 60 + 1e-6) + 1;
    for (let i = first; i / 60 < t - 1e-6; i++) window.p08Review.step(i / 60, false);
    return window.p08Review.step(t, true, undefined, undefined, undefined, pose);
  }, { t, pose });
}

async function parity() {
  const cases = [
    ['eco', 'r16', 'idle', 'wide', 1],
    ['eco', 'r16', 'idle', 'under', 35],
    ['quality', 'r16', 'idle', 'top', 22],
    ['quality', 'r16', 'capacity', 'return', 64.1],
    ['eco', 'r17b', 'community', 'actor', 8.6],
    ['eco', 'r17b', 'capacity', 'gift', 63.5],
    ['quality', 'r17b', 'idle', 'wide', 1],
    ['quality', 'r17b', 'capacity', 'return', 64.1],
  ];
  for (const [profile, tree, demo, label, t] of cases) {
    const sides = [];
    for (const [origin, revision, suffix] of [[baseline, base, 'base'], [candidate, source, 'audio-off']]) {
      const page = await browser.newPage({ viewport });
      const seen = await watch(page, origin, false);
      await page.addInitScript(() => {
        const Audio = window.AudioContext;
        window.createdAudioContexts = 0;
        window.AudioContext = class extends Audio {
          constructor(...args) { super(...args); window.createdAudioContexts++; }
        };
      });
      try {
        await page.goto(url(origin, profile, demo, tree, '&inspect=1'));
        await page.waitForFunction(() => window.p08Review || window.viewerReport.errors.length);
        await page.addStyleTag({ content: '#gift-fx { animation:none }' });
        let pose;
        if (label === 'actor') {
          const start = await draw(page, 1);
          const [x, , z] = start.communityLayout[0].position;
          const [tx, , tz] = start.treeTarget;
          const radial = new Vector3(x - tx, 0, z - tz).normalize();
          pose = { position: new Vector3(x, 1.5, z).addScaledVector(radial, -4.8).toArray(), target: [x, .86, z], fov: 43 };
        }
        const state = await draw(page, t, pose);
        assert.equal(state.repoRevision, revision);
        assert.deepEqual(state.errors, []);
        assert.equal(await page.locator('#audio-controls').count(), 0);
        assert.equal(await page.evaluate(() => window.createdAudioContexts), 0);
        const png = await page.locator('#stage').screenshot();
        assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [720, 1280]);
        const name = `${profile}-${tree}-${label}-${suffix}.png`;
        await writeFile(new URL(name, output), png);
        sides.push({ name, sha256: hash(png), revision, asset: state.asset.sha256, shot: state.shot,
          mode: state.mode, camera: [state.position, state.target, state.fov] });
        seen.check();
      } finally {
        await page.close();
      }
    }
    assert.equal(sides[0].sha256, sides[1].sha256, `${profile}/${tree}/${label}`);
    assert.equal(sides[0].asset, sides[1].asset);
    result.matches.push({ profile, tree, label, t, sides });
  }
  console.log('eight matched audio-OFF WebGL pairs');
}

function installTap() {
  const connect = AudioNode.prototype.connect;
  const createGain = AudioContext.prototype.createGain;
  const channels = [];
  AudioContext.prototype.createGain = function () {
    const gain = createGain.call(this);
    channels.push(gain);
    return gain;
  };
  AudioNode.prototype.connect = function (destination, ...params) {
    const connected = connect.call(this, destination, ...params);
    if (destination === this.context.destination && !window.recordedDemo) {
      const tap = this.context.createMediaStreamDestination();
      connect.call(this, tap);
      const recorder = new MediaRecorder(tap.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 96000 });
      const chunks = [];
      const startWallMs = performance.now();
      recorder.ondataavailable = event => chunks.push(event.data);
      const timeline = [];
      const gains = [];
      let prior = '';
      const timer = setInterval(() => {
        const r = window.viewerReport;
        const at = performance.now();
        const key = [r.mode, r.focus?.requestId, r.focus?.seatId, r.confirmedGiftCount, r.labels?.fallback].join('|');
        if (key !== prior) {
          prior = key;
          timeline.push({ wallMs: at, sceneMs: r.elapsedSeconds * 1000, mode: r.mode, request: r.focus?.requestId,
            actor: r.focus?.actorId, seat: r.focus?.seatId, count: r.confirmedGiftCount,
            overflow: !!r.labels?.fallback, seats: r.community?.realActors });
        }
        if (channels.length >= 3) gains.push({ wallMs: at, voice: channels[0].gain.value, sfx: channels[1].gain.value,
          ambience: channels[2].gain.value, playing: r.audio?.voice?.playing === true });
      }, 80);
      window.recordedDemo = () => new Promise(resolve => {
        recorder.onstop = () => {
          clearInterval(timer);
          const reader = new FileReader();
          reader.onload = () => resolve({ webm: reader.result.split(',')[1], startWallMs, timeline, gains });
          reader.readAsDataURL(new Blob(chunks, { type: recorder.mimeType }));
        };
        recorder.stop();
      });
      recorder.start(200);
    }
    return connected;
  };
}

function wav(pcm) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(pcm.length + 36, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(24000, 24);
  header.writeUInt32LE(48000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function recording() {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(installTap);
  const seen = await watch(page, candidate, true);
  try {
    await page.goto(url(candidate, 'eco', 'capacity', 'r17b', '&audio=on'));
    await page.waitForFunction(() => (window.viewerReport.elapsedSeconds ?? 0) > 0);
    assert.equal(await page.evaluate(() => window.viewerReport.repoRevision), source);
    assert.deepEqual(seen.audio, []);
    await button(page, 'B\u1eadt \u00e2m thanh').click();
    await page.locator('#audio-controls input[type=checkbox]').check();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => window.viewerReport.audio?.voice?.ready === 4);
    await page.waitForFunction(() => window.viewerReport.elapsedSeconds >= 66, {}, { timeout: 95000 });
    const state = await page.evaluate(() => window.viewerReport);
    const recorded = await page.evaluate(() => window.recordedDemo());
    const { timeline, gains, startWallMs } = recorded;
    assert.deepEqual(state.errors, []);
    assert.equal(state.confirmedGiftCount, 8);
    assert.equal(seen.audio.length, 4);
    const marks = state.audio.marks;
    const starts = marks.filter(mark => mark.event === 'voice-start');
    const ends = marks.filter(mark => mark.event === 'voice-end');
    const sfx = marks.filter(mark => mark.event === 'sfx-start');
    assert.deepEqual(starts.map(start => start.seat), ['seat-1', 'seat-2', 'seat-3']);
    assert.deepEqual(sfx.map(mark => mark.seat), starts.map(mark => mark.seat));
    assert.equal(ends.length, 3);
    assert.equal(state.audio.suppressed.expired, 1);
    assert(timeline.some(row => row.overflow));
    assert(timeline.some(row => row.mode === 'CINE_RETURN'));
    assert(timeline.some(row => row.sceneMs >= 65000 && row.mode === 'CINEMATIC'));
    const focus = new Map(timeline.filter(row => row.mode === 'GIFT_FOCUS').map(row => [row.seat, row.request]));
    for (const [i, mark] of starts.entries()) {
      assert.equal(focus.get(mark.seat), mark.request);
      assert.equal(sfx[i].sceneMs, mark.sceneMs);
      assert.equal(ends[i].request, mark.request);
      assert(ends[i].wallMs > mark.wallMs);
      if (i) assert(ends[i - 1].wallMs < mark.wallMs);
    }
    const played = gains.filter(sample => sample.playing);
    const duck = played.reduce((min, sample) => Math.min(min, sample.ambience), 1);
    const duckSfx = played.reduce((min, sample) => Math.min(min, sample.sfx), 1);
    const quietSamples = gains.filter(sample =>
      !sample.playing && sample.wallMs >= startWallMs + 1000 && sample.wallMs < starts[0].wallMs);
    const quiet = quietSamples[Math.floor(quietSamples.length / 2)].ambience;
    const release = ends.map(end => {
      const next = gains.find(sample => sample.wallMs >= end.wallMs && !sample.playing && sample.ambience >= .19);
      assert(next);
      return next.wallMs - end.wallMs;
    });
    assert(quiet > .19 && quiet < .21 && duck > .049 && duck < .068);
    assert(duckSfx > .19 && duckSfx < .24);

    const decoder = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-ac', '1', '-ar', '24000',
      '-f', 's16le', 'pipe:1'], { input: Buffer.from(recorded.webm, 'base64'), maxBuffer: 8_000_000 });
    assert.equal(decoder.status, 0, decoder.stderr?.toString());
    const pcm = decoder.stdout;
    let peak = 0;
    let squares = 0;
    let clipped = 0;
    for (let i = 0; i < pcm.length; i += 2) {
      const value = Math.abs(pcm.readInt16LE(i));
      peak = Math.max(peak, value);
      if (value >= 32767) clipped++;
      squares += value * value;
    }
    const durationSec = pcm.length / 48000;
    const db = value => 20 * Math.log10(value / 32768);
    assert(durationSec >= 45 && durationSec <= 90);
    assert(peak > 2000 && db(peak) <= -1 && clipped === 0);
    const windows = starts.map(mark => {
      const beginSec = (mark.wallMs - startWallMs) / 1000;
      let rmsSquares = 0;
      const from = Math.floor(beginSec * 24000) * 2;
      const to = Math.min(pcm.length, from + 96000);
      for (let i = from; i < to; i += 2) rmsSquares += pcm.readInt16LE(i) ** 2;
      const rmsDbfs = db(Math.sqrt(rmsSquares * 2 / (to - from)));
      assert(rmsDbfs > -30);
      return { seat: mark.seat, beginSec, rmsDbfs };
    });
    const full = wav(pcm);
    const moment = Math.floor(windows[0].beginSec * 24000) * 2;
    const excerpt = wav(pcm.subarray(Math.max(0, moment - 24000), moment + 168000));
    await writeFile(new URL('demo-capacity-mix.wav', output), full);
    await writeFile(new URL('listen-first-gift.wav', output), excerpt);
    result.recording = { source, graphics: state.graphics, asset: state.asset.sha256, scope: 'synthetic DEMO',
      method: 'Real-time Chromium Web Audio destination graph simultaneously tapped to MediaStreamAudioDestinationNode. Opus via MediaRecorder, decoded to mono PCM16 24000 Hz by FFmpeg.',
      startWallMs, durationSec, peakDbfs: db(peak), rmsDbfs: db(Math.sqrt(squares * 2 / pcm.length)),
      clippedSamples: clipped, ambienceGain: { idle: quiet, duringVoice: duck, releaseTo95PercentMs: release }, sfxGainDuringVoice: duckSfx,
      windows, marks, timeline, gains, suppressions: state.audio.suppressed, finalCameraMode: state.mode,
      audioFiles: [ ['demo-capacity-mix.wav', full], ['listen-first-gift.wav', excerpt] ].map(([name, bytes]) =>
        ({ name, bytes: bytes.length, sha256: hash(bytes), durationSec: (bytes.length - 44) / 48000,
          format: 'WAV signed PCM16 mono 24000 Hz' })) };
    seen.check();
    console.log('native DEMO audio saved:', durationSec, 'seconds', db(peak), 'dBFS');
  } finally {
    await page.close();
  }
}

async function lifecycle() {
  const context = await browser.newContext({ viewport });
  const first = await context.newPage();
  const second = await context.newPage();
  const a = await watch(first, candidate, true);
  const b = await watch(second, candidate, true);
  const target = url(candidate, 'eco', 'idle', 'r17b', '&audio=on');
  await first.goto(target);
  await first.bringToFront();
  await button(first, 'B\u1eadt \u00e2m thanh').click();
  await first.waitForFunction(() => window.viewerReport.audio?.voice?.ready === 4);
  await button(first, 'T\u1eaft ti\u1ebfng').click();
  await first.waitForFunction(() => window.viewerReport.audio?.status === 'MUTED');
  await button(first, 'B\u1eadt \u00e2m thanh').click();
  await first.waitForFunction(() => window.viewerReport.audio?.status === 'READY');
  assert.deepEqual(await first.evaluate(() => window.viewerReport.audio.marks), []);
  await first.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await first.waitForFunction(() => window.viewerReport.audio?.status === 'MUTED');
  await button(first, 'B\u1eadt \u00e2m thanh').click();
  await first.waitForFunction(() => window.viewerReport.audio?.status === 'READY');
  await first.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.hidden;
  });
  await first.waitForFunction(() => window.viewerReport.audio?.status === 'MUTED');
  await second.goto(target);
  await second.bringToFront();
  await button(second, 'B\u1eadt \u00e2m thanh').click();
  await second.waitForFunction(() => window.viewerReport.audio?.status === 'BLOCKED');
  assert.equal(b.audio.length, 0);
  await first.close();
  await button(second, 'B\u1eadt \u00e2m thanh').click();
  await second.waitForFunction(() => window.viewerReport.audio?.voice?.ready === 4);
  assert.deepEqual(await second.evaluate(() => window.viewerReport.audio.marks), []);
  b.check();
  a.check();
  await context.close();
  result.checks.lifecycle = { first: ['READY', 'MUTED', 'READY'], second: ['BLOCKED', 'READY'],
    marksOnUnmute: 0, secondAudioRequestsWhileBlocked: 0, syntheticBfcacheHide: 'MUTED', syntheticHidden: 'MUTED' };
  console.log('exclusive output and mute verified');
}

async function fallback() {
  const page = await browser.newPage({ viewport });
  const seen = await watch(page, candidate, true);
  const wrapper = JSON.parse(await readFile(new URL('../public/audio/vi-v1-approved/lantern.voice.json', import.meta.url), 'utf8'));
  const bad = Buffer.from(wrapper.wavBase64, 'base64');
  bad[bad.length - 1] ^= 1;
  await page.route('**/lantern.voice.json', route => route.fulfill({ json: { wavBase64: bad.toString('base64') } }));
  await page.route('**/rose.voice.json', route => route.fulfill({ status: 404 }));
  try {
    await page.goto(url(candidate, 'quality', 'community', 'r17b', '&audio=on&fx=off'));
    await button(page, 'B\u1eadt \u00e2m thanh').click();
    await page.waitForFunction(() => window.viewerReport.audio?.voice?.ready === 2 && !window.viewerReport.audio?.voice?.waiting);
    await page.waitForFunction(() => window.viewerReport.audio.marks.some(mark => mark.event === 'voice-start'), {}, { timeout: 30000 });
    const marks = await page.evaluate(() => window.viewerReport.audio.marks);
    const first = marks.find(mark => mark.event === 'voice-start');
    assert.equal(first.variant, 'generic');
    assert.equal(first.seat, 'seat-1');
    assert.deepEqual(marks.filter(mark => mark.event === 'voice-asset-unavailable').map(mark => mark.variant).sort(),
      ['lantern', 'rose']);
    await page.evaluate(() => {
      const extension = document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');
      window.audioRestore = () => extension.restoreContext();
      extension.loseContext();
    });
    await page.waitForFunction(() => window.viewerReport.audio.marks.some(mark =>
      mark.event === 'voice-cut' && mark.reason === 'webgl-context'));
    await page.waitForFunction(() => window.viewerReport.errors.includes('webglcontextlost'));
    await page.evaluate(() => window.audioRestore());
    await page.waitForFunction(() => window.viewerReport.contextRestores === 1);
    await button(page, 'B\u1eadt \u00e2m thanh').click();
    await page.waitForFunction(() => window.viewerReport.audio?.status === 'READY');
    const state = await page.evaluate(() => window.viewerReport);
    assert.equal(state.audio.marks.filter(mark => mark.event === 'voice-start').length, 1);
    assert.deepEqual(state.errors, ['webglcontextlost']);
    assert.equal(await page.evaluate(() => document.querySelector('canvas').getContext('webgl2').getError()), 0);
    result.checks.assets = { profile: 'quality', fx: 'off', missing: 'rose', corrupt: 'lantern', used: first.variant,
      seat: first.seat, restoreCount: state.contextRestores, marks: state.audio.marks };
    seen.check();
    console.log('verified offline generic fallback with FX off and native WebGL restore');
  } finally {
    await page.close();
  }
}

async function guards() {
  const cases = ['inspect=1', 'time=5', 'source=live'];
  for (const guard of cases) {
    const page = await browser.newPage({ viewport });
    const seen = await watch(page, candidate, false);
    try {
      await page.goto(url(candidate, 'eco', 'capacity', 'r17b', '&audio=on&' + guard));
      await page.waitForFunction(() => window.viewerReport.asset || window.viewerReport.errors.length);
      if (guard === 'inspect=1') {
        await page.waitForFunction(() => window.p08Review);
        await draw(page, 52);
      } else await page.waitForFunction(() => Number.isFinite(window.viewerReport.elapsedSeconds));
      assert.equal(await page.locator('#audio-controls').count(), 0);
      const state = await page.evaluate(() => window.viewerReport);
      assert.equal(state.audio, undefined);
      if (guard === 'source=live') {
        assert.equal(state.liveStatus, 'OFFLINE');
        assert.equal(state.community.realActors, 0);
        assert.equal(state.confirmedGiftCount, 0);
      }
      seen.check();
    } finally {
      await page.close();
    }
  }
  result.checks.audioGuards = cases;
}

async function cameraClock() {
  const checkpoints = [45999, 46000, 47049, 47050, 51849, 51850, 52899, 52900,
    57699, 57700, 58749, 58750, 63549, 63550, 64999, 65000];
  const sides = [];
  for (const [origin, revision] of [[baseline, base], [candidate, source]]) {
    const page = await browser.newPage({ viewport });
    const seen = await watch(page, origin, false);
    try {
      await page.goto(url(origin, 'eco', 'capacity', 'r17b', '&inspect=1'));
      await page.waitForFunction(() => window.p08Review);
      const rows = [];
      for (const ms of checkpoints) {
        const r = await draw(page, ms / 1000);
        assert.equal(r.repoRevision, revision);
        rows.push({ ms, mode: r.mode, request: r.focus?.requestId, seat: r.focus?.seatId,
          position: r.position, target: r.target, fov: r.fov, count: r.confirmedGiftCount });
      }
      sides.push(rows);
      seen.check();
    } finally {
      await page.close();
    }
  }
  assert.deepEqual(sides[0], sides[1]);
  result.checks.clock = { checkpoints: sides[1], match: true };
}

async function run() {
  await mkdir(output, { recursive: true });
  try {
    if (process.argv.includes('--record-only')) await recording();
    else if (process.argv.includes('--parity-only')) await parity();
    else if (process.argv.includes('--checks-only')) { await lifecycle(); await fallback(); await guards(); await cameraClock(); }
    else if (process.argv.includes('--clock-only')) await cameraClock();
    else {
      await recording();
      await writeFile(new URL('recording.json', output), JSON.stringify(result, null, 2) + '\n');
      await parity();
      await writeFile(new URL('parity.json', output), JSON.stringify({ source, base, browser: result.browser, matches: result.matches }, null, 2) + '\n');
      await lifecycle();
      await fallback();
      await guards();
      await cameraClock();
    }
    await writeFile(new URL(process.argv.includes('--record-only') ? 'recording.json' :
      process.argv.includes('--parity-only') ? 'parity.json' :
      process.argv.includes('--checks-only') ? 'checks.json' :
      process.argv.includes('--clock-only') ? 'clock.json' : 'browser.json', output), JSON.stringify(result, null, 2) + '\n');
  } finally {
    await browser.close();
  }
}

await run();
