import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { availableParallelism, cpus, totalmem } from 'node:os';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import tree from '../src/sakura-r18a.json' with { type: 'json' };

const output = resolve(process.env.V2_EVIDENCE_DIR ?? '../../packages/v2-live-gateway/evidence/p10b8');
const baseline = process.env.V2_P10B7_APP;
const benchOnly = process.argv.includes('--bench-only');
const url = 'http://127.0.0.1:5197';
const oldUrl = 'http://127.0.0.1:5198';
const viewport = { width: 720, height: 1280 };
const hash = data => createHash('sha256').update(data).digest('hex');
const fixed = (position, target, fov) => ({ position, target, fov });
const shots = [
  ['aerial', fixed([19, 43, 32], [0, 10, 0], 54)],
  ['wide', fixed([0, 10, 44], [0, 9.5, 0], 58)],
  ['under-tree', fixed([8, 3.4, 24], [0, 6.2, 1.8], 55)],
  ['branch-close', fixed([14, 11.5, 21], [3, 14, 0], 43)],
  ['low-water', fixed([10, 2.25, 30], [2, 1.15, 13], 53)],
  ['gift', undefined],
];
const variants = {
  baseline: 'tree=r17b&density=legacy',
  geometry: 'tree=r18a&r18light=off&density=legacy',
  lighting: 'tree=r18a&density=legacy',
  lush: 'tree=r18a&density=lush',
};
const shotsByProfile = {};
const measured = {};
const parity = {};
let runtimeSource;
const fallback = [];
const httpErrors = [];
await mkdir(output, { recursive: true });
const servers = [];
let browser;

async function open(profile, option, origin = url, inspect = true, look = 'gold') {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', error => httpErrors.push(error.message));
  page.on('console', msg => {
    if (/shader error|OUT_OF_MEMORY|INVALID_FRAMEBUFFER_OPERATION/i.test(msg.text())) httpErrors.push(msg.text());
  });
  page.route('**/favicon.ico', route => route.fulfill({ status: 204 }));
  const location = origin + '/?clean=1&demo=community&seed=9&presence=on&gifticons=on&blessing=on&' +
    'chatbubbles=on&seats=rings&shots=hero&ambience=rich&botanicals=on&diversity=on&' +
    'profile=' + profile + '&look=' + look + '&' + option + (inspect ? '&inspect=1' : '');
  return { page, location };
}

async function goto(run, inspect = true) {
  await run.page.goto(run.location);
  await run.page.waitForFunction(inspect
    ? () => window.p08Review || window.viewerReport?.errors.length
    : () => window.viewerReport?.drawCalls || window.viewerReport?.errors.length, null, { timeout: 30_000 });
  const report = await run.page.evaluate(() => window.viewerReport);
  assert.deepEqual(report.errors, []);
  return report;
}

async function capture(run, pose, time, filename, contextRestored = false) {
  const summary = await run.page.evaluate(({ pose, time }) => {
    const begin = Math.floor((window.viewerReport.elapsedSeconds ?? 0) * 60) + 1;
    for (let i = begin; i / 60 < time; i++) window.p08Review.step(i / 60, false);
    const r = window.p08Review.step(time, true, undefined, undefined, undefined, pose);
    const gl = document.querySelector('canvas').getContext('webgl2');
    gl.finish();
    const slotted = (r.communityLayout ?? []).reduce((count, slot) => {
      const kind = slot.id.startsWith('seat-') ? 'real' : 'decor';
      count[kind]++;
      return count;
    }, { real: 0, decor: 0 });
    return { measure: { position: r.position, target: r.target, fov: r.fov, mode: r.mode, exposure: r.appearance?.exposure },
      gold: r.goldMaterial, accent: r.r18Accent, reflection: r.appearance?.reflection, visible: r.lotusVisible,
      batches: r.lotusLayout?.batches, visibleLegacyPlants: r.botanicalFrustum?.length,
      totals: r.lotusLayout?.instances.reduce((counts, item) => {
        counts[item.kind] = (counts[item.kind] ?? 0) + 1;
        return counts;
      }, { existingPads: r.lotusLayout.existingPads }), slotted, visibleDecor: r.visibleDecorativeInstances,
      names: r.community?.names.length, focus: r.focus?.seatId,
      calls: r.drawCalls, triangles: r.trianglesDrawn, errors: r.errors, glError: gl.getError() };
  }, { pose, time });
  assert.equal(summary.glError, 0);
  assert.deepEqual(summary.errors, contextRestored ? ['webglcontextlost'] : []);
  const png = await run.page.locator('#stage').screenshot();
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [720, 1280]);
  if (filename) await writeFile(resolve(output, filename), png);
  return { ...summary, sha256: hash(png), ...(filename && { file: filename }) };
}

