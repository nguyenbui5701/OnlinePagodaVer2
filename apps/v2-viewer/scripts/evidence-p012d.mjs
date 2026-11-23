import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import manifest from '../src/p012d-actors.json' with { type: 'json' };

const baseline = '5aadf1e603aa0c82369aa1abc60c807c6ce1748c';
const current = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const root = process.cwd();
const prior = resolve(process.env.V2_P012C_APP || '../../../.p012c/apps/v2-viewer');
const output = resolve(process.env.V2_EVIDENCE_DIR || 'evidence/p012d');
const viewport = { width: 720, height: 1280 };
const profiles = ['eco', 'quality'];
const low = { position: [14, 6, 38], target: [0, 8, 3], fov: 51 };
const poses = [
  ['low', 7.5, low],
  ['before-arrival', 7.95, { position: [5.4, 3.4, 23], target: [.9, 3.6, 7], fov: 52 }],
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
  page.on('request', request => { if (/\/p012d\/.*\.glb$/.test(request.url())) requests.push(new URL(request.url()).pathname); });
  await page.route('**/favicon.ico', route => route.fulfill({ status: 204 }));
  const url = site + `/?inspect=1&clean=1&demo=${demo}&seed=${seed}&profile=${profile}` +
    (option ? `&diversity=${option}` : '') + extra;
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
    const samples = [];
    for (let frame = 0; frame <= end * 60; frame++) {
      const r = window.p08Review.step(frame / 60, false);
      if (frame % 15 === 0) samples.push({ t: r.elapsedSeconds, mode: r.mode, route: r.routeId, position: r.position,
        target: r.target, fov: r.fov, labels: r.labels, community: r.community, focus: r.focus,
        confirmedGiftCount: r.confirmedGiftCount, appearance: r.appearance, fx: r.fx });
    }
    return { samples, domain: window.p08Review.trace() };
  }, end).then(trace => ({
    ...trace,
    samples: trace.samples.map(row => ({ ...row, community: communityIdentity(row.community), fx: giftState(row.fx) })),
  }));
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
          materials: report.seatMaterialCount, batches: report.diversity?.batches ?? 15,
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
      assert.deepEqual([r.fx.poolId, r.fx.materialId], [first.fx.poolId, first.fx.materialId]);
      assert.deepEqual(r.diversity, first.diversity);
      assert.deepEqual(r.community, first.community);
      result.push({ time, glError: r.glError, draws: r.drawCalls, geo: r.geometries,
        textures: r.textures, actor: r.focus.actorId, giftCount: r.confirmedGiftCount, seatLook: r.diversity?.looks[0] });
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
  for (const mode of ['missing', 'tampered', 'off-without-female']) {
    const page = await browser.newPage({ viewport });
    await page.route('**/favicon.ico', route => route.fulfill({ status: 204 }));
    await page.route('**/p012d/' + manifest.female.file, async route => {
      if (mode !== 'tampered') return route.fulfill({ status: 404 });
      const source = await route.fetch(), body = await source.body();
      body[body.length - 1] ^= 1;
      return route.fulfill({ response: source, body });
    });
    await page.goto(site + '/?demo=community&inspect=1&diversity=' + (mode === 'off-without-female' ? 'off' : 'on'));
    await page.waitForFunction(() => window.viewerReport.errors.length || window.p08Review);
    const record = await page.evaluate(() => ({ errors: window.viewerReport.errors, active: Boolean(window.p08Review) }));
    if (mode === 'off-without-female') {
      assert.equal(record.active, true);
      assert.deepEqual(record.errors, []);
    } else {
      assert.equal(record.active, false);
      assert.match(record.errors[0], mode === 'missing' ? /assets:p012d/ : /SHA-256/);
    }
    records[mode] = record;
    await page.close();
  }
  return records;
}

const images = [];
async function capture(run, file, r, extra = {}) {
  assert.equal(r.glError, 0);
  assert.deepEqual(r.errors, []);
  const png = await shot(run.page);
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [720, 1280]);
  await writeFile(resolve(output, file), png);
  images.push({ file, sha256: sha(png), revision: r.repoRevision, url: run.url, profile: r.profile, seed: r.seed,
    time: r.elapsedSeconds, position: r.position, target: r.target, fov: r.fov, labels: r.labels, focus: r.focus, ...extra });
  return png;
}

