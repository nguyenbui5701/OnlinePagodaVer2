import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const baseline = '385816518987b2a0ea6ef094bb0f65bfb363e720';
const current = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const root = process.cwd();
const prior = resolve(process.env.V2_P012D_APP || '../../../.p012d/apps/v2-viewer');
const output = resolve(process.env.V2_EVIDENCE_DIR || 'evidence/p013a');
const viewport = { width: 720, height: 1280 };
const profiles = ['eco', 'quality'];
const shots = [
  ['observed', 'capacity', 46.23],
  ['warm', 'capacity', 47.17],
  ['ascent', 'capacity', 47.60],
  ['toward-tree', 'capacity', 48.10],
  ['fade', 'capacity', 48.55],
  ['gift-b', 'capacity', 53.65],
  ['gift-c', 'capacity', 59.48],
  ['cinematic-return', 'capacity', 64.85],
  ['female-and-overflow', 'community', 18.10],
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
  const logs = [], failures = [];
  page.on('console', msg => {
    if (['warning', 'error'].includes(msg.type()) || /WebGLRenderer: Context (Lost|Restored)/.test(msg.text())) {
      logs.push({ atMs: performance.now(), type: msg.type(), message: msg.text() });
    }
  });
  page.on('pageerror', error => failures.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failures.push(response.url() + ' ' + response.status()); });
  await page.route('**/favicon.ico', route => route.fulfill({ status: 204 }));
  const url = site + `/?inspect=1&clean=1&demo=${demo}&seed=${seed}&profile=${profile}` +
    (option ? `&blessing=${option}` : '') + '&diversity=on&botanicals=on' + extra;
  await page.goto(url);
  await page.waitForFunction(() => window.p08Review || window.viewerReport?.errors.length);
  // Keep DOM overlay animation at its authored initial glow while advancing WebGL virtual time.
  await page.addStyleTag({ content: '#gift-fx { animation: none !important; }' });
  const report = await page.evaluate(() => window.viewerReport);
  assert.equal(report.repoRevision, revision);
  assert.deepEqual(report.viewport, [720, 1280]);
  assert.deepEqual(report.errors, []);
  return { page, url, report, logs, failures };
}

async function close(run) {
  await run.page.close();
  assert.deepEqual(run.failures, []);
  assert.deepEqual(run.logs.filter(row => graphicsError.test(row.message)), []);
}

function draw(page, time, fixed, angle, idle, seat) {
  return page.evaluate(({ time, fixed, angle, idle, seat }) => {
    const from = Math.floor((window.viewerReport.elapsedSeconds ?? 0) * 60) + 1;
    for (let i = from; i / 60 < time; i++) window.p08Review.step(i / 60, false);
    const report = window.p08Review.step(time, true, angle, idle, seat, fixed);
    const gl = document.querySelector('canvas').getContext('webgl2');
    gl.finish();
    return { ...report, glError: gl.getError() };
  }, { time, fixed, angle, idle, seat });
}

function shot(page) {
  return page.locator('#stage').screenshot({ animations: 'disabled' });
}

function communityIdentity(value) {
  if (!value) return value;
  const { batches, ...identity } = value;
  return identity;
}

function giftState(value) {
  if (!value) return value;
  const { poolId, materialId, ...state } = value;
  return state;
}

function trace(run, end) {
  return run.page.evaluate(end => {
    const samples = [], confirmed = new Map();
    for (let frame = 0; frame <= end * 60; frame++) {
      const r = window.p08Review.step(frame / 60, false);
      const blessing = r.blessing;
      if (blessing?.active) confirmed.set(blessing.cue.requestId, blessing.cue);
      if (frame % 15 === 0) samples.push({ t: r.elapsedSeconds, mode: r.mode, route: r.routeId, position: r.position,
        target: r.target, fov: r.fov, labels: r.labels, community: r.community, focus: r.focus,
        confirmedGiftCount: r.confirmedGiftCount, appearance: r.appearance, fx: r.fx });
    }
    return { samples, domain: window.p08Review.trace(), confirmed: [...confirmed.values()] };
  }, end).then(trace => ({
    ...trace,
    samples: trace.samples.map(row => ({ ...row, community: communityIdentity(row.community), fx: giftState(row.fx) })),
  }));
}

