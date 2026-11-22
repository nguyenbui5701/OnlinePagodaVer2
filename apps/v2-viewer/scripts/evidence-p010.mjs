import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const revision = '675675cdf4d1a6868f370e6417ac689a15c1054b';
const baselineOnly = process.argv.includes('--baseline');
const app = process.cwd();
const output = resolve(process.env.V2_EVIDENCE_DIR || 'evidence/p010');
const baselineApp = resolve(process.env.V2_P09_APP || '../../../.p09/apps/v2-viewer');
const executablePath = process.env.V2_BROWSER;
if (!executablePath) throw new Error('Set V2_BROWSER to Edge or Chromium.');
await mkdir(output, { recursive: true });

const viewport = { width: 720, height: 1280 };
const seed = 9;
let browser;
const write = (file, value) => writeFile(join(output, file), JSON.stringify(value, null, 2) + '\n');
const waterViews = [
  ['near-water', 3, { position: [5.4, 3.4, 23], target: [0.9, 3.6, 7], fov: 52 }],
  ['near-water-later', 6, { position: [5.4, 3.4, 23], target: [0.9, 3.6, 7], fov: 52 }],
  ['aerial', 20],
  ['under-tree', 31],
];
const giftViews = [
  ['observed', 46.2, 'gifts', {
    position: [-0.16453682873832176, 1.15060335816266, 8.972041251413165],
    target: [1.9971276462426466, 0.67060335816266, 13.480611612137865], fov: 50,
  }], ['confirmed-A', 47.72], ['confirmed-B', 53.65], ['confirmed-C', 59.48],
  ['return', 64.32], ['no-seat', 48.9, 'capacity'],
];

async function serverAt(root, port, use) {
  process.chdir(root);
  const server = await createServer({ root, server: { host: '127.0.0.1', port, strictPort: true }, logLevel: 'error' });
  try {
    await server.listen();
    return await use(`http://127.0.0.1:${port}`);
  } finally {
    await server.close();
    process.chdir(app);
  }
}

async function inspect(page, base, profile, demo = 'idle', fx = 'on') {
  await page.goto(`${base}/?seed=${seed}&clean=1&inspect=1&profile=${profile}&demo=${demo}&fx=${fx}`);
  await page.waitForFunction(() => window.p08Review || window.viewerReport?.errors.length, undefined, { timeout: 30000 });
  const report = await page.evaluate(() => window.viewerReport);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.viewport, [720, 1280]);
  return report;
}

async function advance(page, time, fixed) {
  return page.evaluate(({ time, fixed }) => {
    const current = window.viewerReport.elapsedSeconds ?? 0;
    for (let frame = Math.floor(current * 60) + 1; frame / 60 < time; frame++) {
      window.p08Review.step(frame / 60, false);
    }
    return window.p08Review.step(time, true, undefined, undefined, undefined, fixed);
  }, { time, fixed });
}

async function timedFrames(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const durations = [];
    let previous;
    let frame = 0;
    const tick = time => {
      try {
        const report = window.p08Review.step(7 + frame / 15);
        if (previous !== undefined && frame > 15) durations.push(time - previous);
        previous = time;
        if (++frame < 106) requestAnimationFrame(tick);
        else {
          const sorted = durations.toSorted((a, b) => a - b);
          const percentile = p => sorted[Math.ceil(sorted.length * p) - 1];
          resolve({
            samples: durations.length, virtualStart: 7, virtualEnd: 14, wallSeconds: durations.reduce((a, b) => a + b, 0) / 1000,
            fps: 1000 * durations.length / durations.reduce((a, b) => a + b, 0),
            p50ms: percentile(0.50), p95ms: percentile(0.95), p99ms: percentile(0.99),
            drawCalls: report.drawCalls, triangles: report.trianglesDrawn, textures: report.textures, points: report.pointsDrawn ?? 0,
            geometries: report.geometries, heapBytes: performance.memory?.usedJSHeapSize,
            fx: report.fx, errors: report.errors,
          });
        }
      } catch (error) { reject(error); }
    };
    requestAnimationFrame(tick);
  }));
}

