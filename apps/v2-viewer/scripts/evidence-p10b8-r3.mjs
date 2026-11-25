import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import tree from '../src/sakura-r18a.json' with { type: 'json' };

const baseline = process.env.V2_P10B8_R2_APP;
assert(baseline, 'Set V2_P10B8_R2_APP to the built Viewer at 5713e5c');
const output = resolve(process.env.V2_EVIDENCE_DIR ?? '../../packages/v2-live-gateway/evidence/p10b8/r3');
const viewport = { width: 720, height: 1280 };
const baseUrl = 'http://127.0.0.1:5198';
const candidateUrl = 'http://127.0.0.1:5197';
const baselineSha = '5713e5c74877cbc716a68dc724899019becdb0ad';
const poses = {
  under: { position: [8, 3.4, 24], target: [0, 6.2, 1.8], fov: 55 },
  wide: { position: [0, 10, 44], target: [0, 9.5, 0], fov: 58 },
  aerial: { position: [19, 43, 32], target: [0, 10, 0], fov: 54 },
  water: { position: [10, 2.25, 30], target: [2, 1.15, 13], fov: 53 },
  flowers: { position: [-8, 5.0, 24], target: [-4.5, .5, 12], fov: 56 },
};
const servers = [];
const pageErrors = [];
let browser;
const receipt = {};
await mkdir(output, { recursive: true });

async function open(origin, { inspect = true, profile = 'quality', look = 'gold', density = 'lush',
  fallback = false, demo = 'community' } = {}) {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', msg => {
    if (/shader error|OUT_OF_MEMORY|INVALID_FRAMEBUFFER_OPERATION/i.test(msg.text())) pageErrors.push(msg.text());
  });
  if (fallback) await page.route('**/r18a/*.glb', route => route.fulfill({ status: 404 }));
  const query = new URLSearchParams({ clean: '1', demo, seed: '9', presence: 'on', gifticons: 'on',
    blessing: 'on', chatbubbles: 'on', seats: 'rings', shots: 'hero', ambience: 'rich', botanicals: 'on',
    diversity: 'on', tree: 'r18a', profile, look, density, ...(inspect && { inspect: '1' }) });
  await page.goto(origin + '/?' + query);
  await page.waitForFunction(manual => (manual ? window.p08Review : window.viewerReport?.drawCalls) ||
    window.viewerReport?.errors.length, inspect, { timeout: 45_000 });
  const report = await page.evaluate(() => window.viewerReport);
  assert.deepEqual(report.errors, []);
  assert.equal(report.repoRevision === baselineSha, origin === baseUrl);
  assert.equal(report.asset.assetRevision, fallback ? 'R17B' : 'R18A');
  if (!fallback) assert.equal(report.asset.sha256, tree.profiles[profile].sha256);
  assert.equal(report.world.density, density);
  return { page, report };
}

async function frame(page, seconds, pose, file, recover = false) {
  const summary = await page.evaluate(({ seconds, pose }) => {
    const begin = Math.floor((window.viewerReport.elapsedSeconds ?? 0) * 60) + 1;
    for (let i = begin; i / 60 < seconds; i++) window.p08Review.step(i / 60, false);
    const r = window.p08Review.step(seconds, true, undefined, undefined, undefined, pose);
    const gl = document.querySelector('canvas').getContext('webgl2');
    gl.finish();
    return {
      time: r.elapsedSeconds, pose: { position: r.position, target: r.target, fov: r.fov }, appearance: r.appearance,
      canopy: r.r18Canopy, gold: r.r18Accent, lobes: r.driftingGold, focus: r.focus, mode: r.mode,
      nameplates: r.nameplates, names: r.community?.names, gifts: r.confirmedGiftCount,
      counts: r.lotusVisible, colors: r.lotusVisibleTones, visibleDecorativeActors: r.visibleDecorativeInstances,
      draws: r.drawCalls, triangles: r.trianglesDrawn, errors: r.errors, gl: gl.getError(),
    };
  }, { seconds, pose });
  assert.equal(summary.gl, 0);
  assert.deepEqual(summary.errors, recover ? ['webglcontextlost'] : []);
  const png = await page.locator('#stage').screenshot();
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [720, 1280]);
  if (file) await writeFile(resolve(output, file), png);
  return { ...summary, sha256: createHash('sha256').update(png).digest('hex'), file };
}

