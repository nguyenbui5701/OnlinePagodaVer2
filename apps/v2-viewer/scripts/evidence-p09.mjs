import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright-core';
import { Vector3 } from 'three';
import { createServer } from 'vite';
import pair from '../src/p08-assets.json' with { type: 'json' };
import sakura from '../src/sakura-r16.json' with { type: 'json' };

const executablePath = process.env.V2_BROWSER;
if (!executablePath) throw new Error('Set V2_BROWSER to Edge or Chromium.');
const output = resolve(process.env.V2_EVIDENCE_DIR || 'evidence/p09');
await mkdir(output, { recursive: true });
const baseline = '844361b5edd8ca1c2498ee1e708c66b634312069';
const original = JSON.parse(await readFile(new URL('../evidence/p08/runtime-report.json', import.meta.url)));
const seeds = [1, 9, 71];
const targetSeeds = {};
const viewport = { width: 720, height: 1280 };
const families = ['CLOSE', 'COMMUNITY', 'AERIAL', 'UNDER_TREE'];
const base = 'http://127.0.0.1:4179';
const server = await createServer({ server: { host: '127.0.0.1', port: 4179, strictPort: true }, logLevel: 'error' });
let browser;

const delta = (a, b) => Math.hypot(...a.map((value, i) => value - b[i]));
const vector = array => new Vector3().fromArray(array);
const metrics = rows => {
  const row = { minimumMove: Infinity, maximumMove: 0, maximumAimRad: 0, maximumFovDeltaDeg: 0,
    maximumTargetDelta: 0, lowestY: Math.min(...rows.map(frame => frame.position[1])) };
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1];
    const b = rows[i];
    const move = delta(a.position, b.position);
    row.minimumMove = Math.min(row.minimumMove, move);
    row.maximumMove = Math.max(row.maximumMove, move);
    row.maximumFovDeltaDeg = Math.max(row.maximumFovDeltaDeg, Math.abs(a.fov - b.fov));
    row.maximumTargetDelta = Math.max(row.maximumTargetDelta, delta(a.target, b.target));
    row.maximumAimRad = Math.max(row.maximumAimRad, vector(a.target).sub(vector(a.position))
      .angleTo(vector(b.target).sub(vector(b.position))));
  }
  return row;
};
const aims = rows => rows.filter((frame, index) => !index || frame.shot !== rows[index - 1].shot ||
  frame.mode !== rows[index - 1].mode || frame.routeId !== rows[index - 1].routeId ||
  frame.focus?.actorId !== rows[index - 1].focus?.actorId);
const write = (file, value) => writeFile(join(output, file), JSON.stringify(value, null, 2) + '\n');