async function sample(base, label) {
  const page = await browser.newPage({ viewport });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  const snapshots = {};
  const metrics = {};
  const capture = async (key, profile, time, fixed, demo, fx) => {
    const initial = await inspect(page, base, profile, demo, fx);
    if (label === 'before') assert.equal(initial.repoRevision, revision);
    const report = await advance(page, time, fixed);
    assert.deepEqual(report.errors, []);
    await page.locator('#stage').screenshot({ path: join(output, `${label}-${key}.png`), animations: 'disabled' });
    snapshots[key] = {
      time, seed, profile, shot: report.shot, routeId: report.routeId, mode: report.mode,
      position: report.position, target: report.target, fov: report.fov, focus: report.focus, labels: report.labels,
      count: report.confirmedGiftCount, fx: report.fx, measuredDraws: report.drawCalls,
      measuredPoints: report.pointsDrawn ?? 0, textures: report.textures, geometries: report.geometries,
    };
    return initial;
  };
  try {
    for (const [name, time, fixed] of waterViews) {
      await capture(name, 'eco', time, fixed, 'idle', name.startsWith('near-water') ? 'off' : 'on');
    }
    for (const [name, time, demo, fixed] of giftViews) await capture(name, 'eco', time, fixed, demo ?? 'gifts');
    if (label === 'after') {
      await capture('ambient-eco', 'eco', 5.8, { position: [6, 2.8, 17], target: [0, 7, 0], fov: 55 });
      await capture('ambient-quality-low', 'quality', 8.5, { position: [6, 2.8, 17], target: [0, 7, 0], fov: 55 });
      await capture('ambient-quality-drift', 'quality', 28.5, { position: [9, 6, 17], target: [0, 11.5, 0], fov: 57 });
      assert.equal(snapshots.observed.fx.gift?.phase, 'observed');
      assert.equal(snapshots.observed.fx.ripple, undefined);
      assert.equal(snapshots.observed.count, 0);
      for (const [index, letter] of ['A', 'B', 'C'].entries()) {
        const s = snapshots['confirmed-' + letter];
        assert.equal(s.fx.gift.phase, 'confirmed');
        assert.equal(s.fx.gift.seatId, `seat-${index + 1}`);
        assert.equal(s.fx.gift.actorId, s.focus.actorId);
        assert.equal(s.fx.waterAnchor[1], 0);
        assert.ok(s.fx.ripple.opacity > 0);
      }
      assert.equal(snapshots['return'].fx.gift, undefined);
      assert.match(snapshots['no-seat'].labels.fallback, /^Duyên/);
      assert.ok(!snapshots['no-seat'].fx.gift || snapshots['no-seat'].fx.gift.seatId === 'seat-1');
      const diff = await waterPixels(page);
      assert.ok(diff.changed > 1000 && diff.meanChannelDelta > 0.25, JSON.stringify(diff));
      snapshots['water-only-pixel-delta'] = diff;
    }
    let runtime;
    for (const profile of ['eco', 'quality']) {
      runtime = await inspect(page, base, profile);
      metrics[profile] = await timedFrames(page);
      assert.deepEqual(metrics[profile].errors, []);
    }
    const result = { label, seed, viewport, source: runtime.repoRevision, graphics: runtime.graphics, browser: runtime.browser,
      os: release(), cpu: cpus()[0]?.model, liveStudio: false, metrics, snapshots, pageErrors };
    assert.deepEqual(pageErrors, []);
    return result;
  } finally { await page.close(); }
}

