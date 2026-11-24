import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const viewer = 'http://127.0.0.1:5221';
const folder = new URL('../evidence/p10b4b/r2/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('voice/manifest.json', folder), 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const files = {};
for (const item of manifest.files) {
  const wav = await readFile(new URL('voice/' + item.id + '.wav', folder));
  assert.equal(sha256(wav), item.sha256);
  files[item.id] = wav.subarray(44).toString('base64');
}
const markup = `<!doctype html><meta charset="utf-8"><main><h1>Offline eSpeak listening review</h1></main><script type="module">
import { AudioManager } from '/src/audio/manager.ts';
import { decodeNamedPcm } from '/src/audio/named-voice.ts';
import { SliceDriver, timing } from '/src/slice-driver.ts';
const files = ${JSON.stringify(files)};
const read = id => Uint8Array.from(atob(files[id]), c => c.charCodeAt(0));
const driver = new SliceDriver('capacity', [], true);
const speech = new Map(Object.keys(files).filter(id => id.startsWith('wish-')).map(id => [id, decodeNamedPcm(read(id))]));
let start;
let now = 0;
const audio = new AudioManager(timing.focusHoldMs, () => start === undefined ? 0 : Math.floor(performance.now() - start), {
  idle: { seed: 9, gap: 10000 }, idleSpeech: speech,
  namedProvider: async (template, signal) => {
    signal.throwIfAborted();
    const {nameId, gift, count} = template;
    if (gift !== 'rose' || !files[nameId] || count !== (nameId === 'an' ? 5 : 1)) throw new Error('offline corpus scope');
    return read(nameId);
  },
});
window.r2 = { now, changes: [] };
let prior;
function tick(t) {
  start ??= t;
  now = Math.max(0, Math.round(t - start));
  const frame = driver.update(now);
  audio.frame(frame.state, frame.audio, frame.actor);
  const change = { at: now, mode: frame.state.camera.mode, seat: frame.actor?.seatId, count: frame.state.confirmedGiftCount };
  const key = [change.mode, change.seat, change.count].join('|');
  if (key !== prior) { window.r2.changes.push(change); prior = key; }
  Object.assign(window.r2, { now, audio: audio.report });
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
</script>`;

const server = await createServer({ server: { port: 5221 }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({
  executablePath: process.env.V2_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ignoreDefaultArgs: ['--mute-audio'],
});
try {
  const page = await browser.newPage();
  const pageErrors = [];
  const external = [];
  page.on('pageerror', err => pageErrors.push(err.message));
  page.on('request', req => { if (new URL(req.url()).origin !== viewer) external.push(req.url()); });
  await page.addInitScript(() => {
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (dest, ...args) {
      const result = connect.call(this, dest, ...args);
      if (dest !== this.context.destination || window.finishR2) return result;
      const tap = this.context.createMediaStreamDestination();
      connect.call(this, tap);
      const recorder = new MediaRecorder(tap.stream, { mimeType: 'audio/webm;codecs=opus' });
      const start = this.context.currentTime;
      const chunks = [];
      recorder.ondataavailable = event => chunks.push(event.data);
      window.finishR2 = () => new Promise(resolve => {
        recorder.onstop = async () => {
          const reader = new FileReader();
          reader.onload = () => resolve({ start, base64: reader.result.split(',')[1] });
          reader.readAsDataURL(new Blob(chunks, { type: recorder.mimeType }));
        };
        recorder.stop();
      });
      recorder.start();
      return result;
    };
  });
  await page.route('**/p10b4b-local-listen.html', route => route.fulfill({ contentType: 'text/html', body: markup }));
  await page.goto(viewer + '/p10b4b-local-listen.html');
  await page.waitForFunction(() => window.r2?.now > 0).catch(error => {
    throw new Error(pageErrors.join('; ') || error.message);
  });
  const choices = page.locator('#audio-controls input[type=checkbox]');
  await choices.nth(1).uncheck(); // isolate spoken idle from bells
  await choices.nth(2).check();
  await page.locator('#audio-controls button').first().click();
  await page.waitForFunction(() => window.r2.audio.voice?.ready === 4);
  await page.waitForFunction(() => window.r2.audio.marks.filter(item => item.event === 'idle-end').length === 2, {}, { timeout: 43000 });
  await page.evaluate(() => {
    const input = document.querySelector('#audio-controls input[type=number]');
    input.value = String((45200 - window.r2.now) / 1000);
    input.dispatchEvent(new Event('change'));
  });
  await page.waitForFunction(() => window.r2.now >= 65050, {}, { timeout: 55000 });
  await page.evaluate(() => {
    const input = document.querySelector('#audio-controls input[type=number]');
    input.value = '10';
    input.dispatchEvent(new Event('change'));
  });
  await page.waitForFunction(() => window.r2.now >= 79000, {}, { timeout: 30000 });
  const state = await page.evaluate(() => window.r2);
  const tape = await page.evaluate(() => window.finishR2());
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(external, []);
  const marks = state.audio.marks;
  const starts = marks.filter(item => item.event === 'voice-start');
  const ends = marks.filter(item => item.event === 'voice-end');
  assert.deepEqual(starts.map(item => [item.seat, item.variant]), [['seat-1', 'named'], ['seat-2', 'named'], ['seat-3', 'named']]);
  assert.equal(ends.length, 3);
  const focusTimes = [47050, 52900, 58750];
  assert(starts.every((item, i) => item.sceneMs >= focusTimes[i] && item.sceneMs - focusTimes[i] < 350));
  assert(starts.every((item, i) => i === 0 || ends[i - 1].contextSec < item.contextSec));
  const idle = marks.filter(item => item.event === 'idle-start');
  assert(idle.length >= 4 && idle.at(-1).sceneMs >= 75050);
  const cut = marks.find(item => item.event === 'idle-cut' && item.reason === 'gift-activity');
  assert(cut && cut.sceneMs >= 46000 && cut.seconds === .030);
  assert.equal(state.changes.at(-1).count, 8);
  assert.equal(state.changes.at(-1).mode, 'CINEMATIC');
  const decoded = spawnSync('ffmpeg', ['-v', 'error', '-i', 'pipe:0', '-c:a', 'pcm_s16le', '-ar', '24000', '-ac', '1', '-f', 'wav', 'pipe:1'],
    { input: Buffer.from(tape.base64, 'base64'), maxBuffer: 8000000 });
  assert.equal(decoded.status, 0, decoded.stderr.toString());
  const wav = decoded.stdout;
  // Rewrite stream placeholders so both browsers and standard WAV readers can seek.
  let dataHeader = 12;
  while (wav.toString('ascii', dataHeader, dataHeader + 4) !== 'data') dataHeader += 8 + wav.readUInt32LE(dataHeader + 4);
  const data = wav.subarray(dataHeader + 8);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.writeUInt32LE(data.length, dataHeader + 4);
  let peak = 0, clipped = 0;
  for (let i = 0; i < data.length; i += 2) {
    const value = Math.abs(data.readInt16LE(i));
    peak = Math.max(peak, value);
    if (value >= 32767) clipped++;
  }
  const peakDbfs = 20 * Math.log10(peak / 32768);
  assert(peak > 2000 && peakDbfs <= -1 && clipped === 0);
  await writeFile(new URL('offline-espeak-review.wav', folder), wav);
  await writeFile(new URL('timeline.json', folder), JSON.stringify({
    source: process.env.V2_CAPTURE_REVISION ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding:'utf8' }).trim(),
    browser: browser.version(), provider: 'offline eSpeak NG 1.0.2, separately labeled', externalRequests: 0,
    scenario: 'real-time existing capacity DEMO via SliceDriver and native AudioManager; harness captures the audio graph',
    recording: { sha256: sha256(wav), bytes: wav.length, seconds: data.length / 48000, peakDbfs, clipped, startContextSec: tape.start },
    expectedFocusStarts: focusTimes, marks, camera: state.changes,
  }, null, 2) + '\n');
  console.log('Recorded review WAV', data.length / 48000, peakDbfs, idle.length, starts.map(item => item.sceneMs));
} finally {
  await browser.close();
  await server.close();
}
