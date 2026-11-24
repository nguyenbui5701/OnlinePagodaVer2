import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createVoiceServer } from '../../../packages/v2-voice/worker.mjs';
import { createSynthesizer } from '../../../packages/v2-voice/process.mjs';

const synthesis = createSynthesizer();
assert(synthesis, 'Set V2_GTTS_DEMO_ENABLED=1 for actual synthetic DEMO synthesis.');
const origin = 'http://127.0.0.1:5189';
const serviceOrigin = 'http://127.0.0.1:5202';
const output = new URL('../evidence/p10b4b/gtts-local/', import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const source = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const token = randomBytes(32).toString('hex');
const receipts = [];
const diagnostics = [];
const service = createVoiceServer({ token, origin, diagnostic: code => { diagnostics.push(code); synthesis.close(); },
  run: async (template, signal) => {
    const start = performance.now();
    const audio = await synthesis.run(template, signal);
    const receipt = { template, latencyMs: Math.round(performance.now() - start), size: audio.length,
      durationSec: audio.length / 48000, sha256: hash(audio) };
    receipts.push(receipt);
    console.log('gTTS', receipt.template.nameId, receipt.latencyMs, 'ms');
    return audio;
  }
});

const browser = await chromium.launch({
  executablePath: process.env.V2_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: process.env.V2_CAPTURE_SOFTWARE === '1' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [],
  ignoreDefaultArgs: ['--mute-audio'],
});
await mkdir(output, { recursive: true });
try {
  await new Promise((resolve, reject) => {
    service.once('error', reject);
    service.listen(5202, '127.0.0.1', resolve);
  });
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
  const errors = [];
  const unexpected = [];
  const statuses = [];
  const idleLoads = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin !== origin && url.origin !== serviceOrigin) unexpected.push(url.origin);
    if (url.pathname.includes('/vi-gtts-demo-v1/')) idleLoads.push(url.pathname);
  });
  page.on('response', response => {
    if (new URL(response.url()).origin === serviceOrigin) statuses.push(response.status());
  });
  await page.addInitScript(tap);
  await page.goto(origin + '/?demo=capacity&profile=eco&tree=r17b&audio=on&idlevoice=on&idlegap=11.5' +
    '&dynamicvoice=on&clean=1&seed=9&look=twilight&botanicals=on&diversity=on&blessing=on&presence=on' +
    '&chatbubbles=on&gifticons=on&ambience=rich&seats=rings&shots=hero');
  await page.waitForFunction(() => window.viewerReport.elapsedSeconds > 0);
  assert.equal(await page.evaluate(() => window.viewerReport.repoRevision), source);
  assert.deepEqual(idleLoads, []);
  assert.deepEqual(statuses, []);
  await page.locator('#audio-controls input[type=password]').fill(token);
  await page.locator('#audio-controls button').last().click();
  await page.locator('#audio-controls button').first().click();
  const controls = page.locator('#audio-controls input[type=checkbox]');
  await controls.nth(1).uncheck();
  await controls.nth(2).check();
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(() => window.viewerReport.audio?.marks.filter(mark => mark.event === 'idle-end').length === 2,
    {}, { timeout: 46000 });
  const gap = await page.evaluate(() => {
    const field = document.querySelector('#audio-controls input[type=number]');
    // A real operator control aligns the third wish with the existing 46 s gift.
    field.value = String(Math.max(10, 45.25 - window.viewerReport.elapsedSeconds));
    field.dispatchEvent(new Event('change'));
    return Number(field.value);
  });
  await page.waitForFunction(() => window.viewerReport.elapsedSeconds >= 47.5, {}, { timeout: 30_000 });
  const image = await page.locator('#stage').screenshot();
  assert.deepEqual([image.readUInt32BE(16), image.readUInt32BE(20)], [720, 1280]);
  await writeFile(new URL('gift-focus.png', output), image);
  await page.waitForFunction(() => window.viewerReport.elapsedSeconds >= 83, {}, { timeout: 70_000 });
  const report = await page.evaluate(() => window.viewerReport);
  const tape = await page.evaluate(() => window.stopTape());
  const decoded = spawnSync('ffmpeg', ['-hide_banner', '-v', 'error', '-i', 'pipe:0', '-ac', '1', '-ar', '24000',
    '-f', 's16le', 'pipe:1'], { input: Buffer.from(tape.base64, 'base64'), maxBuffer: 8_000_000 });
  assert.equal(decoded.status, 0, decoded.stderr?.toString());
  const pcm = decoded.stdout;
  let peak = 0;
  let clipped = 0;
  for (let offset = 0; offset < pcm.length; offset += 2) {
    const amplitude = Math.abs(pcm.readInt16LE(offset));
    peak = Math.max(peak, amplitude);
    if (amplitude >= 32767) clipped++;
  }
  const wav = toWav(pcm);
  const peakDbfs = 20 * Math.log10(peak / 32768);
  const marks = report.audio.marks;
  const starts = marks.filter(mark => mark.event === 'voice-start');
  const ends = marks.filter(mark => mark.event === 'voice-end');
  const idle = marks.filter(mark => mark.event === 'idle-start');
  const cut = marks.find(mark => mark.event === 'idle-cut');
  const cutEnd = marks.find(mark => mark.event === 'idle-cut-end');
  const receipt = {
    source, browser: browser.version(), graphics: report.graphics, asset: report.asset.sha256, costVnd: 0,
    method: 'Normal built Viewer on Edge in real time, native postmix Web Audio tap and Opus/FFmpeg capture.',
    confirmedGiftCount: report.confirmedGiftCount, finalMode: report.mode, start: tape.start,
    wav: { bytes: wav.length, sha256: hash(wav), durationSec: pcm.length / 48000, peakDbfs, clipped },
    provider: receipts, diagnostics, statuses, idleLoads, idleGapAfterCutSec: gap,
    cutObservedMs: cutEnd && cut ? (cutEnd.contextSec - cut.contextSec) * 1000 : null,
    dynamic: report.audio.dynamic, timeline: tape.timeline, marks, unexpected, errors,
  };
  await writeFile(new URL('gtts-demo.wav', output), wav);
  await writeFile(new URL('recording.json', output), JSON.stringify(receipt, null, 2) + '\n');

  assert.deepEqual(receipt.provider.map(({ template }) => template), [
    { nameId: 'an', gift: 'rose', count: 5 }, { nameId: 'binh', gift: 'rose', count: 1 },
    { nameId: 'chi', gift: 'rose', count: 1 },
  ]);
  assert.deepEqual(statuses.filter(status => status !== 204), [200, 200, 200]);
  assert.equal(report.audio.dynamic, 'DYNAMIC_TTS_READY');
  assert.equal(report.audio.idle.speech, true);
  assert.equal(idleLoads.length, 13);
  assert.equal(report.confirmedGiftCount, 8);
  assert.equal(report.mode, 'CINEMATIC');
  assert.deepEqual(starts.map(mark => [mark.seat, mark.variant]), [
    ['seat-1', 'named'], ['seat-2', 'named'], ['seat-3', 'named'],
  ]);
  for (const [index, mark] of starts.entries()) {
    const chime = marks.find(item => item.event === 'sfx-start' && item.seat === mark.seat);
    assert(chime && mark.sceneMs >= chime.sceneMs && mark.sceneMs - chime.sceneMs <= 350);
    assert(tape.timeline.some(row => row.mode === 'GIFT_FOCUS' && row.seat === mark.seat));
    assert.equal(mark.seconds, receipt.provider[index].durationSec);
    assert(ends[index].contextSec >= mark.contextSec + mark.seconds - .006);
    if (starts[index + 1]) assert(ends[index].contextSec <= starts[index + 1].contextSec);
  }
  assert(idle.length >= 4);
  assert(idle.every(mark => mark.variant.startsWith('wish-')));
  assert.equal(marks.filter(mark => mark.event === 'idle-cut').length, 1);
  assert.equal(cut.reason, 'gift-activity');
  assert(receipt.cutObservedMs <= 100);
  assert(idle.at(-1).sceneMs >= 65000 + gap * 1000 - 1);
  assert.deepEqual(unexpected, []);
  assert.deepEqual(errors, []);
  assert.deepEqual(report.errors, []);
  assert(peakDbfs <= -1 && peak > 3000 && clipped === 0);
  console.log('Actual named gifts and idle speech recorded:', new URL('gtts-demo.wav', output).pathname);
} finally {
  synthesis.close();
  await browser.close();
  if (service.listening) {
    service.closeAllConnections();
    await new Promise(resolve => service.close(resolve));
  }
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
