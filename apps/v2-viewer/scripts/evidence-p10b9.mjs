import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { cpus, totalmem } from 'node:os';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { PerspectiveCamera, Vector3 } from 'three';
import { createAmbientFx } from '../src/ambient-fx.ts';
import { createTrunkMist } from '../src/trunk-mist.ts';
import { richAmbientProfiles } from '../src/fx-profiles.ts';
import pins from '../src/environment-b9.json' with { type: 'json' };

const clipOnly = process.argv.includes('--clip-only');
const baseline = process.env.V2_P10B8_APP;
if (!clipOnly) assert(baseline, 'Set V2_P10B8_APP to the built Viewer at 891786a');
const output = resolve(process.env.V2_EVIDENCE_DIR ?? '../../packages/v2-live-gateway/evidence/p10b9');
const baseUrl = 'http://127.0.0.1:5198';
const candidateUrl = 'http://127.0.0.1:5197';
const viewport = { width: 720, height: 1280 };
const poses = {
  aerial: { position: [19, 43, 32], target: [0, 10, 0], fov: 54 },
  wide: { position: [0, 10, 44], target: [0, 9.5, 0], fov: 58 },
  under: { position: [8, 3.4, 24], target: [0, 6.2, 1.8], fov: 55 },
  branch: { position: [14, 11.5, 21], target: [3, 14, 0], fov: 49 },
  low: { position: [4.0, 4.1, 35.2], target: [3.55, .1, 25], fov: 55 },
  gift: undefined,
};
const errors = [];
const servers = [];
let browser;
await mkdir(output, { recursive: true });

async function open(profile, enabled, { origin = candidateUrl, manual = true, demo = 'community',
  missing = false, corrupt = false, importFailure = false, giftIcons = 'on' } = {}) {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => {
    if (/shader error|OUT_OF_MEMORY|INVALID_FRAMEBUFFER_OPERATION/i.test(msg.text())) errors.push(msg.text());
  });
  if (missing) await page.route('**/b9/distant_terrain_*.glb', route => route.fulfill({ status: 404 }));
  if (corrupt) await page.route('**/b9/koi_sanke_*.glb', route => route.fulfill({ body: 'invalid binary' }));
  if (importFailure) await page.route('**/b9/koi_yamabuki_*.glb', route => route.abort('failed'));
  const query = new URLSearchParams({ clean: '1', environment: enabled ? 'on' : 'off', tree: 'r18a', profile,
    look: 'gold', density: 'lush', demo, seed: '9', presence: 'on', gifticons: giftIcons, blessing: 'on', chatbubbles: 'on',
    seats: 'rings', shots: 'hero', ambience: 'rich', botanicals: 'on', diversity: 'on', ...(manual && { inspect: '1' }) });
  await page.goto(origin + '/?' + query);
  await page.waitForFunction(manual => (manual ? window.p08Review : window.viewerReport?.drawCalls) ||
    window.viewerReport?.errors.length, manual, { timeout: 45_000 });
  const report = await page.evaluate(() => window.viewerReport);
  assert.deepEqual(report.errors, []);
  assert.equal(report.profile, profile);
  assert.equal(report.asset.assetRevision, 'R18A');
  if (origin === baseUrl) assert.equal(report.repoRevision, '891786afaa50add5eeb16c969f094d79067d311d');
  if (enabled && !missing && !corrupt && !importFailure) {
    assert.deepEqual(report.world.pond, true);
    assert.equal(report.pond.assets.length, 4);
    for (const asset of report.pond.assets) {
      assert.equal(asset.sha256, pins.profiles[asset.file].sha256);
      assert.equal(pins.profiles[asset.file].profile, profile);
    }
  }
  return { page, report };
}

