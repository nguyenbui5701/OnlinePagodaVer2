import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import sakura from '../src/sakura-r16.json' with { type: 'json' };
import assets from '../src/p08-assets.json' with { type: 'json' };

const baseline = '9f15513c451eacc5f52a62c47ebd17085beea15e';
const current = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const root = process.cwd();
const oldApp = resolve(process.env.V2_P011_APP || '../../../.p011/apps/v2-viewer');
const output = resolve(process.env.V2_EVIDENCE_DIR || 'evidence/p012a');
const viewport = { width: 720, height: 1280 };
const profiles = ['eco', 'quality'];
const low = { position: [14, 6, 38], target: [0, 8, 3], fov: 51 };
const lake = { position: [5.4, 3.4, 23], target: [.9, 3.6, 7], fov: 52 };
const aerial = { position: [19, 40, 31], target: [0, 12, 0], fov: 52 };
const under = { position: [6, 2.8, 17], target: [0, 7, 0], fov: 55 };
const graphicsError = /\b(?:GL_)?(?:INVALID_[A-Z_]+|OUT_OF_MEMORY)\b|shader error|VALIDATE_STATUS false/i;
const staleDelete = /^WebGL: INVALID_OPERATION: delete(?:VertexArray)?: object does not belong to this context$/;
const sha256 = buffer => createHash('sha256').update(buffer).digest('hex');
const write = (file, value) => writeFile(resolve(output, file), JSON.stringify(value, null, 2) + '\n');
assert.ok(process.env.V2_BROWSER, 'Set V2_BROWSER to a Chromium or Edge executable');
await mkdir(output, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.V2_BROWSER, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const files = [], timings = {}, baselineShots = {};
let old, next;

async function serve(dir, port) {
  // Vite config obtains the source commit relative to the viewer being served.
  process.chdir(dir);
  const server = await createServer({ root: dir, server: { host: '127.0.0.1', port, strictPort: true, watch: null }, logLevel: 'error' });
  try { await server.listen(); return { server, url: `http://127.0.0.1:${port}` }; }
  finally { process.chdir(root); }
}

async function open(site, revision, { profile = 'eco', demo = 'community', seed = 9, params = '' } = {}) {
  const page = await browser.newPage({ viewport });
  await page.route('**/favicon.ico', route => route.fulfill({ status: 204 }));
  const issues = [], exceptions = [], httpErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') issues.push(msg.text());
  });
  page.on('pageerror', error => exceptions.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) httpErrors.push([response.status(), response.url()]);
  });
  const url = site + `/?seed=${seed}&profile=${profile}&demo=${demo}&inspect=1&clean=1${params}`;
  await page.goto(url);
  await page.waitForFunction(() => window.p08Review || window.viewerReport?.errors.length);
  const report = await page.evaluate(() => window.viewerReport);
  assert.deepEqual(report.errors, []);
  assert.equal(report.repoRevision, revision);
  assert.deepEqual(report.viewport, [720, 1280]);
  for (const [actual, expected] of [[report.asset, sakura.profiles[profile]],
    [report.pair.pad, assets.pair.pad], [report.pair.actor, assets.pair.actor]]) {
    assert.equal(actual.bytes, expected.bytes);
    assert.equal(actual.sha256, expected.sha256);
  }
  return { page, url, report, profile, issues, exceptions, httpErrors };
}

async function close(run) {
  await run.page.close();
  assert.deepEqual(run.exceptions, []);
  assert.deepEqual(run.httpErrors, []);
  assert.deepEqual(run.issues.filter(text => graphicsError.test(text)), []);
}

function render(page, time, fixed) {
  return page.evaluate(({ time, fixed }) => {
    const start = Math.floor((window.viewerReport.elapsedSeconds ?? 0) * 60) + 1;
    for (let i = start; i / 60 < time; i++) window.p08Review.step(i / 60, false);
    const report = window.p08Review.step(time, true, undefined, undefined, undefined, fixed);
    const gl = document.querySelector('canvas').getContext('webgl2');
    gl.finish();
    return { ...report, glError: gl.getError() };
  }, { time, fixed });
}

