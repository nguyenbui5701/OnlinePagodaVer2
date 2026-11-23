import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { PerspectiveCamera, Vector3 } from 'three';

const baseline = process.env.V2_BASELINE_ORIGIN ?? 'http://127.0.0.1:5190';
const candidate = process.env.V2_CANDIDATE_ORIGIN ?? 'http://127.0.0.1:5192';
const baseRevision = 'ee27355b2b80f847602b0f6d2a3c259e4861fc54';
const output = new URL('../evidence/p10b3b/', import.meta.url);
const full = '&ambience=rich&seats=rings&shots=hero';
const viewport = { width: 720, height: 1280 };
const browser = await chromium.launch({
  executablePath: process.env.V2_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const ledger = { baseRevision, browser: browser.version(), screenshots: [], parity: [], layouts: [], regression: [],
  benchmarks: [], recovery: [], offline: [], independent: [] };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
await mkdir(output, { recursive: true });

async function open(origin, profile, seed, flags = '', scenario = 'community') {
  const page = await browser.newPage({ viewport });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(`${origin}/?demo=${scenario}&profile=${profile}&seed=${seed}&look=twilight&clean=1&inspect=1&botanicals=on&diversity=on&blessing=on&presence=on&chatbubbles=on&gifticons=on${flags}`);
  await page.waitForFunction(() => window.p08Review || window.viewerReport?.errors.length);
  assert.deepEqual(await page.evaluate(() => window.viewerReport.errors), []);
  await page.addStyleTag({ content: '#gift-fx { animation: none }' });
  return { page, pageErrors };
}

async function step(page, time, pose, draw = true) {
  return page.evaluate(({ time, pose, draw }) => {
    const review = window.p08Review;
    const firstTick = Math.floor((window.viewerReport.elapsedSeconds ?? 0) * 60 + 1e-6) + 1;
    for (let frame = firstTick; frame / 60 < time - 1e-6; frame++) review.step(frame / 60, false);
    return review.step(time, draw, undefined, undefined, undefined, pose);
  }, { time, pose, draw });
}

async function shot(page, filename, state, view = 'native-route') {
  assert.deepEqual(state.errors, []);
  const png = await page.locator('#stage').screenshot();
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [720, 1280]);
  const sha256 = hash(png);
  if (filename) {
    await writeFile(new URL(filename, output), png);
    ledger.screenshots.push({ filename, sha256, time: state.elapsedSeconds, view, shot: state.shot, mode: state.mode,
      camera: [state.position, state.target, state.fov], focus: state.focus?.seatId, names: state.community?.names,
      bubbles: state.bubbles, reportRevision: state.repoRevision });
  }
  return sha256;
}

async function parity(profile, seed) {
  const a = await open(baseline, profile, seed);
  const b = await open(candidate, profile, seed);
  for (const t of [1, 18.1, 29]) {
    const av = await step(a.page, t);
    const bv = await step(b.page, t);
    assert.equal(av.repoRevision, baseRevision);
    const label = `${profile}-${seed}-legacy-${t}.png`;
    const sha256 = await shot(a.page, label, av);
    assert.equal(await shot(b.page, undefined, bv), sha256, `OFF pixel mismatch ${label}`);
    ledger.parity.push({ profile, seed, t, sha256, candidate: bv.repoRevision });
  }
  assert.deepEqual([...a.pageErrors, ...b.pageErrors], []);
  await a.page.close();
  await b.page.close();
}

function projectPads(state) {
  const camera = new PerspectiveCamera(state.fov, 720 / 1280, .05, 500);
  camera.position.fromArray(state.position);
  camera.lookAt(...state.target);
  camera.updateMatrixWorld();
  return state.communityLayout.map(slot => {
    const p = new Vector3().fromArray(slot.position).project(camera);
    return { id: slot.id, x: (p.x + 1) * 360, y: (1 - p.y) * 640, inPortrait: Math.abs(p.x) < 1 && Math.abs(p.y) < 1 };
  });
}

async function gallery(profile, seed) {
  const run = await open(candidate, profile, seed, full);
  const label = `${profile}-${seed}`;
  const first = await step(run.page, 1);
  assert.equal(first.shot, 'HERO_WIDE_TREE_REFLECTION');
  await shot(run.page, `${label}-wide-opening.png`, first);
  await shot(run.page, `${label}-wide-motion.png`, await step(run.page, 5));
  const [x, , z] = first.communityLayout[0].position;
  const [tx, , tz] = first.treeTarget;
  const radial = new Vector3(x - tx, 0, z - tz).normalize();
  const closePosition = new Vector3(x, 1.5, z).addScaledVector(radial, -4.8);
  const close = { position: closePosition.toArray(), target: [x, .86, z], fov: 43 };
  const chat = await step(run.page, 8.6, close);
  assert.equal(chat.bubbles?.chat?.seatId, 'seat-1');
  assert(chat.community.names.some(n => n.seatId === 'seat-1'));
  await shot(run.page, `${label}-chat-close.png`, chat, 'fixed QA seat close');
  const float = await step(run.page, 10, close);
  assert.equal(float.bubbles?.chat?.phase, 'float');
  await shot(run.page, `${label}-chat-float.png`, float, 'fixed QA seat close');
  const focus = await step(run.page, 17.43);
  assert.equal(focus.focus?.seatId, 'seat-1');
  assert(focus.community.names.some(n => n.seatId === 'seat-1'));
  assert.match(focus.labels.fallback, /Duyên/);
  await shot(run.page, `${label}-gift.png`, focus);
  const contact = await run.page.evaluate(() => [1, 2, 3].map(id => window.p08Review.contact(`seat-${id}`)));
  for (const result of contact) assert(result.matched > 0 && result.minGap > -.03);
  const idle = await open(candidate, profile, seed, full, 'idle');
  for (const t of [17, 19, 22, 25]) {
    const top = await step(idle.page, t);
    assert.equal(top.shot, 'HERO_TOP_RING');
    await shot(idle.page, `${label}-top-${t}.png`, top);
    if (t === 22) {
      const bounds = projectPads(top);
      ledger.layouts.push({ profile, seed, tree: top.treeTarget, slots: top.communityLayout, radius: top.communityPadRadius,
        plants: top.botanicals.plants, contact, actorLooks: top.diversity.looks.slice(0, 3), topPortrait: bounds,
        rich: top.richAmbience, assets: { tree: top.asset, lotuses: top.botanicals.assets, padAndActor: top.pair } });
    }
  }
  await shot(idle.page, `${label}-aerial.png`, await step(idle.page, 29));
  await shot(idle.page, `${label}-return-loop.png`, await step(idle.page, 40.4));
  assert.deepEqual([...run.pageErrors, ...idle.pageErrors], []);
  await run.page.close();
  await idle.page.close();
}

const mistPose = { position: [8, 4, 24], target: [0, 5, 0], fov: 53 };
async function benchmarks(profile) {
  for (const [variant, flags] of [['OFF', ''], ['RICH_ONLY', '&ambience=rich'], ['ALL_ON', full]]) {
    const { page } = await open(candidate, profile, 9, flags);
    const r = await step(page, 2, mistPose);
    await shot(page, `${profile}-mist-${variant.toLowerCase()}.png`, r, 'fixed matched mist pose');
    const sample = await page.evaluate(pose => new Promise((resolve, reject) => {
      const intervals = [];
      const cpu = [];
      let prev;
      let frame = 0;
      const tick = now => {
        try {
          const begin = performance.now();
          const r = window.p08Review.step(2 + frame / 60, true, undefined, undefined, undefined, pose);
          if (frame >= 4) { intervals.push(now - prev); cpu.push(performance.now() - begin); }
          prev = now;
          if (++frame < 16) return requestAnimationFrame(tick);
          const pct = (data, q) => data.toSorted((a, b) => a - b)[Math.ceil(q * data.length) - 1];
          resolve({ renderer: r.graphics, intervals, cpu, frameMs: [.5, .95, .99].map(q => pct(intervals, q)),
            stallsOver100Ms: intervals.filter(i => i > 100).length, draws: r.drawCalls, triangles: r.trianglesDrawn,
            points: r.pointsDrawn, geometries: r.geometries,
            seatMaterials: r.seatMaterialCount, textures: r.textures, programs: r.shaderPrograms,
            rich: r.richAmbience, jsHeap: performance.memory?.usedJSHeapSize, errors: r.errors });
        } catch (error) { reject(error); }
      };
      requestAnimationFrame(tick);
    }), mistPose);
    assert.deepEqual(sample.errors, []);
    ledger.benchmarks.push({ profile, variant, ...sample,
      mistSquarePixelUpperBound: (sample.rich?.mistPoints ?? 0) * (sample.rich?.mistPixelCap ?? 0) ** 2 });
    await page.close();
  }
}

async function regression(profile, seed, scenario) {
  const run = await open(candidate, profile, seed, full, scenario);
  const stats = await run.page.evaluate(({ end, scenario }) => {
    const rows = [];
    const shots = new Set();
    const routeIds = new Set();
    const fifo = [];
    const seamTimes = [];
    const review = window.p08Review;
    let prior;
    let minY = Infinity, maxCinematicStep = 0, maxGiftStep = 0, maxHandoff = 0, maxSeats = 0, overflow;
    let final;
    const distance = (a, b) => Math.hypot(...a.map((v, n) => v - b[n]));
    for (let i = 0; i <= end * 60; i++) {
      const r = review.step(i / 60, false);
      const { position, target, mode, shot, focus, community, cycle, routeId } = r;
      minY = Math.min(minY, position[1]);
      maxSeats = Math.max(maxSeats, community.realActors);
      shots.add(shot);
      routeIds.add(routeId);
      if (r.labels.fallback?.includes('Duyên')) overflow = r.labels.fallback;
      if (focus && mode === 'GIFT_FOCUS' && fifo.at(-1)?.request !== focus.requestId) {
        fifo.push({ name: focus.name, seat: focus.seatId, request: focus.requestId, time: i / 60 });
      }
      if (prior) {
        const movement = distance(position, prior.position);
        if (mode === 'CINEMATIC' && prior.mode === 'CINEMATIC') maxCinematicStep = Math.max(maxCinematicStep, movement);
        else maxGiftStep = Math.max(maxGiftStep, movement);
        if (prior.focus?.requestId !== focus?.requestId) maxHandoff = Math.max(maxHandoff, movement);
        if (prior.cycle !== cycle && scenario === 'idle') seamTimes.push([i / 60, movement]);
      }
      if (i % 6 === 0) rows.push({ time: i / 60, position, target, mode, shot, focus: focus?.seatId,
        actors: community.realActors, gift: r.confirmedGiftCount, room: r.roomSessionId, names: community.names });
      prior = { position, mode, focus, cycle };
      final = r;
    }
    const slots = final.communityLayout;
    const radius = final.communityPadRadius;
    let padSeparation = Infinity;
    let botanicalGap = Infinity;
    let minLowCameraPadGap = Infinity;
    let treePadHits = 0;
    for (const [i, pad] of slots.entries()) {
      const [x, , z] = pad.position;
      for (const other of slots.slice(i + 1)) padSeparation = Math.min(padSeparation,
        Math.hypot(x - other.position[0], z - other.position[2]) - 2 * radius);
      for (const flower of final.botanicals.plants) botanicalGap = Math.min(botanicalGap,
        Math.hypot(x - flower.position[0], z - flower.position[2]) - radius - (flower.kind === 'bloom' ? .54 : .21));
      for (const row of rows) if (row.position[1] < 1.2) minLowCameraPadGap = Math.min(minLowCameraPadGap,
        Math.hypot(x - row.position[0], z - row.position[2]) - radius);
      for (let n = 0; n < 9; n++) {
        const offset = n === 8 ? 0 : radius;
        const a = n * Math.PI / 4;
        const xx = x + Math.sin(a) * offset;
        const zz = z + Math.cos(a) * offset;
        treePadHits += review.treeCollisions([[xx, -.03, zz], [xx, 3.3, zz]]).length;
      }
    }
    return { end, rows, shots: [...shots], routeIds: [...routeIds], fifo, seamTimes, minY, maxCinematicStep, maxGiftStep,
      maxHandoff, maxSeats, overflow, padSeparation, botanicalGap, minLowCameraPadGap, treePadHits,
      treeCameraHits: review.treeCollisions(rows.map(row => row.position)), errors: final.errors };
  }, { end: scenario === 'idle' ? 85 : 66, scenario });
  assert.deepEqual(stats.errors, []);
  assert.equal(stats.treePadHits, 0);
  assert.deepEqual(stats.treeCameraHits, [], `R16 path intersection ${profile}/${seed}/${scenario}`);
  assert(stats.padSeparation > .22 && stats.botanicalGap >= .219 && stats.minY > .8 && stats.maxSeats <= 3);
  assert(stats.maxCinematicStep <= .22 && stats.maxGiftStep <= 1.65,
    `camera step ${profile}/${seed}/${scenario} ${stats.maxCinematicStep} ${stats.maxGiftStep}`);
  assert(stats.maxHandoff < .3);
  if (scenario === 'idle') {
    assert.equal(stats.seamTimes.length, 2);
    assert.equal(stats.routeIds.length, 2);
    assert(stats.shots.includes('HERO_TOP_RING') && stats.shots.includes('HERO_WIDE_TREE_REFLECTION'));
  }
  if (scenario === 'gifts' || scenario === 'capacity') assert.deepEqual(stats.fifo.map(f => f.seat), ['seat-1', 'seat-2', 'seat-3']);
  if (scenario === 'capacity' || scenario === 'community') assert(stats.overflow);
  const { rows, ...summary } = stats;
  const trace = `${profile}-${seed}-${scenario}-trace.json`;
  await writeFile(new URL(trace, output), JSON.stringify(rows) + '\n');
  ledger.regression.push({ profile, seed, scenario, trace, ...summary });
  assert.deepEqual(run.pageErrors, []);
  await run.page.close();
}

async function recovery(profile) {
  const { page } = await open(candidate, profile, 9, full);
  const before = await step(page, 17.43);
  await page.evaluate(() => {
    const extension = document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');
    window.b3bRestore = () => extension.restoreContext();
    extension.loseContext();
  });
  await page.waitForFunction(() => window.viewerReport.errors.includes('webglcontextlost'));
  await page.evaluate(() => window.b3bRestore());
  await page.waitForFunction(() => window.viewerReport.contextRestores === 1);
  const after = await step(page, 17.5);
  const glError = await page.evaluate(() => document.querySelector('canvas').getContext('webgl2').getError());
  assert.equal(glError, 0);
  assert.equal(after.focus.seatId, before.focus.seatId);
  assert.equal(after.bubbles?.gift, undefined);
  assert.deepEqual(after.richAmbience, before.richAmbience);
  ledger.recovery.push({ profile, glError, seat: after.focus.seatId, rich: after.richAmbience });
  await page.close();
  const offline = await open(candidate, profile, 9, full + '&source=live');
  const state = await step(offline.page, 18.1);
  assert.equal(state.liveStatus, 'OFFLINE');
  assert.equal(state.community.realActors, 0);
  assert.equal(state.community.slots.length, 12);
  assert.equal(state.confirmedGiftCount, 0);
  ledger.offline.push({ profile, status: state.liveStatus, actors: state.community.realActors });
  await offline.page.close();
}

async function independentFlags() {
  for (const [flag, expected] of [
    ['', { rich: false, rings: false, hero: false }],
    ['&ambience=rich', { rich: true, rings: false, hero: false }],
    ['&seats=rings', { rich: false, rings: true, hero: false }],
    ['&shots=hero', { rich: false, rings: false, hero: true }],
  ]) {
    const { page, pageErrors } = await open(candidate, 'eco', 9, flag);
    const state = await step(page, 1);
    const ring = Math.hypot(state.communityLayout[0].position[0] - state.treeTarget[0],
      state.communityLayout[0].position[2] - state.treeTarget[2]);
    const result = { rich: !!state.richAmbience, rings: Math.abs(ring - 13.8) < 1e-6,
      hero: state.shot === 'HERO_WIDE_TREE_REFLECTION' };
    assert.deepEqual(result, expected);
    assert.deepEqual([...pageErrors, ...state.errors], []);
    ledger.independent.push({ flag, ...result });
    await page.close();
  }
}

async function returnShot(profile) {
  const { page } = await open(candidate, profile, 9, full, 'capacity');
  for (const t of [63.5, 63.65, 64.1, 64.75]) {
    const r = await step(page, t);
    assert.equal(r.mode, t < 63.55 ? 'GIFT_FOCUS' : 'CINE_RETURN');
    await shot(page, `${profile}-capacity-return-${t}.png`, r);
  }
  await page.close();
}

try {
  if (process.argv.includes('--scan-only')) {
    for (const seed of [9, 71, 1337]) await regression('quality', seed, 'community');
  } else if (process.argv.includes('--smoke')) {
    await gallery('eco', 9);
    await regression('eco', 9, 'community');
  } else for (const profile of ['eco', 'quality']) {
    for (const seed of [9, 71, 1337]) {
      await parity(profile, seed);
      await gallery(profile, seed);
      for (const scenario of ['idle', 'gifts', 'capacity', 'community']) await regression(profile, seed, scenario);
      console.log(profile, seed, 'gallery and four routes verified');
    }
    await benchmarks(profile);
    await recovery(profile);
    await returnShot(profile);
  }
  if (ledger.benchmarks.length) await independentFlags();
  await writeFile(new URL('browser.json', output), JSON.stringify(ledger, null, 2) + '\n');
} finally {
  await browser.close();
}
