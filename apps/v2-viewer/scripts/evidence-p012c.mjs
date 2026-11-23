import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import manifest from '../src/p012b-botanicals.json' with { type: 'json' };

const baseline = '0a5d060d0ec4eeda19d62cfcd4a58a29f58c38bf';
const current = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const root = process.cwd();
const prior = resolve(process.env.V2_P012A_APP || '../../../.p012a/apps/v2-viewer');
const output = resolve(process.env.V2_EVIDENCE_DIR || 'evidence/p012c');
const viewport = { width: 720, height: 1280 };
const profiles = ['eco', 'quality'];
const low = { position: [14, 6, 38], target: [0, 8, 3], fov: 51 };
const poses = [
  ['low', 7.5, low],
  ['arrival', 8.45, { position: [5.4, 3.4, 23], target: [.9, 3.6, 7], fov: 52 }],
  ['aerial', 14.5, { position: [19, 40, 31], target: [0, 12, 0], fov: 52 }],
  ['gift', 18.3],
  ['lake', 27, { position: [10, 2.25, 30], target: [2, 1.15, 13], fov: 53 }],
  ['under', 39, { position: [6, 2.8, 17], target: [0, 7, 0], fov: 55 }],
  ['return', 85],
];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const write = (name, data) => writeFile(resolve(output, name), JSON.stringify(data, null, 2) + '\n');
const graphicsError = /\b(?:GL_)?(?:INVALID_[A-Z_]+|OUT_OF_MEMORY|STACK_UNDERFLOW|STACK_OVERFLOW)\b|shader error|VALIDATE_STATUS false/i;
const inheritedDelete = /^WebGL: INVALID_OPERATION: delete(?:VertexArray)?: object does not belong to this context$/;
const executablePath = process.env.V2_BROWSER;
assert.ok(executablePath, 'Set V2_BROWSER to an Edge or Chromium executable');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let old, next;

async function serve(dir, port) {
  process.chdir(dir);
  try {
    const server = await createServer({ root: dir, server: { host: '127.0.0.1', port, strictPort: true, watch: null }, logLevel: 'error' });
    await server.listen();
    return { server, url: `http://127.0.0.1:${port}` };
  } finally { process.chdir(root); }
}

async function open(site, { revision = current, profile = 'eco', demo = 'community', seed = 9,
  option, extra = '' } = {}) {
  const page = await browser.newPage({ viewport });
  const logs = [], failures = [], requests = [];
  page.on('console', msg => {
    if (['warning', 'error'].includes(msg.type()) || /WebGLRenderer: Context (Lost|Restored)/.test(msg.text())) {
      logs.push({ atMs: performance.now(), type: msg.type(), message: msg.text() });
    }
  });
  page.on('pageerror', error => failures.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failures.push(response.url() + ' ' + response.status()); });
  page.on('request', request => { if (/\/p012b\/.*\.glb$/.test(request.url())) requests.push(new URL(request.url()).pathname); });
  await page.route('**/favicon.ico', route => route.fulfill({ status: 204 }));
  const url = site + `/?inspect=1&clean=1&demo=${demo}&seed=${seed}&profile=${profile}` +
    (option ? `&botanicals=${option}` : '') + extra;
  await page.goto(url);
  await page.waitForFunction(() => window.p08Review || window.viewerReport?.errors.length);
  const report = await page.evaluate(() => window.viewerReport);
  assert.equal(report.repoRevision, revision);
  assert.deepEqual(report.viewport, [720, 1280]);
  assert.deepEqual(report.errors, []);
  return { page, url, report, requests, logs, failures };
}

async function close(run) {
  await run.page.close();
  assert.deepEqual(run.failures, []);
  assert.deepEqual(run.logs.filter(row => graphicsError.test(row.message)), []);
}

function draw(page, time, fixed) {
  return page.evaluate(({ time, fixed }) => {
    const from = Math.floor((window.viewerReport.elapsedSeconds ?? 0) * 60) + 1;
    for (let i = from; i / 60 < time; i++) window.p08Review.step(i / 60, false);
    const report = window.p08Review.step(time, true, undefined, undefined, undefined, fixed);
    const gl = document.querySelector('canvas').getContext('webgl2');
    gl.finish();
    return { ...report, glError: gl.getError() };
  }, { time, fixed });
}

function shot(page) {
  return page.locator('#stage').screenshot({ animations: 'disabled' });
}