async function capture(run, filename, time, fixed) {
  const result = await render(run.page, time, fixed);
  assert.equal(result.glError, 0);
  assert.deepEqual(result.errors, []);
  const png = await run.page.locator('#stage').screenshot({ animations: 'disabled', path: resolve(output, filename + '.png') });
  const hash = sha256(png);
  files.push({ file: filename + '.png', hash, url: run.url, time, fixed, source: result.repoRevision,
    view: result.shot, labels: result.labels, occupancy: result.community, focus: result.focus,
    instancesInFrustum: result.visibleDecorativeInstances, camera: { position: result.position, target: result.target, fov: result.fov } });
  return { hash, result };
}

function trace(page, end, radius) {
  return page.evaluate(({ end, radius }) => {
    const samples = [], ledger = [];
    let previous, clearance = Infinity;
    for (let frame = 0; frame <= end * 60; frame++) {
      const report = window.p08Review.step(frame / 60, false);
      const { community, communityLayout, labels, focus, confirmedGiftCount, elapsedSeconds,
        routeId, shot, fov, position, target, mode, roomSessionId, fx } = report;
      if (position[1] < 2 && communityLayout) {
        for (const { position: [x, , z] } of communityLayout.slice(3)) {
          clearance = Math.min(clearance, Math.hypot(position[0] - x, position[2] - z) - radius);
        }
      }
      const state = { slots: community?.slots, viewerCount: community?.viewerCount,
        roomSessionId, confirmedGiftCount, mode, focus: focus?.actorId, fallback: labels.fallback };
      const signature = JSON.stringify(state);
      if (signature !== previous) {
        ledger.push({ t: elapsedSeconds, ...state });
        previous = signature;
      }
      if (frame % 15 === 0) samples.push({ t: elapsedSeconds, routeId, shot, fov, position, target, mode,
        focus, labels, confirmedGiftCount, gift: fx?.gift, starts: fx?.starts });
    }
    return { samples, ledger, domain: window.p08Review.trace(),
      clearance: Number.isFinite(clearance) ? clearance : undefined };
  }, { end, radius });
}

function measure(page, start, fixed) {
  return page.evaluate(({ start, fixed }) => new Promise((resolve, reject) => {
    const samples = [];
    let count = 0, prior;
    const tick = now => {
      try {
        const report = window.p08Review.step(start + count / 60, true, undefined, undefined, undefined, fixed);
        if (count > 8) samples.push(now - prior);
        prior = now;
        if (++count < 39) { requestAnimationFrame(tick); return; }
        const order = samples.toSorted((a, b) => a - b);
        const elapsed = samples.reduce((sum, dt) => sum + dt, 0);
        const percentile = p => order[Math.ceil(samples.length * p) - 1];
        resolve({ count: samples.length, wallSeconds: elapsed / 1000, fps: 1000 * samples.length / elapsed,
          p50: percentile(.5), p95: percentile(.95), p99: percentile(.99), samples,
          draws: report.drawCalls, triangles: report.trianglesDrawn, geometries: report.geometries,
          textures: report.textures, jsHeapBytes: performance.memory?.usedJSHeapSize, points: report.pointsDrawn,
          shadowMaps: report.shadowMaps, lights: report.lights, community: report.community,
          instancesInFrustum: report.visibleDecorativeInstances, errors: report.errors });
      } catch (error) { reject(error); }
    };
    requestAnimationFrame(tick);
  }), { start, fixed });
}