function totals(report) {
  const slots = report.communityLayout;
  return {
    realSeats: slots.filter(slot => slot.id.startsWith('seat-')).length,
    decorativeSlots: slots.filter(slot => !slot.id.startsWith('seat-')).length,
    ...report.lotusLayout.instances.reduce((counts, item) => {
      counts[item.kind]++;
      if (item.petalTone) {
        const colors = counts.colors[item.kind];
        colors[item.petalTone] = (colors[item.petalTone] ?? 0) + 1;
      }
      return counts;
    }, { pad: slots.length, leaf: 0, bloom: 0, bud: 0, colors: { bloom: {}, bud: {} } }),
  };
}

async function compare(origin, label) {
  // Static A/B uses an identical explicit pose and look clock. Gift uses the actual director.
  const { page, report } = await open(origin);
  const shots = {};
  for (const [name, pose] of Object.entries(poses)) shots[name] = await frame(page, 18.1, pose, label + '-' + name + '.png');
  shots.gift = await frame(page, 18.1, undefined, label + '-gift.png');
  assert.equal(shots.gift.mode, 'GIFT_FOCUS');
  assert(shots.gift.names.some(name => name.seatId === shots.gift.focus.seatId));
  const plate = shots.gift.nameplates[shots.gift.focus.seatId];
  assert(plate.visible && plate.anchor.y < plate.head.y);
  const result = { revision: report.repoRevision, asset: report.asset.sha256, world: report.world, totals: totals(report), shots };
  if (origin === candidateUrl) {
    const before = shots.wide;
    await page.evaluate(() => {
      window.loss = document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');
      window.loss.loseContext();
    });
    await page.waitForFunction(() => window.viewerReport.errors.includes('webglcontextlost'));
    await page.evaluate(() => window.loss.restoreContext());
    await page.waitForFunction(() => window.viewerReport.contextRestores === 1);
    const after = await frame(page, 18.1, poses.wide, undefined, true);
    assert.deepEqual(after.counts, before.counts);
    assert.deepEqual(after.colors, before.colors);
    assert.deepEqual(after.lobes, before.lobes);
    assert.equal(after.sha256, before.sha256);
    result.contextRecovery = after;
  }
  await page.close();
  const twilight = await open(origin, { look: 'twilight' });
  result.twilight = await frame(twilight.page, 18.1, poses.under, label + '-twilight-under.png');
  await twilight.page.close();
  return result;
}

async function parity(options) {
  const before = await open(baseUrl, options);
  const after = await open(candidateUrl, options);
  const a = await frame(before.page, 4, poses.under);
  const b = await frame(after.page, 4, poses.under);
  assert.equal(b.sha256, a.sha256);
  assert.equal(b.canopy, undefined);
  assert.equal(b.lobes, undefined);
  await before.page.close();
  await after.page.close();
  return { options, sha256: b.sha256, tree: after.report.asset.assetRevision, failures: after.report.asset.failures };
}

async function benchmark(origin) {
  const { page, report } = await open(origin, { inspect: false });
  const sample = await page.evaluate(async () => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    const frames = [];
    const renders = [];
    return new Promise(resolve => {
      let start;
      let previous;
      function observe(now) {
        const r = window.viewerReport;
        start ??= now;
        if (previous !== undefined) frames.push(now - previous);
        previous = now;
        renders.push([r.drawCalls, r.trianglesDrawn]);
        if (now - start < 8000) return requestAnimationFrame(observe);
        frames.sort((a,b) => a-b);
        const p = q => frames[Math.ceil(frames.length * q) - 1];
        resolve({ frames: frames.length, fps: frames.length * 1000 / (now - start),
          p50: p(.50), p95: p(.95), p99: p(.99), maxDrawCalls: Math.max(...renders.map(r => r[0])),
          maxTriangles: Math.max(...renders.map(r => r[1])), shot: r.shot, elapsedSeconds: r.elapsedSeconds, errors: r.errors });
      }
      requestAnimationFrame(observe);
    });
  });
  assert.deepEqual(sample.errors, []);
  await page.close();
  return { ...sample, graphics: report.graphics, revision: report.repoRevision };
}