async function frame(page, seconds, pose, file, restored = false) {
  const result = await page.evaluate(async ({ seconds, pose }) => {
    const first = Math.floor((window.viewerReport.elapsedSeconds ?? 0) * 60) + 1;
    for (let i = first; i / 60 < seconds; i++) window.p08Review.step(i / 60, false);
    const r = window.p08Review.step(seconds, true, undefined, undefined, undefined, pose);
    const gl = document.querySelector('canvas').getContext('webgl2');
    const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', pixels)),
      v => v.toString(16).padStart(2, '0')).join('');
    return { hash, time: r.elapsedSeconds, camera: { position: r.position, target: r.target, fov: r.fov },
      appearance: r.appearance, lobes: r.driftingGold, pond: r.pondInspection, koi: r.koiVisible,
      fxBaseline: r.richAmbience, fx: r.pondFx, lotus: r.lotusVisible, nameplates: r.nameplates,
      giftOpacity: r.fx?.gift?.opacity ?? 0, foreground: !!r.bubbles?.chat || !!r.focus,
      focus: r.focus, mode: r.mode, giftCount: r.confirmedGiftCount, counts: r.drawCalls, triangles: r.trianglesDrawn,
      gl: gl.getError(), errors: r.errors };
  }, { seconds, pose });
  assert.equal(result.gl, 0);
  assert.deepEqual(result.errors, restored ? ['webglcontextlost'] : []);
  if (file) {
    const png = await page.locator('#stage').screenshot();
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [720, 1280]);
    await writeFile(resolve(output, file), png);
    result.file = file;
    result.png = createHash('sha256').update(png).digest('hex');
  }
  return result;
}

function referenceParticles(profile, report, shots) {
  const tree = new Vector3().fromArray(report.treeTarget);
  const budget = richAmbientProfiles[profile];
  const local = { pads: report.communityLayout.map(slot => slot.position), each: budget.perPad };
  const fx = createAmbientFx(tree, report.seed, budget.tree, local);
  const mist = createTrunkMist(tree, profile);
  const camera = new PerspectiveCamera(50, viewport.width / viewport.height, report.near, report.far);
  try {
    for (const shot of Object.values(shots)) {
      assert.equal(fx.points.geometry.getAttribute('position').count, shot.fxBaseline.totalPoints);
      camera.position.fromArray(shot.camera.position);
      camera.lookAt(...shot.camera.target);
      camera.fov = shot.camera.fov;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      fx.update(shot.time, shot.giftOpacity, shot.foreground);
      mist.update(shot.time);
      shot.referenceFx = { active: fx.totals, spatial: fx.spatialCounts(camera), mist: mist.spatialCount(camera) };
    }
  } finally {
    fx.dispose();
    mist.dispose();
  }
}

async function matrix(profile, enabled) {
  const { page, report } = await open(profile, enabled, { origin: enabled ? candidateUrl : baseUrl });
  const shots = {};
  for (const [shot, pose] of Object.entries(poses)) {
    shots[shot] = await frame(page, 18.1, pose, profile + '-' + (enabled ? 'on' : 'off') + '-' + shot + '.png');
  }
  assert.equal(shots.gift.mode, 'GIFT_FOCUS');
  if (!enabled) referenceParticles(profile, report, shots);
  const plate = shots.gift.nameplates[shots.gift.focus.seatId];
  assert(plate.visible && plate.anchor.y < plate.head.y);
  await page.close();
  return { revision: report.repoRevision, asset: report.asset.sha256, pond: report.pond, shots };
}

const withoutVisibility = report => report.pond.fish.map(({ inFrustum, ...pose }) => pose);