function trace(run, end) {
  return run.page.evaluate(end => {
    const { botanicals } = window.viewerReport;
    const samples = [];
    let minimumCameraClearance = Infinity;
    for (let frame = 0; frame <= end * 60; frame++) {
      const r = window.p08Review.step(frame / 60, false);
      const [cx, cy, cz] = r.position;
      for (const plant of botanicals?.plants ?? []) {
        const [x, , z] = plant.position;
        const radius = plant.kind === 'bloom' ? .54 : .21;
        const top = plant.kind === 'bloom' ? .3 : .6341;
        const gap = Math.hypot(Math.max(0, Math.hypot(x - cx, z - cz) - radius), Math.max(0, cy - top));
        minimumCameraClearance = Math.min(minimumCameraClearance, gap);
      }
      if (frame % 15 === 0) samples.push({ t: r.elapsedSeconds, mode: r.mode, route: r.routeId, position: r.position,
        target: r.target, fov: r.fov, labels: r.labels, community: r.community, focus: r.focus,
        confirmedGiftCount: r.confirmedGiftCount, appearance: r.appearance, fx: r.fx });
    }
    return { samples, domain: window.p08Review.trace(),
      minimumCameraClearance: Number.isFinite(minimumCameraClearance) ? minimumCameraClearance : null };
  }, end);
}

function pixels(page, a, b, regions) {
  return page.evaluate(async ({ urls, regions }) => {
    const images = await Promise.all(urls.map(async url => {
      const image = new Image(); image.src = url; await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0);
      return ctx;
    }));
    return Object.fromEntries(Object.entries(regions).map(([key, region]) => {
      const [before, after] = images.map(ctx => ctx.getImageData(...region).data);
      let changed = 0;
      for (let i = 0; i < before.length; i += 4) {
        if (Math.abs(before[i] - after[i]) + Math.abs(before[i + 1] - after[i + 1]) +
            Math.abs(before[i + 2] - after[i + 2]) > 3) changed++;
      }
      return [key, { region, changed }];
    }));
  }, { urls: [a, b].map(data => 'data:image/png;base64,' + data.toString('base64')), regions });
}

function measure(page) {
  return page.evaluate(fixed => new Promise((resolve, reject) => {
    const steps = [];
    let frame = 0, last;
    const tick = now => {
      try {
        const report = window.p08Review.step(14 + frame / 60, true, undefined, undefined, undefined, fixed);
        if (frame > 8) steps.push(now - last);
        last = now;
        if (++frame < 39) { requestAnimationFrame(tick); return; }
        const sorted = steps.toSorted((a, b) => a - b);
        const percentile = p => sorted[Math.ceil(sorted.length * p) - 1];
        const ms = steps.reduce((sum, dt) => sum + dt, 0);
        resolve({ steps, fps: 1000 * steps.length / ms, p50: percentile(.5), p95: percentile(.95), p99: percentile(.99),
          draws: report.drawCalls, triangles: report.trianglesDrawn, geometries: report.geometries, textures: report.textures,
          addedMaterials: report.botanicals?.assets.reduce((count, asset) => count + asset.materials, 0) ?? 0,
          shadowMaps: report.shadowMaps, heap: performance.memory?.usedJSHeapSize });
      } catch (error) { reject(error); }
    };
    requestAnimationFrame(tick);
  }), low);
}

async function recovery(site, profile, newBuild) {
  const run = await open(site, { profile, revision: newBuild ? current : baseline, option: 'on' });
  const { page } = run;
  const first = await draw(page, 18.3);
  const firstPng = await shot(page);
  const phases = [{ name: 'before-loss', logs: run.logs.slice() }];
  const mark = async (name, callback) => {
    const from = run.logs.length, start = performance.now();
    const result = await callback();
    phases.push({ name, start, durationMs: performance.now() - start, logs: run.logs.slice(from) });
    return result;
  };
  const lostError = await mark('during-loss', async () => {
    await page.evaluate(() => {
      const gl = document.querySelector('canvas').getContext('webgl2');
      const ext = gl.getExtension('WEBGL_lose_context');
      if (!ext) throw Error('WEBGL_lose_context unavailable');
      window.restoreContextForEvidence = () => ext.restoreContext();
      ext.loseContext();
    });
    await page.waitForFunction(() => window.viewerReport.errors.includes('webglcontextlost'));
    return page.evaluate(() => document.querySelector('canvas').getContext('webgl2').getError());
  });
  assert.equal(lostError, 0x9242);
  await mark('restore-event', async () => {
    await page.evaluate(() => window.restoreContextForEvidence());
    await page.waitForFunction(() => window.viewerReport.contextRestores === 1);
  });
  const frames = await mark('after-restore', async () => {
    const result = [];
    for (const time of [18.3, 18.38, 18.46, 18.54]) {
      const r = await draw(page, time);
      assert.equal(r.glError, 0);
      assert.deepEqual(r.errors, ['webglcontextlost']);
      for (const field of ['geometries', 'drawCalls', 'textures', 'confirmedGiftCount', 'botanicalFrustum']) {
        assert.deepEqual(r[field], first[field]);
      }
      assert.equal(r.focus.actorId, first.focus.actorId);
      result.push({ time, glError: r.glError, draws: r.drawCalls, geo: r.geometries,
        textures: r.textures, actor: r.focus.actorId, giftCount: r.confirmedGiftCount, frustum: r.botanicalFrustum });
      if (time === 18.3) assert.equal(sha(await shot(page)), sha(firstPng));
    }
    return result;
  });
  await mark('teardown', async () => { await page.goto('about:blank'); await page.close(); });
  assert.deepEqual(run.failures, []);
  return { profile, revision: first.repoRevision, lostError, restoredFrameHash: sha(firstPng), frames, phases };
}