function measure(page, pose) {
  return page.evaluate(fixed => new Promise((resolve, reject) => {
    const steps = [];
    let frame = 0, last;
    const tick = now => {
      try {
        const report = window.p08Review.step(17.82 + frame / 60, true, undefined, undefined, undefined, fixed);
        if (frame > 8) steps.push(now - last);
        last = now;
        if (++frame < 39) { requestAnimationFrame(tick); return; }
        const sorted = steps.toSorted((a, b) => a - b);
        const percentile = p => sorted[Math.ceil(sorted.length * p) - 1];
        const ms = steps.reduce((sum, dt) => sum + dt, 0);
        resolve({ steps, fps: 1000 * steps.length / ms, p50: percentile(.5), p95: percentile(.95), p99: percentile(.99),
          draws: report.drawCalls, triangles: report.trianglesDrawn, geometries: report.geometries, textures: report.textures,
          materials: report.blessing ? 1 : 0, bufferBytes: report.blessing?.bufferBytes ?? 0,
          programs: report.shaderPrograms, points: report.pointsDrawn,
          shadowMaps: report.shadowMaps, heap: performance.memory?.usedJSHeapSize });
      } catch (error) { reject(error); }
    };
    requestAnimationFrame(tick);
  }), pose);
}

async function recovery(site, profile, newBuild) {
  const run = await open(site, { profile, revision: newBuild ? current : baseline, option: 'on' });
  const { page } = run;
  const first = await draw(page, 18.10);
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
    for (const time of [18.10, 18.18, 18.26, 18.34]) {
      const r = await draw(page, time);
      assert.equal(r.glError, 0);
      assert.deepEqual(r.errors, ['webglcontextlost']);
      for (const field of ['geometries', 'drawCalls', 'textures', 'confirmedGiftCount', 'botanicalFrustum']) {
        assert.deepEqual(r[field], first[field]);
      }
      assert.equal(r.focus.actorId, first.focus.actorId);
      assert.deepEqual([r.fx.poolId, r.fx.materialId], [first.fx.poolId, first.fx.materialId]);
      assert.deepEqual(r.diversity, first.diversity);
      assert.equal(r.blessing?.poolId, first.blessing?.poolId);
      assert.equal(r.blessing?.cue?.requestId, first.blessing?.cue?.requestId);
      assert.deepEqual(r.community, first.community);
      result.push({ time, glError: r.glError, draws: r.drawCalls, geo: r.geometries,
        textures: r.textures, actor: r.focus.actorId, giftCount: r.confirmedGiftCount, seatLook: r.diversity?.looks[0], blessing: r.blessing });
      if (time === 18.10) assert.equal(sha(await shot(page)), sha(firstPng));
    }
    return result;
  });
  await mark('teardown', async () => { await page.goto('about:blank'); await page.close(); });
  assert.deepEqual(run.failures, []);
  return { profile, revision: first.repoRevision, lostError, restoredFrameHash: sha(firstPng), frames, phases };
}

function pixelDiff(page, before, after, regions) {
  return page.evaluate(async ({ sources, regions }) => {
    const contexts = await Promise.all(sources.map(async src => {
      const image = new Image();
      image.src = src;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      return context;
    }));
    return Object.fromEntries(Object.entries(regions).map(([name, region]) => {
      const [a, b] = contexts.map(context => context.getImageData(...region).data);
      let changed = 0;
      for (let i = 0; i < a.length; i += 4) {
        if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 3) changed++;
      }
      return [name, { region, changed }];
    }));
  }, { sources: [before, after].map(data => 'data:image/png;base64,' + data.toString('base64')), regions });
}

const stills = [], sequence = [];
async function capture(run, file, r, index, extra = {}, png) {
  assert.equal(r.glError, 0);
  assert.deepEqual(r.errors, []);
  png ??= await shot(run.page);
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [720, 1280]);
  await writeFile(resolve(output, file), png);
  index.push({ file, sha256: sha(png), revision: r.repoRevision, url: run.url, profile: r.profile, seed: r.seed,
    time: r.elapsedSeconds, position: r.position, target: r.target, fov: r.fov, mode: r.mode,
    labels: r.labels, focus: r.focus, gift: r.fx.gift, blessing: r.blessing, ...extra });
  return png;
}