async function proof(profile) {
  const { page } = await open(profile, true, { demo: 'idle' });
  const fixed = [];
  for (const t of [15, 17, 19, 21]) fixed.push(await frame(page, t, poses.low, profile + '-fish-t' + t + '.png'));
  assert(fixed.some(f => f.koi > 0));
  assert.notDeepEqual(withoutVisibility(fixed[0]), withoutVisibility(fixed.at(-1)));
  const other = await frame(page, 21, poses.aerial, profile + '-fish-t21-aerial.png');
  assert.deepEqual(withoutVisibility(other), withoutVisibility(fixed.at(-1)));
  assert.notDeepEqual(other.camera, fixed.at(-1).camera);
  assert.notEqual(other.hash, fixed.at(-1).hash);
  const before = await frame(page, 21, poses.low);
  await page.evaluate(() => {
    window.loss = document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');
    window.loss.loseContext();
  });
  await page.waitForFunction(() => window.viewerReport.errors.includes('webglcontextlost'));
  await page.evaluate(() => window.loss.restoreContext());
  await page.waitForFunction(() => window.viewerReport.contextRestores === 1);
  const recovered = await frame(page, 21, poses.low, profile + '-restored.png', true);
  assert.deepEqual(recovered.pond, before.pond);
  await page.close();
  return { fixed, other, recovered, framebufferMatch: recovered.hash === before.hash };
}

async function benchmark(profile, enabled) {
  const { page, report } = await open(profile, enabled, { manual: false, origin: enabled ? candidateUrl : baseUrl });
  const data = await page.evaluate(async () => {
    await new Promise(resolve => setTimeout(resolve, 1100));
    const frames = [], data = [];
    return new Promise(resolve => {
      let start, previous;
      function sample(now) {
        const r = window.viewerReport;
        start ??= now;
        if (previous !== undefined) frames.push(now - previous);
        previous = now;
        data.push([r.drawCalls, r.trianglesDrawn, r.geometries, r.textures, r.koiVisible ?? 0]);
        if (now - start < 8000) return requestAnimationFrame(sample);
        frames.sort((a,b) => a-b);
        const p = q => frames[Math.ceil(frames.length * q) - 1];
        const max = i => Math.max(...data.map(x => x[i]));
        resolve({ fps: frames.length * 1000 / (now - start), frames: frames.length,
          p50: p(.5), p95: p(.95), p99: p(.99), calls: max(0), triangles: max(1), geometries: max(2),
          textures: max(3), koi: max(4), heap: performance.memory?.usedJSHeapSize, errors: r.errors, shot: r.shot });
      }
      requestAnimationFrame(sample);
    });
  });
  await page.close();
  assert.deepEqual(data.errors, []);
  return { ...data, renderer: report.graphics, treeLoadMs: report.asset.totalLoadMs, revision: report.repoRevision };
}

async function clip() {
  // Record the ordinary Community gifts and a complete route after return.
  // Gift icon QA injects extra gifts late in the DEMO and restarts that route.
  const { page, report } = await open('quality', true, { manual: false, giftIcons: 'off' });
  await page.bringToFront();
  await page.evaluate(() => {
    const stream = document.querySelector('canvas').captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 2_450_000 });
    const start = performance.now();
    const parts = [], shots = new Set(), gift = new Set(), traceRows = [];
    let previous;
    const trace = setInterval(() => {
      const r = window.viewerReport;
      shots.add(r.shot);
      const key = [r.shot, r.cycle, r.mode].join('/');
      if (key !== previous) {
        traceRows.push({ time: r.elapsedSeconds, shot: r.shot, cycle: r.cycle, route: r.routeId, mode: r.mode });
        previous = key;
      }
      if (r.mode === 'GIFT_FOCUS' && r.focus) gift.add(r.focus.seatId);
    }, 100);
    recorder.ondataavailable = event => parts.push(event.data);
    window.recording = new Promise(resolve => {
      recorder.onstop = () => {
        clearInterval(trace);
        const track = stream.getVideoTracks()[0];
        const { width, height, frameRate } = track.getSettings();
        track.stop();
        const blob = new Blob(parts, { type: 'video/webm' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'quality-environment.webm';
        link.click();
        resolve({ width, height, frameRate, duration: (performance.now() - start) / 1000,
          bytes: blob.size, shots: [...shots], focus: [...gift], trace: traceRows, errors: window.viewerReport.errors });
      };
    });
    recorder.start(1000);
    setTimeout(() => recorder.stop(), 72_000);
  });
  const download = await page.waitForEvent('download', { timeout: 92_000 });
  await download.saveAs(resolve(output, 'quality-environment.webm'));
  const data = await page.evaluate(() => window.recording);
  await page.close();
  assert(data.duration >= 40 && data.focus.length);
  assert(['HERO_WIDE_TREE_REFLECTION', 'COMMUNITY', 'HERO_TOP_RING', 'AERIAL', 'UNDER_TREE']
    .every(shot => data.shots.includes(shot)), JSON.stringify(data.shots));
  assert.deepEqual([data.width, data.height], [720, 1280]);
  assert.deepEqual(data.errors, []);
  return { ...data, revision: report.repoRevision, extraIconDemoGifts: false };
}