async function recovery(site, profile, oldBuild) {
  const run = await open(site, oldBuild ? baseline : current, { profile, demo: oldBuild ? 'gifts' : 'community' });
  const page = run.page;
  const t = oldBuild ? 47.72 : 18.4;
  const initial = await render(page, t, low);
  const png = () => page.locator('#stage').screenshot({ animations: 'disabled' });
  const initialHash = sha256(await png());
  const phases = [];
  async function phase(name, check) {
    const start = run.issues.length;
    const atMs = performance.now();
    const result = await check();
    phases.push({ name, atMs, durationMs: performance.now() - atMs, console: run.issues.slice(start) });
    return result;
  }
  phases.push({ name: 'before-loss', console: run.issues.slice() });
  await phase('loss', async () => {
    await page.evaluate(() => {
      const gl = document.querySelector('canvas').getContext('webgl2');
      const ext = gl.getExtension('WEBGL_lose_context');
      if (!ext) throw new Error('Cannot induce context loss');
      window.restoreTestContext = () => ext.restoreContext();
      ext.loseContext();
    });
    await page.waitForFunction(() => window.viewerReport.errors.includes('webglcontextlost'));
  });
  await phase('restore', async () => {
    await page.evaluate(() => window.restoreTestContext());
    await page.waitForFunction(() => window.viewerReport.contextRestores === 1);
  });
  const frames = await phase('post-restore-render', async () => {
    const records = [];
    for (const time of [t, t + .08, t + .16, t + .24]) {
      const r = await render(page, time, low);
      assert.equal(r.glError, 0);
      assert.deepEqual(r.errors, ['webglcontextlost']);
      assert.deepEqual([r.drawCalls, r.geometries, r.textures, r.confirmedGiftCount, r.focus.actorId,
        r.visibleDecorativeInstances, r.fx.poolId], [initial.drawCalls, initial.geometries, initial.textures,
        initial.confirmedGiftCount, initial.focus.actorId, initial.visibleDecorativeInstances, initial.fx.poolId]);
      records.push({ time, drawCalls: r.drawCalls, geometries: r.geometries, textures: r.textures,
        giftCount: r.confirmedGiftCount, actorId: r.focus.actorId, seatId: r.focus.seatId,
        occupants: r.community?.slots, error: r.glError });
      if (time === t) assert.equal(sha256(await png()), initialHash);
    }
    return records;
  });
  await phase('teardown', async () => { await page.goto('about:blank'); await page.close(); });
  assert.deepEqual(run.exceptions, []);
  assert.deepEqual(run.httpErrors, []);
  return { source: run.report.repoRevision, profile, initialHash, restores: 1, frames, phases };
}

async function failClosed(site) {
  const results = {};
  for (const mode of ['missing', 'tampered']) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/' + assets.pair.actor.file, async route => {
      if (mode === 'missing') return route.fulfill({ status: 404 });
      const source = await route.fetch();
      const buffer = await source.body();
      buffer[buffer.length - 1] ^= 1;
      return route.fulfill({ response: source, body: buffer });
    });
    await page.goto(site + '/?demo=community&inspect=1');
    await page.waitForFunction(() => window.viewerReport?.errors.length);
    const state = await page.evaluate(() => ({ errors: window.viewerReport.errors,
      hasScene: Boolean(window.p08Review || window.viewerReport.community) }));
    assert.equal(state.hasScene, false);
    assert.match(state.errors[0], mode === 'tampered' ? /SHA-256/ : /404/);
    assert.deepEqual(errors, []);
    results[mode] = state;
    await page.close();
  }
  return results;
}

async function slotMap(layouts) {
  await write('slot-layout.json', layouts);
  const page = await browser.newPage();
  const image = await page.evaluate(({ slots, tree, radius }) => {
    const canvas = document.createElement('canvas');
    canvas.width = 810;
    canvas.height = 820;
    const context = canvas.getContext('2d');
    const scale = 19, x = n => 405 + n * scale, y = n => 410 + n * scale;
    context.fillStyle = '#191626';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#fff3f7';
    context.font = '22px system-ui';
    context.fillText('Lotus community · Seed 9', 26, 40);
    context.font = '15px system-ui';
    context.fillText('+X right · +Z down · 1 grid square = 5 m', 26, 65);
    context.strokeStyle = '#403752';
    for (let n = -20; n <= 20; n += 5) {
      context.beginPath(); context.moveTo(x(n), 84); context.lineTo(x(n), 796); context.stroke();
      context.beginPath(); context.moveTo(25, y(n)); context.lineTo(785, y(n)); context.stroke();
    }
    const circle = (cx, cy, r, color) => {
      context.beginPath(); context.arc(x(cx), y(cy), r * scale, 0, Math.PI * 2);
      context.fillStyle = color; context.fill();
    };
    circle(tree[0], tree[2], 7, '#36243c');
    circle(tree[0], tree[2], .48, '#f0aeaa');
    context.fillStyle = '#fff3f7'; context.fillText('Sakura pivot', x(tree[0]) + 12, y(tree[2]) - 5);
    for (const slot of slots) {
      const [sx, , sz] = slot.position;
      circle(sx, sz, radius, slot.id.startsWith('seat-') ? '#7a803f' : '#345963');
      const heading = Math.atan2(tree[2] - sz, tree[0] - sx);
      context.beginPath(); context.moveTo(x(sx), y(sz));
      context.lineTo(x(sx) + Math.cos(heading) * 15, y(sz) + Math.sin(heading) * 15);
      context.strokeStyle = '#ffd5aa'; context.stroke();
      context.fillStyle = '#fff3f7'; context.fillText(slot.id, x(sx) + 12, y(sz) - 8);
    }
    return canvas.toDataURL('image/png').split(',')[1];
  }, layouts[9]);
  await writeFile(resolve(output, 'slot-map.png'), Buffer.from(image, 'base64'));
  await page.close();
}