async function benchmark(profile, options, origin = url) {
  const run = await open(profile, options, origin, false, 'twilight');
  const asset = await goto(run, false);
  const sample = await run.page.evaluate(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const marks = [];
    const renders = [];
    let started;
    let prior;
    return new Promise(resolve => {
      function observe(now) {
        const report = window.viewerReport;
        started ??= now;
        if (prior !== undefined) marks.push(now - prior);
        prior = now;
        renders.push({ calls: report.drawCalls, triangles: report.trianglesDrawn, textures: report.textures,
          geometries: report.geometries, shaders: report.shaderPrograms });
        if (now - started < 6500) { requestAnimationFrame(observe); return; }
        const sorted = [...marks].sort((a,b) => a-b);
        const quantile = p => sorted[Math.ceil(sorted.length * p) - 1];
        const maximum = key => Math.max(...renders.map(frame => Number(frame[key] ?? 0)));
        resolve({ fps: marks.length * 1000 / (now - started), frames: marks.length, p50: quantile(.50),
          p95: quantile(.95), p99: quantile(.99), max: quantile(1), maxCalls: maximum('calls'),
          maxTriangles: maximum('triangles'), geometries: maximum('geometries'), textures: maximum('textures'),
          maxShaders: maximum('shaders'), heap: performance.memory?.usedJSHeapSize, shot: report.shot,
          errors: report.errors, end: report.elapsedSeconds });
      }
      requestAnimationFrame(observe);
    });
  });
  assert.deepEqual(sample.errors, []);
  await run.page.close();
  return { ...sample, device: asset.graphics, asset: asset.asset.assetRevision, sha256: asset.asset.sha256,
    loadMs: asset.asset.totalLoadMs, repoRevision: asset.repoRevision };
}

try {
  servers.push(await preview({ preview: { port: 5197 } }));
  if (baseline) servers.push(await preview({ root: resolve(baseline), preview: { port: 5198 } }));
  const executablePath = process.env.V2_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  browser = await chromium.launch({ executablePath, headless: process.env.V2_HEADED !== '1',
    args: process.env.V2_GPU_HIGH === '1' ? ['--force-high-performance-gpu'] : [] });
  for (const profile of ['eco', 'quality']) {
    shotsByProfile[profile] = {};
    for (const [variant, option] of benchOnly ? [] : Object.entries(variants)) {
      const run = await open(profile, option);
      const scene = await goto(run);
      runtimeSource ??= scene.repoRevision;
      assert.equal(scene.asset.assetRevision, variant === 'baseline' ? 'R17B' : 'R18A', scene.asset.fallbackReason);
      if (variant !== 'baseline') assert.equal(scene.asset.sha256, tree.profiles[profile].sha256);
      const data = { asset: scene.asset, scenes: {} };
      for (const [name, pose] of shots) {
        const retain = variant === 'lush' || name === 'under-tree' || name === 'low-water';
        data.scenes[name] = await capture(run, pose, 18.1,
          retain ? profile + '-' + variant + '-' + name + '.png' : undefined);
      }
      shotsByProfile[profile][variant] = data;
      if (profile === 'eco' && variant === 'lush') {
        await run.page.evaluate(() => {
          window.loss = document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');
          window.loss.loseContext();
        });
        await run.page.waitForFunction(() => window.viewerReport.errors.includes('webglcontextlost'));
        await run.page.evaluate(() => window.loss.restoreContext());
        await run.page.waitForFunction(() => window.viewerReport.contextRestores === 1);
        const restored = await capture(run, shots[1][1], 18.2, undefined, true);
        assert.equal(restored.glError, 0);
        data.contextRecovery = { restores: 1, glError: restored.glError, visible: restored.visible };
      }
      await run.page.close();
    }

    if (baseline && !benchOnly) {
      const old = await open(profile, variants.baseline, oldUrl);
      const oldScene = await goto(old);
      const frame = await capture(old, shots[2][1], 18.1);
      assert.equal(frame.sha256, shotsByProfile[profile].baseline.scenes['under-tree'].sha256, 'legacy render byte parity');
      parity[profile] = { source: oldScene.repoRevision, sha256: frame.sha256, identical: true };
      await old.page.close();
    }

    measured[profile] = {
      baseline: await benchmark(profile, variants.baseline, baseline ? oldUrl : url),
      lush: await benchmark(profile, variants.lush),
    };
    console.log(profile, measured[profile]);
  }

  for (const disableR17 of benchOnly ? [] : [false, true]) {
    const run = await open('eco', variants.lush);
    await run.page.route('**/r18a/*.glb', route => route.fulfill({ status: 200, body: 'wrong profile' }));
    if (disableR17) await run.page.route('**/r17b/*.glb', route => route.fulfill({ status: 404 }));
    const report = await goto(run);
    assert.equal(report.asset.assetRevision, disableR17 ? 'R16' : 'R17B');
    assert.equal(report.r18Accent, undefined);
    fallback.push({ requested: report.asset.requestedRevision, actual: report.asset.assetRevision, reason: report.asset.fallbackReason });
    await run.page.close();
  }
  assert.deepEqual(httpErrors, []);
  runtimeSource ??= measured.eco.lush.repoRevision;
  const result = {
    runtimeSource, browser: browser.version(), host: { cpu: cpus()[0]?.model, parallelism: availableParallelism(), ram: totalmem() },
    config: { highGpuRequested: process.env.V2_GPU_HIGH === '1', headed: process.env.V2_HEADED === '1', resolution: [720,1280], seed: 9, fps: 'native rAF over 6.5s, scene animation warmup 1s',
      drawCounts: 'renderer.info frame counters, Three.js main render (shadow pass not separately instrumented)',
      visibleCounts: 'static frustum acceptance before depth occlusion' },
    fallback, parity, measured, shotsByProfile,
  };
  await writeFile(resolve(output, benchOnly ? 'benchmark.json' : 'world.json'), JSON.stringify(result, null, 2) + '\n');
} finally {
  await browser?.close();
  await Promise.all(servers.map(server => server.close()));
}