try {
  old = await serve(prior, 4211);
  next = await serve(root, 4212);
  const layouts = [], contacts = [], parity = [], timings = {}, recoveries = [], handoffs = [];
  const expectedFemale = '/p012d/' + manifest.female.file;
  for (const profile of profiles) {
    const base = await open(old.url, { profile, revision: baseline });
    const off = await open(next.url, { profile, option: 'off' });
    const on = await open(next.url, { profile, option: 'on' });
    assert.deepEqual(off.requests, []);
    assert.deepEqual(on.requests, [expectedFemale]);
    assert.equal(on.report.diversity.female.sha256, manifest.female.sha256);
    assert.equal(on.report.diversity.female.bytes, manifest.female.bytes);
    assert.equal(on.report.diversity.female.triangles, 17752);
    assert.deepEqual(on.report.communityLayout, base.report.communityLayout);
    assert.ok(on.report.diversity.batches <= (profile === 'eco' ? 33 : 39));
    const arrivals = [];
    for (const [name, t, fixed] of poses) {
      const reference = await draw(base.page, t, fixed);
      const a = await capture(base, `${profile}-${name}-baseline.png`, reference);
      const inactive = await draw(off.page, t, fixed);
      assert.equal(inactive.glError, 0);
      assert.equal(sha(await shot(off.page)), sha(a), profile + '/' + name + ' off image parity');
      const active = await draw(on.page, t, fixed);
      assert.deepEqual(communityIdentity(active.community), communityIdentity(reference.community));
      assert.deepEqual(giftState(active.fx), giftState(reference.fx));
      for (const key of ['position', 'target', 'fov', 'focus', 'labels',
        'confirmedGiftCount', 'appearance', 'botanicals']) assert.deepEqual(active[key], reference[key], name + '/' + key);
      const seat = active.diversity.looks[0];
      const b = await capture(on, `${profile}-${name}-on.png`, active, { seat });
      if (name === 'low' || name === 'lake' || name === 'gift') assert.notEqual(sha(a), sha(b));
      parity.push({ profile, name, t, exactOffHash: sha(a) });
      if (['before-arrival', 'arrival'].includes(name)) {
        arrivals.push({ t, seat: active.community.slots[0], names: active.community.names, look: seat,
          fit: await on.page.evaluate(() => window.p08Review.fit('seat-1')) });
      }
      if (name === 'gift') {
        assert.equal(seat.model, 'femaleP05f');
        assert.equal(active.focus.seatId, 'seat-1');
        assert.equal(active.labels.name, 'An');
        assert.ok(active.labels.fx);
        assert.match(active.labels.fallback, /^Duyên/);
        assert.deepEqual(active.fx.gift.actorId, active.focus.actorId);
        const framing = await on.page.evaluate(() => window.p08Review.frame('seat-1'));
        assert.ok(framing.edge <= .84 && !framing.treeOccludes, JSON.stringify(framing));
      }
    }
    const [beforeJoin, joined] = arrivals;
    assert.equal(beforeJoin.seat.kind, 'DECORATIVE_ANONYMOUS');
    assert.equal(joined.seat.kind, 'REAL_OCCUPIED');
    assert.deepEqual(joined.look, beforeJoin.look);
    assert.deepEqual(joined.fit.padMatrix, beforeJoin.fit.padMatrix);
    assert.equal(joined.names[0].name, 'An');
    handoffs.push({ profile, arrivals });
    for (const run of [base, off, on]) await close(run);

    const review = await open(next.url, { profile, option: 'on' });
    for (const [sequence, angle] of [['side', 1.38], ['three-quarter', .55]]) {
      for (const phase of [0, .5, 1, 1.5, 2]) {
        const time = (sequence === 'side' ? 0 : 2) + phase;
        const r = await draw(review.page, time, undefined, angle, phase, 'seat-1');
        const proof = await review.page.evaluate(() => ({
          fit: window.p08Review.fit('seat-1'), contact: window.p08Review.contact('seat-1'),
        }));
        assert.ok(proof.fit.contactError < 1e-6 && Math.abs(proof.fit.facing.afterErrorDeg) < 1e-6);
        assert.equal(proof.contact.sampled, 799);
        assert.equal(proof.contact.matched, 798);
        assert.equal(proof.contact.penetrationsOver5mm, 0);
        assert.ok(proof.contact.minGap >= -.002 && proof.contact.minGap <= .004);
        const file = `${profile}-female-${sequence}-${phase}.png`;
        const row = { profile, phase, file, sequence, ...proof };
        contacts.push(row);
        await capture(review, file, r, { idlePhase: phase, angle, contact: proof.contact });
      }
    }
    const anchors = contacts.filter(row => row.profile === profile && row.sequence === 'side').map(row => row.fit);
    assert.ok(Math.max(...anchors.map(fit => fit.headWorld[1])) - anchors[0].headWorld[1] > .012);
    assert.deepEqual(anchors[0].headWorld, anchors[4].headWorld);
    assert.ok(anchors.every(fit => Math.abs((fit.nameWorld[1] - fit.headWorld[1]) - .5) < 1e-6));
    await close(review);
  }
  await write('seat-contact.json', contacts);
  await write('handoff.json', handoffs);
  console.log('Matched images, pinned off parity, female focus and five idle phases passed.');

  const traces = [];
  for (const seed of [9, 71]) {
    for (const demo of ['idle', 'gifts', 'capacity', 'community']) {
      const base = await open(old.url, { revision: baseline, seed, demo });
      const on = await open(next.url, { seed, demo, option: 'on' });
      const end = demo === 'idle' ? 85 : 66;
      const expected = await trace(base, end), actual = await trace(on, end);
      assert.deepEqual(actual, expected);
      if (demo === 'community') {
        assert.deepEqual(on.requests, [expectedFemale]);
        await write(`community-${seed}-trace.json`, actual);
      } else assert.deepEqual(on.requests, []);
      if (demo === 'gifts') {
        assert.deepEqual([...new Set(actual.samples.filter(row => row.fx.gift?.phase === 'confirmed')
          .map(row => row.fx.gift.seatId))], ['seat-1', 'seat-2', 'seat-3']);
        assert.equal(actual.samples.at(-1).confirmedGiftCount, 7);
      }
      if (demo === 'capacity') assert.ok(actual.samples.some(row => row.labels.fallback?.startsWith('Duyên')));
      traces.push({ seed, demo, end, samples: actual.samples.length, sha256: sha(JSON.stringify(actual)) });
      await close(base);
      await close(on);
    }
    for (const profile of profiles) {
      const run = await open(next.url, { seed, profile, option: 'on' });
      const value = run.report.diversity;
      assert.equal(value.looks.length, 12);
      assert.equal(value.looks.filter(look => look.model === 'femaleP05f').length, 6);
      assert.equal(new Set(value.looks.map(look => look.variant)).size, profile === 'eco' ? 3 : 6);
      assert.ok(value.looks.every(look => look.materials.length === 2 &&
        look.materials.every(material => material.name.endsWith('__' + look.variant))));
      layouts.push({ seed, profile, ...value });
      await close(run);
    }
  }
  const disabled = await open(next.url, { option: 'on', extra: '&crowd=off' });
  assert.deepEqual(disabled.requests, []);
  await close(disabled);
  const defaultRun = await open(next.url);
  assert.deepEqual(defaultRun.requests, []);
  await close(defaultRun);
  for (const [name, t, seat] of [['A', 47.72, 'seat-1'], ['B', 53.65, 'seat-2'], ['C', 59.48, 'seat-3']]) {
    const target = await open(next.url, { demo: 'gifts', profile: 'eco', option: 'on' });
    const original = await open(old.url, { demo: 'gifts', profile: 'eco', revision: baseline });
    const r = await draw(target.page, t);
    await draw(original.page, t);
    const png = await capture(target, `eco-original-gift-${name}.png`, r);
    assert.equal(sha(png), sha(await shot(original.page)));
    assert.equal(r.focus.seatId, seat);
    assert.deepEqual(target.requests, []);
    await close(target);
    await close(original);
  }
  await write('legacy-regression.json', { baseline, current, parity, traces, defaultFemaleRequests: defaultRun.requests });
  await write('slot-looks.json', layouts);
  await write('screenshots.json', images);
  console.log('Two-seed layouts and legacy/camera/identity/gift parity passed.');

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
  console.log('Context restoration and missing/tampered-female probes passed.');

  let renderer;
  for (const profile of profiles) {
    timings[profile] = {};
    for (const variant of ['off', 'on']) {
      const run = await open(next.url, { profile, option: variant });
      renderer = run.report.graphics;
      const start = await draw(run.page, 14, low);
      assert.equal(start.community.realActors, 3);
      timings[profile][variant] = await measure(run.page);
      await close(run);
    }
    const { off, on } = timings[profile];
    assert.equal(on.textures, off.textures);
    assert.equal(on.shadowMaps, off.shadowMaps);
    assert.ok(on.draws <= off.draws + 24);
  }
  await write('browser-report.json', { baseline, current, art: manifest.source, viewport, renderer,
    browser: browser.version(), cpu: cpus()[0]?.model, os: release(), liveStudio: false,
    sample: '30 actual rAF intervals after nine warmup calls, matched low pose at virtual 14s, seed 9 with three real actors',
    timings, rejected });
  await writeFile(resolve(output, 'female-asset.jsonl'), execFileSync(process.execPath, ['scripts/stage-p012d.mjs']));
  await writeFile(resolve(output, 'legacy-assets.jsonl'), execFileSync(process.execPath, ['scripts/stage-p08.mjs']));
  await writeFile(resolve(output, 'botanical-assets.jsonl'), execFileSync(process.execPath, ['scripts/stage-p012b.mjs']));
  console.log(`P0.12-D verified at ${current} with ${images.length} native 720×1280 screenshots and both timing profiles.`);
} finally {
  await Promise.all([old?.server.close(), next?.server.close(), browser.close()]);
}