const receipt = {
  config: { viewport, profile: ['eco', 'quality'], density: 'lush', look: 'gold', seed: 9,
    benchmark: '1.1s warmup, 8s rAF matched opening route, no Studio',
    visible: 'Frustum intersection or particle-center estimate, before occlusion. See frames for actual visibility.' },
  machine: { cpu: cpus()[0].model, ramBytes: totalmem() },
  profiles: {},
};
try {
  servers.push(await preview({ preview: { port: 5197 } }));
  if (!clipOnly) servers.push(await preview({ root: resolve(baseline), preview: { port: 5198 } }));
  else Object.assign(receipt, JSON.parse(await readFile(resolve(output, 'native.json'), 'utf8')));
  browser = await chromium.launch({
    executablePath: process.env.V2_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: process.env.V2_HEADED !== '1',
    args: ['--disable-backgrounding-occluded-windows',
      ...(process.env.V2_GPU_HIGH === '1' ? ['--force-high-performance-gpu'] : [])],
  });
  receipt.browser = browser.version();
  for (const profile of clipOnly ? [] : ['eco', 'quality']) {
    const off = await matrix(profile, false);
    const on = await matrix(profile, true);
    for (const shot of Object.keys(poses)) {
      assert.deepEqual(on.shots[shot].camera, off.shots[shot].camera);
      assert.deepEqual(on.shots[shot].appearance, off.shots[shot].appearance);
      assert.deepEqual(on.shots[shot].lotus, off.shots[shot].lotus);
    }
    let fingerprint;
    const baselineIdle = await open(profile, false, { origin: baseUrl, demo: 'idle' });
    const baselineHash = (await frame(baselineIdle.page, 18.1, poses.wide)).hash;
    await baselineIdle.page.close();
    const parity = [];
    for (const options of [{}, { missing: true }, { corrupt: true }, { importFailure: true }]) {
      const { page, report } = await open(profile, Object.keys(options).length > 0, { ...options, demo: 'idle' });
      const shot = await frame(page, 18.1, poses.wide);
      assert.equal(shot.hash, baselineHash);
      if (options.missing) assert.deepEqual(report.world.pond, ['terrain', 'MISSING']);
      if (options.corrupt) assert.deepEqual(report.world.pond, ['sanke', 'INTEGRITY']);
      if (options.importFailure) assert.deepEqual(report.world.pond, ['yamabuki', 'IMPORT']);
      parity.push({ status: report.world.pond ?? 'off', hash: shot.hash });
      fingerprint = report.asset.sha256;
      await page.close();
    }
    assert.equal(fingerprint, on.asset);
    const samples = await proof(profile);
    const before = await benchmark(profile, false);
    const after = await benchmark(profile, true);
    assert.equal(before.renderer, after.renderer);
    receipt.profiles[profile] = { off, on, parity, samples, benchmark: { before, after } };
    console.log(profile, JSON.stringify({ before, after, fixed: samples.fixed.map(s => s.koi), restored: samples.framebufferMatch }));
    await writeFile(resolve(output, 'native.json'), JSON.stringify(receipt, null, 2) + '\n');
  }
  receipt.clip = await clip();
  assert.equal(receipt.clip.revision, receipt.profiles.quality.on.revision);
  assert.deepEqual(errors, []);
  await writeFile(resolve(output, 'native.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify(receipt.clip));
} finally {
  await browser?.close();
  await Promise.all(servers.map(server => server.close()));
}