try {
  old = await serve(prior, 4221);
  next = await serve(root, 4222);
  const parity = [], timings = {}, recoveries = [];
  for (const profile of profiles) {
    for (const demo of ['capacity', 'community']) {
      const base = await open(old.url, { profile, revision: baseline, demo });
      const off = await open(next.url, { profile, option: 'off', demo });
      const on = await open(next.url, { profile, option: 'on', demo });
      for (const [name, , time] of shots.filter(shot => shot[1] === demo)) {
        const reference = await draw(base.page, time);
        const inactive = await draw(off.page, time);
        assert.equal(inactive.glError, 0);
        assert.equal(inactive.blessing, undefined);
        let a = await shot(base.page), offPng = await shot(off.page);
        for (let attempt = 0; sha(offPng) !== sha(a) && attempt < 2; attempt++) {
          await draw(base.page, time);
          await draw(off.page, time);
          a = await shot(base.page);
          offPng = await shot(off.page);
        }
        assert.equal(sha(offPng), sha(a), profile + '/' + name + ' OFF parity');
        await capture(base, `${profile}-${name}-baseline.png`, reference, stills, {}, a);
        const active = await draw(on.page, time);
        for (const key of ['position', 'target', 'fov', 'focus', 'labels', 'confirmedGiftCount', 'appearance',
          'community', 'botanicals', 'diversity']) assert.deepEqual(active[key], reference[key], name + '/' + key);
        assert.deepEqual(giftState(active.fx), giftState(reference.fx));
        const isActive = !['observed', 'cinematic-return'].includes(name);
        assert.equal(active.blessing.active, isActive, name + ' activity');
        if (isActive) {
          assert.equal(active.blessing.cue.actorId, active.focus.actorId);
          assert.equal(active.blessing.cue.seatId, active.focus.seatId);
          assert.deepEqual(active.blessing.fxAnchor, active.focus.fxWorld);
          assert.deepEqual(active.blessing.treeWorld, active.treeTarget);
          assert.equal(active.drawCalls, reference.drawCalls + 1);
        }
        if (name === 'observed') assert.equal(active.fx.gift.phase, 'observed');
        if (name === 'female-and-overflow') {
          assert.equal(active.diversity.looks[0].model, 'femaleP05f');
          assert.equal(active.labels.name, 'An');
          assert.equal(active.labels.fx, '2 hoa hồng');
          assert.match(active.labels.fallback, /^Duyên/);
        }
        const b = await capture(on, `${profile}-${name}-on.png`, active, stills);
        const regions = { frame: [0, 0, 720, 1280] };
        if (name === 'female-and-overflow') Object.assign(regions, {
          name: [316, 328, 92, 68], face: [266, 433, 180, 160],
          palms: [291, 582, 95, 88], gift: [451, 505, 128, 52], overflow: [236, 1090, 260, 88],
        });
        const pixels = await pixelDiff(on.page, a, b, regions);
        if (isActive) {
          assert.ok(pixels.frame.changed > 50 && pixels.frame.changed < 720 * 1280 * .12, name + ' visual envelope');
        } else assert.equal(sha(b), sha(a), name + ' provisional/return exact parity');
        for (const [key, result] of Object.entries(pixels)) if (key !== 'frame') assert.equal(result.changed, 0, key);
        parity.push({ profile, name, time, exactOffHash: sha(a), pixels });
      }
      for (const run of [base, off, on]) await close(run);
    }
  }
  await write('screenshots.json', { stills, parity });
  console.log('Native stages, exact OFF parity and face/name/label crop checks passed.');

  const frames = await open(next.url, { profile: 'quality', option: 'on' });
  for (let i = 0; i <= 34; i++) {
    const time = (17050 + i * 50) / 1000;
    const r = await draw(frames.page, time);
    await capture(frames, `sequence-${String(i).padStart(2, '0')}.png`, r, sequence, { ordinal: i });
    if (i === 20 || i === 28) assert.ok(r.blessing.plan.trail > 0);
  }
  assert.deepEqual([...new Set(sequence.map(frame => frame.blessing.plan?.stage).filter(Boolean))],
    ['warm', 'ascent', 'toward-sakura', 'fade']);
  assert.equal(sequence.at(-1).blessing.active, false);
  await close(frames);
  await write('sequence.json', { stepMs: 50, virtualStartMs: 17050, virtualEndMs: 18750, frames: sequence });
  console.log('Captured 35 native QUALITY frames at 50 ms virtual intervals.');

  const traces = [];
  for (const seed of [9, 71]) for (const demo of ['idle', 'gifts', 'capacity', 'community']) {
    const base = await open(old.url, { revision: baseline, seed, demo });
    const on = await open(next.url, { seed, demo, option: 'on' });
    const end = demo === 'idle' ? 85 : 66;
    const expected = await trace(base, end), actual = await trace(on, end);
    assert.deepEqual(actual.samples, expected.samples);
    assert.deepEqual(actual.domain, expected.domain);
    const expectedSeats = demo === 'community' ? ['seat-1'] : demo === 'idle' ? [] : ['seat-1', 'seat-2', 'seat-3'];
    assert.deepEqual(actual.confirmed.map(cue => cue.seatId), expectedSeats);
    if (demo === 'capacity' || demo === 'community') {
      assert.ok(actual.samples.some(row => row.labels.fallback?.startsWith('Duyên')));
    }
    if (demo === 'gifts') assert.equal(actual.samples.at(-1).confirmedGiftCount, 7);
    await write(`trace-${demo}-${seed}.json`, actual);
    traces.push({ demo, seed, end, samples: actual.samples.length, confirmed: actual.confirmed,
      paritySha: sha(JSON.stringify(actual.samples)) });
    await close(base);
    await close(on);
  }
  const switches = [];
  for (const [demo, extra, option, time] of [['community', '&fx=off', 'on', 18.10],
    ['idle', '', 'on', 44.5], ['community', '', undefined, 18.10]]) {
    const base = await open(old.url, { revision: baseline, demo, extra });
    const on = await open(next.url, { demo, extra, option });
    const a = await draw(base.page, time), b = await draw(on.page, time);
    assert.equal(a.glError, 0);
    assert.equal(b.glError, 0);
    assert.equal(b.blessing, undefined);
    const hash = sha(await shot(base.page));
    assert.equal(sha(await shot(on.page)), hash);
    switches.push({ demo, extra, option, time, hash });
    await close(base);
    await close(on);
  }
  await write('regression.json', { baseline, current, traces, switches });
  console.log('Two-seed 85 s idle and 66 s event traces, A/B/C, overflow and disabled switches passed.');

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
  console.log('Comparative synthetic WebGL recovery passed.');

  let renderer;
  for (const profile of profiles) {
    timings[profile] = {};
    for (const [variant, site, revision] of [['off', old.url, baseline], ['on', next.url, current]]) {
      const run = await open(site, { profile, option: variant, revision });
      renderer = run.report.graphics;
      const start = await draw(run.page, 17.82);
      assert.equal(start.fx.gift.phase, 'confirmed');
      timings[profile][variant] = await measure(run.page, { position: start.position, target: start.target, fov: start.fov });
      await close(run);
    }
    const { off, on } = timings[profile];
    assert.equal(on.textures, off.textures);
    assert.equal(on.shadowMaps, off.shadowMaps);
    assert.equal(on.draws, off.draws + 1);
    assert.equal(on.geometries, off.geometries + 1);
    assert.equal(on.triangles, off.triangles);
    assert.equal(on.points - off.points, profile === 'eco' ? 16 : 26);
  }
  await write('browser-report.json', { baseline, current, viewport, renderer, browser: browser.version(),
    cpu: cpus()[0]?.model, os: release(), liveStudio: false,
    sample: '30 actual rAF intervals after nine warmup calls, fixed female gift focus, virtual time 17.82s onward', timings });
  for (const [label, script] of [['legacy', 'stage-p08.mjs'], ['botanical', 'stage-p012b.mjs'], ['female', 'stage-p012d.mjs']]) {
    await writeFile(resolve(output, label + '-assets.jsonl'), execFileSync(process.execPath, ['scripts/' + script]));
  }
  console.log(`P0.13-A verified at ${current} with ${stills.length} native stills and ${sequence.length} native sequence frames.`);
} finally {
  await Promise.all([old?.server.close(), next?.server.close(), browser.close()]);
}