try {
  old = await serve(oldApp, 4191);
  next = await serve(root, 4192);
  for (const profile of profiles) {
    // Capture the accepted P0.11 worktree before sampling the new scene.
    const run = await open(old.url, baseline, { profile, demo: 'idle' });
    baselineShots[profile] = (await capture(run, 'baseline-low-' + profile, 7.5, low)).hash;
    await close(run);
  }
  for (const [demo, time] of [['gifts', 47.72], ['capacity', 48.9]]) {
    const run = await open(old.url, baseline, { demo });
    baselineShots[demo] = (await capture(run, 'baseline-' + demo + '-eco', time)).hash;
    await close(run);
    const replay = await open(next.url, current, { demo });
    await render(replay.page, time);
    assert.equal(sha256(await replay.page.locator('#stage').screenshot({ animations: 'disabled' })), baselineShots[demo]);
    await close(replay);
  }
  const regression = [];
  for (const seed of [9, 71]) for (const demo of ['idle', 'gifts', 'capacity']) {
    const end = demo === 'idle' ? 85 : 66;
    const before = await open(old.url, baseline, { seed, demo });
    const expected = await trace(before.page, end);
    await close(before);
    const after = await open(next.url, current, { seed, demo });
    const actual = await trace(after.page, end);
    assert.deepEqual(actual, expected);
    const last = actual.samples.at(-1);
    if (demo === 'gifts') {
      assert.deepEqual(last.starts, { observed: 1, confirmed: 3 });
      assert.equal(last.confirmedGiftCount, 7);
      assert.deepEqual([...new Set(actual.samples.filter(row => row.gift?.phase === 'confirmed').map(row => row.gift.seatId))],
        ['seat-1', 'seat-2', 'seat-3']);
    }
    if (demo === 'capacity') assert.ok(actual.samples.some(row => row.labels.fallback?.startsWith('Duyên')));
    regression.push({ seed, demo, end, samples: actual.samples.length,
      signature: sha256(JSON.stringify(actual)), last, domain: actual.domain });
    await close(after);
  }
  await write('legacy-regression.json', { baseline, current, regression });
  console.log('P0.11 legacy scenario and screenshot parity passed.');

  const layouts = {};
  for (const seed of [9, 71]) {
    const run = await open(next.url, current, { seed });
    const { communityLayout: slots, treeTarget: tree, communityPadRadius: radius } = run.report;
    assert.equal(slots.length, 12);
    let minGap = Infinity, minTree = Infinity;
    for (const [i, { position: [x, , z] }] of slots.entries()) {
      minTree = Math.min(minTree, Math.hypot(x - tree[0], z - tree[2]));
      for (const { position: [px, , pz] } of slots.slice(0, i)) minGap = Math.min(minGap, Math.hypot(x - px, z - pz) - 2 * radius);
    }
    assert.ok(minGap > 0 && minTree - radius > 7);
    const result = await trace(run.page, 66, radius);
    assert.ok(result.clearance > 0.25, String(result.clearance));
    assert.ok(result.ledger.some(row => row.viewerCount === 41 && row.slots.every(slot => slot.kind === 'DECORATIVE_ANONYMOUS')));
    assert.equal(result.ledger.at(-1).viewerCount, 19);
    assert.ok(result.ledger.at(-1).slots.every(slot => slot.kind === 'DECORATIVE_ANONYMOUS'));
    await write(`community-${seed}-trace.json`, result);
    layouts[seed] = { slots, tree, radius, minGap, minTree, minLowCameraClearance: result.clearance,
      heroFits: await run.page.evaluate(() => ['seat-1', 'seat-2', 'seat-3'].map(id => window.p08Review.fit(id))) };
    for (const fit of layouts[seed].heroFits) assert.ok(fit.contactError < .00001 && Math.abs(fit.facing.afterErrorDeg) < .00001);
    await close(run);
  }
  await slotMap(layouts);

  for (const profile of profiles) {
    const legacy = await open(next.url, current, { demo: 'idle', profile });
    const idle = await render(legacy.page, 7.5, low);
    assert.equal(idle.glError, 0);
    assert.equal(sha256(await legacy.page.locator('#stage').screenshot({ animations: 'disabled' })), baselineShots[profile]);
    await close(legacy);
    const run = await open(next.url, current, { profile });
    await capture(run, 'community-low-' + profile, 7.5, low);
    const before = await capture(run, 'arrival-before-' + profile, 7.9, lake);
    const after = await capture(run, 'arrival-seated-' + profile, 8.45, lake);
    assert.equal(before.result.community.slots[0].kind, 'DECORATIVE_ANONYMOUS');
    assert.equal(after.result.community.slots[0].kind, 'REAL_OCCUPIED');
    assert.deepEqual(after.result.community.names.map(name => name.name), ['An']);
    await capture(run, 'community-aerial-' + profile, 14.5, aerial);
    const gift = await capture(run, 'gift-and-overflow-' + profile, 18.3);
    assert.equal(gift.result.focus.seatId, 'seat-1');
    assert.equal(gift.result.fx.gift.phase, 'confirmed');
    assert.equal(gift.result.fx.gift.actorId, gift.result.focus.actorId);
    assert.equal(gift.result.labels.name, 'An');
    assert.match(gift.result.labels.fallback, /^Duyên/);
    await capture(run, 'ttl-while-reserved-' + profile, 21.3, lake);
    const release = await capture(run, 'after-release-' + profile, 22.3, lake);
    assert.deepEqual(release.result.community.names, []);
    assert.equal(release.result.community.decorativeActors, 12);
    await capture(run, 'community-lake-' + profile, 26.5, lake);
    await close(run);
    const gold = await open(next.url, current, { profile, params: '&look=gold' });
    await capture(gold, 'community-under-tree-' + profile, 34.5, under);
    await close(gold);
  }
  await write('screenshots.json', files);
  console.log(`Captured ${files.length} matched WebGL screenshots.`);

  const recoveries = [];
  for (const profile of profiles) {
    const prior = await recovery(old.url, profile, true);
    const updated = await recovery(next.url, profile, false);
    const knownWarnings = new Set(prior.phases.at(-1).console.filter(text => staleDelete.test(text)));
    for (const run of [prior, updated]) {
      run.knownTeardownWarnings = 0;
      for (const { name, console } of run.phases) for (const msg of console) {
        if (!graphicsError.test(msg)) continue;
        assert.ok(name === 'teardown' && knownWarnings.has(msg), name + ' ' + msg);
        run.knownTeardownWarnings++;
      }
      recoveries.push(run);
    }
  }
  await write('webgl-recovery.json', recoveries);
  const rejectedAssets = await failClosed(next.url);
  console.log('Context recovery and missing/tampered GLB checks passed.');

  let hardware;
  for (const profile of profiles) {
    timings[profile] = {};
    for (const [name, site, source, demo, start, params] of [
      ['baselineIdle', old.url, baseline, 'idle', 7.5, ''],
      ['threeSlots', next.url, current, 'community', 14, '&crowd=off'],
      ['twelveSlots', next.url, current, 'community', 14, ''],
    ]) {
      const run = await open(site, source, { profile, demo, params: params + '&look=dusk&fx=off' });
      hardware = run.report.graphics;
      await render(run.page, start, low);
      const stats = await measure(run.page, start, low);
      assert.deepEqual(stats.errors, []);
      if (name !== 'baselineIdle') assert.equal(stats.community.realActors, 3);
      timings[profile][name] = stats;
      await close(run);
    }
    const { threeSlots, twelveSlots } = timings[profile];
    for (const field of ['geometries', 'textures', 'lights', 'shadowMaps']) assert.equal(threeSlots[field], twelveSlots[field]);
    assert.ok(twelveSlots.draws <= threeSlots.draws + 15);
  }
  await write('browser-report.json', { baseline, current, viewport, renderer: hardware, browser: browser.version(),
    cpu: cpus()[0]?.model, os: release(), node: process.version, liveStudio: false,
    sample: '30 actual rAF intervals after 9 warmup frames; matched fixed low view and dusk look; FX disabled for isolation',
    timingConsole: 'Normal graphics, HTTP and page exceptions gated', timings, rejectedAssets });
  await writeFile(resolve(output, 'asset-verification.jsonl'), execFileSync(process.execPath, ['scripts/stage-p08.mjs']));
  console.log(`P0.12-A verified at ${current}: ${files.length} native PNGs, legacy parity, occupancy, context recovery and profile timings.`);
} finally {
  await Promise.all([old?.server.close(), next?.server.close(), browser.close()]);
}