try {
  browser = await chromium.launch({ executablePath, args: [
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling',
  ] });
  const before = await serverAt(baselineApp, 4180, url => sample(url, 'before'));
  await write('baseline.json', before);
  if (baselineOnly) console.log(`Captured baseline ${before.source} in ${output}`);
  else {
    const after = await serverAt(app, 4181, async url => {
      const data = await sample(url, 'after');
      await regressions(url);
      return data;
    });
    for (const key of Object.keys(before.snapshots)) {
      const a = after.snapshots[key];
      const b = before.snapshots[key];
      for (const field of ['position', 'target', 'fov', 'routeId', 'mode', 'labels', 'count']) {
        assert.deepEqual(a[field], b[field], `${key} ${field}`);
      }
    }
    after.delta = Object.fromEntries(['eco', 'quality'].map(profile => [profile, Object.fromEntries(
      ['fps', 'p50ms', 'p95ms', 'p99ms', 'drawCalls', 'triangles', 'textures', 'geometries', 'points'].map(field =>
        [field, after.metrics[profile][field] - before.metrics[profile][field]]))]));
    await write('browser-report.json', after);
    await writeFile(join(output, 'asset-verification.jsonl'), execFileSync(process.execPath, ['scripts/stage-p08.mjs']));
    console.log('P0.10 matched native browser review and regressions completed.');
  }
} finally {
  await browser?.close();
}