async function previewVideo() {
  const { page } = await open(candidateUrl, { inspect: false });
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 2_900_000 });
    const chunks = [];
    const shots = new Set();
    const focus = new Map();
    const start = performance.now();
    const timer = setInterval(() => {
      const r = window.viewerReport;
      shots.add(r.shot);
      if (r.focus && r.mode === 'GIFT_FOCUS') focus.set(r.focus.seatId, r.focus.name);
    }, 100);
    recorder.ondataavailable = event => chunks.push(event.data);
    window.previewReceipt = new Promise(resolve => {
      recorder.onstop = () => {
        const track = stream.getVideoTracks()[0];
        const { width, height, frameRate } = track.getSettings();
        track.stop();
        clearInterval(timer);
        const blob = new Blob(chunks, { type: 'video/webm' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'quality-preview.webm';
        link.click();
        resolve({ duration: (performance.now() - start) / 1000, bytes: blob.size, width, height, frameRate,
          shots: [...shots], giftFocus: [...focus], errors: window.viewerReport.errors });
      };
    });
    recorder.start(1000);
    setTimeout(() => recorder.stop(), 28_000);
  });
  const download = await page.waitForEvent('download', { timeout: 45_000 });
  await download.saveAs(resolve(output, 'quality-preview.webm'));
  const details = await page.evaluate(() => window.previewReceipt);
  assert.deepEqual(details.errors, []);
  assert(details.duration >= 20 && details.duration < 40);
  assert.deepEqual([details.width, details.height], [720, 1280]);
  await page.close();
  return details;
}

try {
  servers.push(await preview({ preview: { port: 5197 } }));
  servers.push(await preview({ root: resolve(baseline), preview: { port: 5198 } }));
  browser = await chromium.launch({
    executablePath: process.env.V2_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: process.env.V2_HEADED !== '1',
    args: process.env.V2_GPU_HIGH === '1' ? ['--force-high-performance-gpu'] : [],
  });
  receipt.browser = browser.version();
  receipt.config = { viewport, seed: 9, look: 'gold', profile: 'quality', density: 'lush',
    visible: 'Extra pads and plants whose bounding spheres intersect the frustum. No depth/occlusion test.',
    benchmark: 'Native rAF, warmup 1.2s, sample 8s, same seed and route starting at scene boot, no Studio.' };
  receipt.baseline = await compare(baseUrl, 'r2');
  receipt.candidate = await compare(candidateUrl, 'r3');
  for (const key of Object.keys(receipt.baseline.shots)) {
    assert.deepEqual(receipt.candidate.shots[key].pose, receipt.baseline.shots[key].pose);
    assert.deepEqual(receipt.candidate.shots[key].appearance, receipt.baseline.shots[key].appearance);
  }
  const water = await open(candidateUrl, { demo: 'idle' });
  receipt.water = [];
  for (const seconds of [0, 4, 8, 12]) {
    const result = await frame(water.page, seconds, poses.water, 'water-t' + seconds + '.png');
    if (seconds) {
      assert.deepEqual(result.pose, receipt.water[0].pose);
      assert.notDeepEqual(result.lobes, receipt.water[0].lobes);
    }
    receipt.water.push(result);
  }
  await water.page.close();
  receipt.parity = [];
  for (const options of [{ profile: 'eco' }, { density: 'legacy' }, { fallback: true }, { look: 'legacy' }]) {
    receipt.parity.push(await parity(options));
  }
  receipt.benchmark = { r2: await benchmark(baseUrl), r3: await benchmark(candidateUrl) };
  assert.deepEqual(receipt.benchmark.r2.graphics, receipt.benchmark.r3.graphics);
  receipt.clip = await previewVideo();
  assert.deepEqual(pageErrors, []);
  await writeFile(resolve(output, 'native.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ baseline: receipt.baseline.totals, candidate: receipt.candidate.totals,
    benchmark: receipt.benchmark, clip: receipt.clip }, null, 2));
} finally {
  await browser?.close();
  await Promise.all(servers.map(server => server.close()));
}