async function rejectedAssets(site) {
  const records = {};
  for (const mode of ['missing', 'tampered']) {
    const page = await browser.newPage({ viewport });
    await page.route('**/favicon.ico', route => route.fulfill({ status: 204 }));
    await page.route('**/p012b/' + manifest.profiles.eco.bloom.file, async route => {
      if (mode === 'missing') return route.fulfill({ status: 404 });
      const source = await route.fetch(), body = await source.body();
      body[body.length - 1] ^= 1;
      return route.fulfill({ response: source, body });
    });
    await page.goto(site + '/?demo=community&inspect=1');
    await page.waitForFunction(() => window.viewerReport.errors.length);
    const record = await page.evaluate(() => ({ errors: window.viewerReport.errors, active: Boolean(window.p08Review || window.viewerReport.botanicals) }));
    assert.equal(record.active, false);
    assert.match(record.errors[0], mode === 'missing' ? /assets:p012b/ : /SHA-256/);
    records[mode] = record;
    await page.close();
  }
  return records;
}

try {
  old = await serve(prior, 4201);
  next = await serve(root, 4202);
  const matrix = [], visualDiffs = {}, timings = {}, layouts = {}, recoveries = [];
  for (const profile of profiles) {
    const base = await open(old.url, { profile, revision: baseline, option: 'off' });
    const off = await open(next.url, { profile, option: 'off' });
    const on = await open(next.url, { profile, option: 'on' });
    assert.deepEqual(base.report.communityLayout, on.report.communityLayout);
    assert.deepEqual(off.requests, []);
    const expectedFiles = Object.values(manifest.profiles[profile]).map(asset => '/p012b/' + asset.file).sort();
    assert.deepEqual(on.requests.sort(), expectedFiles);
    assert.equal(on.report.botanicals.batches, 5);
    layouts[profile] = on.report.botanicals;
    for (const [name, t, fixed] of poses) {
      const images = [];
      let reference;
      for (const [variant, run] of [['baseline', base], ['off', off], ['on', on]]) {
        const r = await draw(run.page, t, fixed);
        assert.equal(r.glError, 0);
        assert.deepEqual(r.errors, []);
        const camera = [r.position, r.target, r.fov], identity = [r.community, r.focus, r.labels, r.fx, r.confirmedGiftCount];
        if (variant === 'baseline') reference = { camera, identity };
        else assert.deepEqual({ camera, identity }, reference);
        const png = await shot(run.page);
        assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [720, 1280]);
        if (variant === 'off') { assert.equal(sha(png), sha(images[0])); continue; }
        images.push(png);
        const file = `${profile}-${name}-${variant}.png`;
        await writeFile(resolve(output, file), png);
        matrix.push({ profile, name, t, file, sha256: sha(png), revision: r.repoRevision, url: run.url,
          camera, fixed, labels: r.labels, focus: r.focus, frustum: r.botanicalFrustum ?? [], drawCalls: r.drawCalls });
      }
      const regions = { frame: [0, 0, 720, 1280] };
      if (name === 'gift') Object.assign(regions, { face: [260, 410, 192, 195], nameplate: [318, 332, 88, 58],
        giftLabel: [451, 509, 125, 45], fallback: [238, 1090, 258, 83] });
      if (name === 'under') regions.goldBark = [340, 290, 230, 555];
      const diff = await pixels(on.page, ...images, regions);
      for (const [key, record] of Object.entries(diff)) if (key !== 'frame') assert.equal(record.changed, 0, name + '/' + key);
      if (['low', 'lake', 'aerial', 'gift'].includes(name)) assert.ok(diff.frame.changed > 100, `${profile}/${name}`);
      visualDiffs[profile + '/' + name] = diff;
    }
    for (const run of [base, off, on]) await close(run);
  }
  await write('screenshots.json', { baseline, current, matrix, visualDiffs });
  console.log('Native A/B image matrix and exact disabled-image parity passed.');

  const traces = [];
  for (const seed of [9, 71]) {
    for (const demo of ['idle', 'gifts', 'capacity', 'community']) {
      const base = await open(old.url, { revision: baseline, seed, demo });
      const on = await open(next.url, { seed, demo });
      const end = demo === 'idle' ? 85 : 66;
      const expected = await trace(base, end), actual = await trace(on, end);
      assert.deepEqual(actual.domain, expected.domain);
      assert.deepEqual(actual.samples, expected.samples);
      if (demo === 'community') {
        assert.ok(actual.minimumCameraClearance > .25, String(actual.minimumCameraClearance));
        await write(`community-${seed}-trace.json`, { ...actual, plants: on.report.botanicals.plants });
      } else assert.deepEqual(on.requests, []);
      if (demo === 'gifts') {
        assert.deepEqual([...new Set(actual.samples.filter(row => row.fx.gift?.phase === 'confirmed')
          .map(row => row.fx.gift.seatId))], ['seat-1', 'seat-2', 'seat-3']);
        assert.equal(actual.samples.at(-1).confirmedGiftCount, 7);
      }
      if (demo === 'capacity') assert.ok(actual.samples.some(row => row.labels.fallback?.startsWith('Duyên')));
      traces.push({ seed, demo, end, samples: actual.samples.length, sha256: sha(JSON.stringify(actual.samples)),
        minimumCameraClearance: actual.minimumCameraClearance });
      await close(base);
      await close(on);
    }
  }
  const legacyFrames = [];
  for (const [demo, time] of [['idle', 7.5], ['gifts', 47.72], ['capacity', 48.9]]) {
    const base = await open(old.url, { revision: baseline, demo });
    const actual = await open(next.url, { demo, option: 'on' });
    const camera = demo === 'idle' ? low : undefined;
    await draw(base.page, time, camera);
    await draw(actual.page, time, camera);
    const hash = sha(await shot(base.page));
    assert.equal(sha(await shot(actual.page)), hash);
    assert.deepEqual(actual.requests, []);
    legacyFrames.push({ demo, time, hash });
    await close(base);
    await close(actual);
  }
  const isolated = await open(next.url, { option: 'on', extra: '&crowd=off' });
  assert.deepEqual(isolated.requests, []);
  await close(isolated);
  await write('legacy-regression.json', { baseline, current, traces, legacyFrames, crowdOffRequests: isolated.requests });
  await write('layouts.json', layouts);
  console.log('Two-seed camera, room, identity and gift traces passed.');

  for (const profile of profiles) {
    const base = await recovery(old.url, profile, false), after = await recovery(next.url, profile, true);
    const inherited = new Set(base.phases.at(-1).logs.map(row => row.message).filter(msg => inheritedDelete.test(msg)));
    for (const run of [base, after]) {
      run.knownTeardownWarnings = 0;
      for (const phase of run.phases) for (const log of phase.logs) {
        if (!graphicsError.test(log.message)) continue;
        assert.ok(phase.name === 'teardown' && inherited.has(log.message), phase.name + ' ' + log.message);
        run.knownTeardownWarnings++;
      }
    }
    recoveries.push(base, after);
  }
  await write('webgl-recovery.json', recoveries);
  const rejected = await rejectedAssets(next.url);
  console.log('Synthetic recovery and actual asset failure probes passed.');

  let renderer;
  for (const profile of profiles) {
    timings[profile] = {};
    for (const [variant, site, revision] of [['off', old.url, baseline], ['on', next.url, current]]) {
      const run = await open(site, { profile, revision, option: variant });
      renderer = run.report.graphics;
      const start = await draw(run.page, 14, low);
      assert.equal(start.community.realActors, 3);
      timings[profile][variant] = await measure(run.page);
      await close(run);
    }
    const { off, on } = timings[profile];
    assert.equal(on.textures, off.textures);
    assert.equal(on.shadowMaps, off.shadowMaps);
    assert.ok(on.draws <= off.draws + 5 && on.geometries <= off.geometries + 5);
  }
  await write('browser-report.json', { baseline, current, artwork: manifest.source, viewport, renderer,
    browser: browser.version(), cpu: cpus()[0]?.model, os: release(), liveStudio: false,
    sample: '30 actual rAF intervals after nine warmup calls, matched low pose, seed 9, 14s virtual time and three actors',
    timings, rejected });
  const stage = Date.now();
  const assetLog = execFileSync(process.execPath, ['scripts/stage-p012b.mjs']);
  await writeFile(resolve(output, 'botanical-assets.jsonl'), assetLog);
  await write('staging.json', { stagedFiles: 4, scriptWallMs: Date.now() - stage, source: manifest.source });
  await writeFile(resolve(output, 'legacy-assets.jsonl'), execFileSync(process.execPath, ['scripts/stage-p08.mjs']));
  console.log(`P0.12-C verified at ${current}: ${matrix.length} native 720×1280 captures, profiles and staged asset hashes.`);
} finally {
  await Promise.all([old?.server.close(), next?.server.close(), browser.close()]);
}