async function waterPixels(page) {
  const sources = await Promise.all(['after-near-water.png', 'after-near-water-later.png'].map(async name =>
    'data:image/png;base64,' + (await readFile(join(output, name))).toString('base64')));
  return page.evaluate(async sources => {
    const rect = { x: 35, y: 1120, width: 650, height: 105 };
    const buffers = await Promise.all(sources.map(async src => {
      const bitmap = new Image();
      bitmap.src = src;
      await bitmap.decode();
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.canvas.width = rect.width;
      ctx.canvas.height = rect.height;
      ctx.drawImage(bitmap, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
      return ctx.getImageData(0, 0, rect.width, rect.height).data;
    }));
    let total = 0;
    let changed = 0;
    for (let i = 0; i < buffers[0].length; i += 4) {
      const delta = Math.abs(buffers[0][i] - buffers[1][i]) +
        Math.abs(buffers[0][i + 1] - buffers[1][i + 1]) + Math.abs(buffers[0][i + 2] - buffers[1][i + 2]);
      total += delta;
      if (delta > 3) changed++;
    }
    return { rect, changed, meanChannelDelta: total / (rect.width * rect.height * 3) };
  }, sources);
}

async function regressions(base) {
  const page = await browser.newPage({ viewport });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    for (const scenario of ['idle', 'gifts']) {
      await inspect(page, base, 'eco', scenario);
      const result = await page.evaluate(scenario => {
        const rows = [];
        const ends = scenario === 'idle' ? 85 : 66;
        for (let frame = 0; frame <= ends * 60; frame++) {
          const t = frame / 60;
          const r = window.p08Review.step(t, false);
          if (frame % 15 === 0 || r.fx.gift?.phase !== rows.at(-1)?.gift?.phase ||
              r.fx.gift?.requestId !== rows.at(-1)?.gift?.requestId) rows.push({
            t, mode: r.mode, routeId: r.routeId, shot: r.shot, position: r.position, fov: r.fov, focus: r.focus,
            gift: r.fx.gift, ripple: r.fx.ripple, starts: r.fx.starts, count: r.confirmedGiftCount,
          });
        }
        return { rows, trace: window.p08Review.trace(), report: window.viewerReport };
      }, scenario);
      if (scenario === 'idle') {
        assert.equal(result.report.elapsedSeconds, 85);
        assert.equal(result.report.fx.starts.confirmed, 0);
        assert.deepEqual(result.report.visited, ['CLOSE', 'COMMUNITY', 'AERIAL', 'UNDER_TREE']);
        const original = (await readFile(join(app, 'evidence/p09/cinematic-60hz.jsonl'), 'utf8')).trim().split('\n')
          .slice(1).map(line => JSON.parse(line)).filter(row => row[1] === 9);
        for (const frame of result.rows) {
          const matched = original[Math.round(frame.t * 60)];
          assert.deepEqual([frame.routeId, frame.shot, frame.position, frame.fov],
            [matched[3], matched[5], matched[6], matched[8]]);
        }
      } else {
        assert.deepEqual(result.report.fx.starts, { observed: 1, confirmed: 3 });
        assert.equal(result.report.confirmedGiftCount, 7);
        assert.equal(result.report.mode, 'CINEMATIC');
        assert.equal(result.report.fx.gift, undefined);
        assert.deepEqual([...new Set(result.rows.filter(r => r.gift?.phase === 'confirmed').map(r => r.gift.seatId))],
          ['seat-1', 'seat-2', 'seat-3']);
        assert.ok(result.rows.every(r => !r.ripple || r.gift?.phase === 'confirmed'));
      }
      await write(scenario + '-trace.json', result);
    }
    await inspect(page, base, 'eco', 'idle', 'off');
    assert.equal((await advance(page, 3)).fx.enabled, false);
    await inspect(page, base, 'eco', 'gifts');
    const preLoss = await advance(page, 47.72);
    const supported = await page.evaluate(() => {
      const extension = document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');
      if (!extension) return false;
      window.testRestore = () => extension.restoreContext();
      extension.loseContext();
      return true;
    });
    assert.equal(supported, true);
    await page.waitForFunction(() => window.viewerReport.errors.includes('webglcontextlost'));
    await page.evaluate(() => window.testRestore());
    await page.waitForFunction(() => window.viewerReport.contextRestores === 1);
    const restored = await advance(page, 47.75);
    assert.deepEqual(restored.fx.starts, preLoss.fx.starts);
    assert.equal(restored.fx.gift.requestId, preLoss.fx.gift.requestId);
    assert.equal(restored.drawCalls, preLoss.drawCalls);
    assert.deepEqual(pageErrors, []);
    await write('context-cycle.json', { before: preLoss.fx, restored: restored.fx, errors: restored.errors,
      drawCalls: restored.drawCalls, geometries: restored.geometries, textures: restored.textures,
      contextRestores: restored.contextRestores });
    await inspect(page, base, 'eco', 'gifts');
    const samples = [];
    for (const time of [47.72, 53.65, 59.48, 64.32, 66]) {
      const frame = await advance(page, time);
      samples.push({ time, drawCalls: frame.drawCalls, geometries: frame.geometries, textures: frame.textures,
        points: frame.pointsDrawn, giftCapacity: frame.fx.capacity, ledgerSize: frame.fx.ledgerSize });
    }
    assert.ok(samples.every(frame => frame.geometries === samples[0].geometries &&
      frame.textures === samples[0].textures && frame.giftCapacity === 19));
    await write('pool-samples.json', samples);

    await page.goto(`${base}/?seed=9&clean=1&demo=gifts`);
    await page.waitForFunction(() => window.viewerReport.drawCalls > 0);
    const live = await page.evaluate(() => new Promise(resolve => {
      const start = performance.now();
      const captured = [];
      const poll = () => {
        const r = window.viewerReport;
        if (captured.at(-1)?.seconds !== r.elapsedSeconds) captured.push({
          seconds: r.elapsedSeconds, mode: r.mode, routeId: r.routeId, position: r.position, labels: r.labels,
          gift: r.fx.gift, waterAnchor: r.fx.waterAnchor, starts: r.fx.starts, count: r.confirmedGiftCount,
        });
        if (r.elapsedSeconds >= 66 || performance.now() - start > 95_000) {
          resolve({ captured, frameTiming: r.frameTiming, wallSeconds: (performance.now() - start) / 1000, errors: r.errors });
        } else setTimeout(poll, 70);
      };
      poll();
    }));
    assert.ok(live.captured.at(-1).seconds >= 66);
    assert.equal(live.captured.at(-1).mode, 'CINEMATIC');
    assert.equal(live.captured.at(-1).count, 7);
    assert.equal(live.captured.at(-1).starts.confirmed, 3);
    assert.deepEqual([...new Set(live.captured.filter(row => row.gift?.phase === 'confirmed')
      .map(row => row.gift.seatId))], ['seat-1', 'seat-2', 'seat-3']);
    assert.deepEqual(live.errors, []);
    assert.deepEqual(pageErrors, []);
    await write('live-gift-trace.json', live);
  } finally { await page.close(); }
}