try {
  await server.listen();
  browser = await chromium.launch({ executablePath, args: [
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling',
  ] });
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const read = () => page.evaluate(() => window.viewerReport);
  const ready = async ({ seed = 9, profile = 'eco', demo = 'idle', manual = true } = {}) => {
    await page.goto(`${base}/?clean=1&profile=${profile}&seed=${seed}&demo=${demo}${manual ? '&inspect=1' : ''}`);
    await page.waitForFunction(manual => window.viewerReport &&
      (window.viewerReport.errors.length || (manual ? window.p08Review : window.viewerReport.drawCalls)),
      manual, { timeout: 30000 });
    const report = await read();
    assert.deepEqual(report.errors, []);
    assert.equal(report.seed, seed);
    assert.deepEqual(report.rejectedRoutes, []);
    assert.deepEqual(report.viewport, [720, 1280]);
    assert.equal(report.asset.sha256, sakura.profiles[profile].sha256);
    assert.equal(report.asset.bytes, sakura.profiles[profile].bytes);
    for (const name of ['actor', 'pad']) {
      assert.equal(report.pair[name].sha256, pair.pair[name].sha256);
      assert.equal(report.pair[name].bytes, pair.pair[name].bytes);
    }
    return report;
  };
  const step = (seconds, options = {}) => page.evaluate(({ seconds, options }) =>
    window.p08Review.step(seconds, options.draw ?? true, options.angle, options.idle, options.seatId, options.fixed),
    { seconds, options });
  const shot = name => page.locator('#stage').screenshot({ path: join(output, name + '.png'), animations: 'disabled' });
  const poseRows = (seconds, count = 60) => page.evaluate(({ seconds, count }) => {
    return Array.from({ length: seconds * count + 1 }, (_, frame) => {
      const t = frame / count;
      const { shot, mode, position, target, fov, seed, routeId, direction, cycle, routeFallback, focus, labels } =
        window.p08Review.step(t, false);
      return { t, shot, mode, position, target, fov, seed, routeId, direction, cycle, routeFallback, focus, labels };
    });
  }, { seconds, count });
  const crossings = rows => page.evaluate(points => window.p08Review.treeCollisions(points), rows.map(row => row.position));
  const seats = [];
  const photos = [];
  for (const [index, angle] of [2.55, -1.32, 1.0].entries()) {
    await ready();
    const seatId = `seat-${index + 1}`;
    const expectedLayout = [[2, 0.065, 13.5, 0.14], [-1.4, 0.065, 12.35, -0.19], [4.8, 0.065, 11.15, 0.32]][index];
    const [x, y, z, yaw] = expectedLayout;
    const padMatrix = [Math.cos(yaw), 0, -Math.sin(yaw), 0, 0, 1, 0, 0,
      Math.sin(yaw), 0, Math.cos(yaw), 0, x, y, z, 1];
    const idle = [];
    for (const time of [0, 0.5, 1, 1.5, 2]) {
      await step(time, { idle: time, angle, seatId, draw: time === 1 });
      const fit = await page.evaluate(id => window.p08Review.fit(id), seatId);
      const prior = original.idle.find(frame => frame.time === time);
      assert.ok(Math.abs(fit.facing.afterErrorDeg) <= 5);
      assert.ok(Math.abs(fit.facing.beforeErrorDeg) > 170);
      assert.ok(delta(fit.padMatrix, padMatrix) < 1e-6);
      assert.ok(delta(fit.seatWorld, [x, y + 0.195, z]) < 1e-6);
      assert.ok(fit.contactError <= 1e-5);
      assert.ok(Math.abs(fit.lowestActorOffset - prior.lowestActorOffset) < 1e-6);
      assert.deepEqual(fit.breathScale, prior.breathScale);
      for (const anchor of ['headWorld', 'nameWorld', 'fxWorld']) {
        assert.ok(Math.abs(fit[anchor][1] - prior[anchor][1]) < 1e-6);
        assert.ok(Math.abs(delta(fit[anchor], fit.seatWorld) - delta(prior[anchor], prior.seatWorld)) < 1e-6);
      }
      idle.push({ time, ...fit });
      if (time === 1) {
        const label = `tree-facing-${seatId}`;
        await shot(label);
        photos.push({ file: label + '.png', time, seed: 9, seatId, angleRad: angle, profile: 'eco' });
      }
    }
    seats.push({ seatId, idle });
  }

  await ready({ profile: 'quality' });
  const quality = await step(13);
  await shot('quality-community');
  photos.push({ file: 'quality-community.png', time: 13, seed: 9, profile: 'quality', routeId: quality.routeId });
  const priorPose = original.cinematicFrames.find(frame => frame.seconds === 3);
  await ready();
  await step(3, { fixed: priorPose, idle: 1 });
  const p09Frame = await page.locator('#stage').screenshot();
  const p08Frame = await readFile(new URL('../evidence/p08/cinematic-3s.png', import.meta.url));
  const sheet = await browser.newPage({ viewport: { width: 1040, height: 950 } });
  await sheet.setContent(`<style>
    body{margin:0;background:#20172a;color:white;font:16px system-ui}main{display:flex;padding:8px;gap:8px}
    figure{margin:0}figcaption{padding:8px}img{display:block;width:506px;height:auto}
    </style><main>
    <figure><figcaption>P0.8 · WebGL ECO · 3.000 s</figcaption><img src="data:image/png;base64,${p08Frame.toString('base64')}"></figure>
    <figure><figcaption>P0.9 · WebGL ECO · matched camera pose</figcaption><img src="data:image/png;base64,${p09Frame.toString('base64')}"></figure>
    </main>`);
  await sheet.locator('main').screenshot({ path: join(output, 'baseline-facing-ab.png') });
  await sheet.close();
  const integrated = { position: [5.4, 3.4, 23], target: [0.9, 3.6, 7], fov: 52 };
  await step(3, { fixed: integrated, idle: 1 });
  const integratedFrame = await page.evaluate(() => window.p08Review.frame('seat-1'));
  assert.ok(integratedFrame.edge < 0.84 && !integratedFrame.treeOccludes, JSON.stringify(integratedFrame));
  await shot('tree-facing-integrated');
  photos.push({ file: 'tree-facing-integrated.png', time: 3, seed: 9, camera: integrated, profile: 'eco' });

  const traceLines = [JSON.stringify({ columns: ['frame', 'seed', 'cycle', 'routeId', 'direction', 'shot',
    'positionXYZ', 'targetXYZ', 'fov'], rateHz: 60, durationSeconds: 85 })];
  for (const seed of seeds) {
    const start = await ready({ seed });
    const rows = await poseRows(85);
    const reported = metrics(rows);
    assert.ok(rows.every(row => row.mode === 'CINEMATIC' && !row.routeFallback && row.seed === seed));
    assert.ok(reported.minimumMove > 0.001 && reported.maximumMove < 0.22);
    assert.ok(reported.lowestY >= 0.8 && reported.maximumAimRad < 0.025 &&
      reported.maximumFovDeltaDeg < 0.10 && reported.maximumTargetDelta < 0.30);
    const ids = [0, 1, 2].map(cycle => rows.find(row => row.cycle === cycle).routeId);
    for (const cycle of [0, 1]) {
      assert.deepEqual([...new Set(rows.filter(row => row.cycle === cycle).map(row => row.shot))], families);
    }
    assert.ok(rows[720].position[0] * rows[3120].position[0] < 0);
    const collision = await crossings(rows);
    assert.deepEqual(collision, [], `ECO tree intersections for seed ${seed}: ${collision.slice(0, 10)}`);
    targetSeeds[seed] = { ids, metrics: reported, boundaries: aims(rows), collisionCount: collision.length,
      frameCount: rows.length, revision: start.repoRevision };
    for (const [index, frame] of rows.entries()) traceLines.push(JSON.stringify([
      index, seed, frame.cycle, frame.routeId, frame.direction, frame.shot, frame.position, frame.target, frame.fov,
    ]));
  }
  assert.equal(new Set(Object.values(targetSeeds).flatMap(result => result.ids)).size, 4);
  assert.equal(new Set(Object.values(targetSeeds).map(result => result.ids.join(','))).size, 3);
  await ready({ seed: 9 });
  for (const time of [12, 20, 31, 52, 60, 71]) {
    const data = await step(time);
    const label = `cinematic-${time}s-${data.routeId}`;
    await shot(label);
    photos.push({ file: label + '.png', time, seed: data.seed, routeId: data.routeId, shot: data.shot, profile: 'eco' });
  }
  await ready({ seed: 71, profile: 'quality' });
  const qualityRows = await poseRows(85);
  assert.deepEqual(await crossings(qualityRows), []);

  await ready({ demo: 'gifts' });
  const giftRows = await poseRows(66, 60);
  const giftMetrics = metrics(giftRows.filter(frame => frame.t >= 45));
  const domain = await page.evaluate(() => window.p08Review.trace());
  const lifecycle = aims(giftRows.filter(row => row.t >= 45));
  assert.ok(giftMetrics.maximumMove < 0.50 && giftMetrics.maximumAimRad < 0.07, JSON.stringify(giftMetrics));
  assert.ok(giftRows.every(row => row.position[1] > 0.8));
  assert.deepEqual(await crossings(giftRows), []);
  assert.equal((await read()).confirmedGiftCount, 7);
  assert.equal(domain.filter(row => row.disposition === 'duplicate').length, 3);
  assert.deepEqual(domain.flatMap(row => row.effects.filter(effect => effect.type === 'focusStarted')
    .map(effect => effect.intent.actorId)), ['demo-1-actor-1', 'demo-1-actor-2', 'demo-1-actor-3']);

  await ready({ demo: 'gifts' });
  const gifts = [];
  for (const [label, time, seatId, name] of [
    ['gift-A', 48.1, 'seat-1', 'An'], ['gift-B', 54, 'seat-2', 'Bình'], ['gift-C', 59.85, 'seat-3', 'Chi'],
    ['gift-return', 64.3], ['gift-resumed', 66],
  ]) {
    const data = await page.evaluate(time => {
      const current = window.viewerReport.elapsedSeconds ?? 45;
      for (let frame = Math.round(current * 60) + 1; frame / 60 < time; frame++) {
        window.p08Review.step(frame / 60, false);
      }
      return window.p08Review.step(time);
    }, time);
    if (seatId) {
      assert.equal(data.mode, 'GIFT_FOCUS');
      assert.equal(data.focus.seatId, seatId);
      assert.equal(data.labels.name, name);
      assert.ok(data.labels.fx);
      const fit = await page.evaluate(id => window.p08Review.frame(id), seatId);
      assert.ok(fit.faceAngleDeg < 20 && !fit.treeOccludes && fit.depth < 1 && fit.edge <= 0.84, JSON.stringify(fit));
      gifts.push({ time, seatId, name, fit, ...data.focus, labels: data.labels });
    } else assert.equal(data.mode, label === 'gift-return' ? 'CINE_RETURN' : 'CINEMATIC');
    await shot(label);
    photos.push({ file: label + '.png', time, seed: 9, routeId: data.routeId, mode: data.mode, profile: 'eco' });
  }

  await ready({ demo: 'capacity' });
  const exhausted = await step(48.9);
  assert.match(exhausted.labels.fallback, /^Duyên/);
  assert.equal(exhausted.focus.name, 'An');
  await shot('gift-capacity-fallback');
  photos.push({ file: 'gift-capacity-fallback.png', time: 48.9, seed: 9, profile: 'eco' });
  const escaped = await page.evaluate(async () => {
    const { showGift } = await import('/src/slice-overlay.ts');
    const gift = { displayName: '<b>Tên DEMO</b>', confirmation: 'confirmed', giftCount: 1, giftId: 'rose' };
    showGift(null, { state: { camera: { mode: 'CINEMATIC' } }, overlay: gift });
    const preview = document.getElementById('gift-fallback');
    return { text: preview.textContent, childElements: preview.children.length };
  });
  assert.equal(escaped.text, '<b>Tên DEMO</b> · 1 hoa hồng');
  assert.equal(escaped.childElements, 0);

  await ready({ manual: false, demo: 'gifts' });
  const wall = await page.evaluate(() => new Promise(resolve => {
    const rows = [];
    const deadline = performance.now() + 94_000;
    const poll = () => {
      const frame = window.viewerReport;
      if (rows.at(-1)?.seconds !== frame.elapsedSeconds) rows.push({
        seconds: frame.elapsedSeconds, shot: frame.shot, mode: frame.mode,
        routeId: frame.routeId, position: frame.position, target: frame.target,
        focus: frame.focus, labels: frame.labels, confirmedGiftCount: frame.confirmedGiftCount,
      });
      if (frame.elapsedSeconds >= 66 || performance.now() > deadline) resolve({ rows, report: frame });
      else setTimeout(poll, 75);
    };
    poll();
  }));
  assert.ok(wall.report.elapsedSeconds >= 66);
  assert.deepEqual(wall.report.errors, []);
  assert.equal(wall.report.confirmedGiftCount, 7);
  assert.equal(wall.report.mode, 'CINEMATIC');
  assert.deepEqual([...new Set(wall.rows.filter(row => row.labels?.name).map(row => row.labels.name))], ['An', 'Bình', 'Chi']);
  assert.ok(wall.rows.some(row => row.mode === 'CINE_RETURN'));
  const idleRaf = wall.rows.filter(row => row.seconds < 46);
  assert.ok(idleRaf.at(-1).seconds >= 45);
  assert.deepEqual([...new Set(idleRaf.map(row => row.shot))], families);

  const failures = {};
  const route = `**/p08/${pair.pair.actor.file}`;
  for (const [kind, response, expected] of [
    ['missing', { status: 404 }, '404'],
    ['wrongHash', { body: Buffer.alloc(pair.pair.actor.bytes) }, 'SHA-256'],
  ]) {
    await page.route(route, request => request.fulfill(response));
    await page.goto(base);
    await page.waitForFunction(pattern => window.viewerReport.errors.some(error => error.includes(pattern)), expected);
    assert.ok(await page.locator('#status').isVisible());
    assert.equal((await read()).drawCalls, undefined);
    failures[kind] = await page.locator('#status').textContent();
    await page.unroute(route);
  }
  assert.deepEqual(errors, []);

  const assetLog = execFileSync(process.execPath, ['scripts/stage-p08.mjs']);
  await writeFile(join(output, 'asset-verification.jsonl'), assetLog);
  await writeFile(join(output, 'cinematic-60hz.jsonl'), traceLines.join('\n') + '\n');
  await write('gift-trace.json', { lifecycle, domain, actualRaf: wall.rows.filter(row => row.seconds >= 45) });
  await write('browser-report.json', {
    baseline, source: wall.report.repoRevision, seeds, scenes: targetSeeds, photos, seats, gifts, giftMetrics, escaped,
    browser: wall.report.browser, graphics: wall.report.graphics, system: release(), cpu: cpus()[0]?.model,
    viewport, liveStudio: false, wallRaf: { seconds: wall.report.elapsedSeconds, frames: wall.rows.length,
      frameTiming: wall.report.frameTiming, drawCalls: wall.report.drawCalls, triangles: wall.report.trianglesDrawn },
    noGiftObserved: idleRaf.at(-1).seconds,
    assets: { eco: wall.report.asset, quality: quality.asset, ...wall.report.pair },
    qualityPathTreeCollisions: 0, failures, errors,
  });
  console.log(`P0.9 verified 3 × 85 s at virtual 60 Hz and ${wall.report.elapsedSeconds.toFixed(2)} s live rAF, three tree-facing seats, A/B/C return and both GLB failure paths.`);
} finally {
  await browser?.close();
  await server.close();
}
