import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { PerspectiveCamera, Vector3 } from 'three';
import r17b from '../src/sakura-r17b.json' with { type: 'json' };
import r16 from '../src/sakura-r16.json' with { type: 'json' };

const baseline = process.env.V2_BASELINE_ORIGIN ?? 'http://127.0.0.1:5192';
const candidate = process.env.V2_CANDIDATE_ORIGIN ?? 'http://127.0.0.1:5194';
const baseRevision = '1201369e019f6ba04f7437c7dac347e56894ba2a';
const output = new URL('../evidence/p10b3d/', import.meta.url);
const full = '&ambience=rich&seats=rings&shots=hero';
const viewport = { width: 720, height: 1280 };
const browser = await chromium.launch({
  executablePath: process.env.V2_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const ledger = { baseRevision, browser: browser.version(), screenshots: [], parity: [], layouts: [], regression: [],
  benchmarks: [], recovery: [], offline: [], independent: [], ringSweeps: [], mistMotion: [], fallback: [] };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
await mkdir(output, { recursive: true });

async function open(origin, profile, seed, flags = '', scenario = 'community', tree = origin === candidate ? 'r17b' : 'r16') {
  const page = await browser.newPage({ viewport });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(`${origin}/?demo=${scenario}&profile=${profile}&seed=${seed}&look=twilight&clean=1&inspect=1&botanicals=on&diversity=on&blessing=on&presence=on&chatbubbles=on&gifticons=on${flags}${tree ? "&tree=" + tree : ""}`);
  await page.waitForFunction(() => window.p08Review || window.viewerReport?.errors.length);
  assert.deepEqual(await page.evaluate(() => window.viewerReport.errors), []);
  const loaded = await page.evaluate(() => window.viewerReport.asset);
  const pin = tree === 'r17b' ? r17b : r16;
  assert.equal(loaded.assetRevision, pin.revision, loaded.fallbackReason);
  assert.equal(loaded.sha256, pin.profiles[profile].sha256);
  assert.equal(await page.locator('aside h1').textContent(), `Sakura ${pin.revision}`);
  assert.ok((await page.locator('#capture').getAttribute('aria-label')).endsWith(pin.revision));
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
      bubbles: state.bubbles, loaded: state.asset.assetRevision, sha256Asset: state.asset.sha256, reportRevision: state.repoRevision });
  }
  return sha256;
}

async function parity(profile, seed) {
  const a = await open(baseline, profile, seed);
  const b = await open(candidate, profile, seed, '', 'community', { 9: '', 71: 'r16', 1337: 'unknown' }[seed]);
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
  if (seed === 9) {
    const aOn = await open(baseline, profile, seed, full);
    const bOn = await open(candidate, profile, seed, full, 'community', 'r16');
    for (const t of [1, 18.1, 25.75]) {
      const sha256 = await shot(aOn.page, undefined, await step(aOn.page, t));
      const state = await step(bOn.page, t);
      assert.equal(await shot(bOn.page, undefined, state), sha256);
      ledger.parity.push({ profile, seed, t, sha256, candidate: state.repoRevision, flags: 'R16 all-on' });
    }
    await aOn.page.close();
    await bOn.page.close();
  }
}

function projectPads(state) {
  const camera = new PerspectiveCamera(state.fov, 720 / 1280, .05, 500);
  camera.position.fromArray(state.position);
  camera.lookAt(...state.target);
  camera.updateMatrixWorld();
  return state.communityLayout.map((slot, index) => {
    const p = new Vector3().fromArray(slot.position).project(camera);
    return { id: slot.id, ring: index < 5 ? 'inner' : 'outer', position: slot.position,
      x: (p.x + 1) * 360, y: (1 - p.y) * 640, inPortrait: Math.abs(p.x) < 1 && Math.abs(p.y) < 1 && Math.abs(p.z) <= 1 };
  });
}

async function visiblePads(page, state) {
  const bounds = projectPads(state);
  const hits = await page.evaluate(({ points, camera }) => points.map(point => point.inPortrait &&
    window.p08Review.treeCollisions([camera, point.position]).length > 0), { points: bounds, camera: state.position });
  return bounds.map(({ position, ...pad }, i) => ({ ...pad, blockedByR16: hits[i], visible: pad.inPortrait && !hits[i] }));
}

async function topSweep(page, profile, seed, before = false) {
  const captures = before ? [17, 19, 22, 25] : [16, 17, 18.5, 20, 21.5, 22, 23, 24.5, 25.75];
  const rows = [];
  let reference;
  for (let quarter = 64; quarter < 104; quarter++) {
    const t = quarter / 4;
    const draw = captures.includes(t);
    const state = await step(page, t, undefined, draw);
    assert.equal(state.shot, 'HERO_TOP_RING');
    if (before) assert.equal(state.repoRevision, baseRevision);
    const pads = await visiblePads(page, state);
    const visible = pads.filter(pad => pad.visible);
    const inner = visible.filter(pad => pad.ring === 'inner').length;
    const outer = visible.length - inner;
    rows.push({ t, position: state.position, target: state.target, inner, outer, pads });
    if (draw) await shot(page, `${profile}-${seed}-${before ? 'r16-' : 'r17b-'}top-${t}.png`, state);
    if (t === 22) reference = { state, pads };
  }
  let current = 0;
  let longest = 0;
  for (const { inner, outer } of rows) {
    current = inner >= 3 && outer >= 3 && inner + outer >= 7 ? current + .25 : 0;
    longest = Math.max(longest, current);
  }
  ledger.ringSweeps.push({ profile, seed, before, longestSecondsWithBothBands: longest,
    maxVisible: Math.max(...rows.map(row => row.inner + row.outer)), rows });
  if (!before) assert(longest >= 3, `Two bands must stay legible in ${profile}/${seed}; got ${longest}s`);
  return reference;
}

async function gallery(profile, seed, before = false) {
  const origin = before ? baseline : candidate;
  const run = await open(origin, profile, seed, full);
  const label = `${profile}-${seed}-${before ? 'r16' : 'r17b'}`;
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
  const idle = await open(origin, profile, seed, full, 'idle');
  const { state: top, pads } = await topSweep(idle.page, profile, seed, before);
  ledger.layouts.push({ profile, seed, before, tree: top.treeTarget, slots: top.communityLayout, radius: top.communityPadRadius,
    plants: top.botanicals.plants, contact, actorLooks: top.diversity.looks.slice(0, 3), topPortrait: pads,
    rich: top.richAmbience, assets: { tree: top.asset, lotuses: top.botanicals.assets, padAndActor: top.pair } });
  await shot(idle.page, `${label}-aerial.png`, await step(idle.page, 29));
  await shot(idle.page, `${label}-return-loop.png`, await step(idle.page, 40.4));
  assert.deepEqual([...run.pageErrors, ...idle.pageErrors], []);
  await run.page.close();
  await idle.page.close();
}

const mistPose = { position: [8, 4, 24], target: [0, 5, 0], fov: 53 };
async function benchmarks(profile) {
  for (const [tree, flags] of [['r16', full], ['r17b', full], ['r17b', '&seats=rings&shots=hero']]) {
    const variant = tree + (flags === full ? '-rich' : '-mist-off');
    const { page } = await open(candidate, profile, 9, flags, 'community', tree);
    const r = await step(page, 2, mistPose);
    await shot(page, `${profile}-${variant}-matched-root.png`, r, 'fixed matched mist pose');
    for (const t of [3.5, 5.25]) {
      const state = await step(page, t, mistPose);
      const filename = `${profile}-${variant}-root-${t}.png`;
      const sha256 = await shot(page, filename, state, 'fixed rock and mist motion');
      ledger.mistMotion.push({ profile, variant, t, filename, sha256 });
    }
    const sample = await page.evaluate(pose => new Promise((resolve, reject) => {
      const intervals = [];
      const cpu = [];
      let prev;
      let frame = 0;
      const tick = now => {
        try {
          const begin = performance.now();
          const r = window.p08Review.step(5.25 + frame / 60, true, undefined, undefined, undefined, pose);
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
    ledger.benchmarks.push({ profile, variant, revision: r.repoRevision, tree: r.asset, ...sample,
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
  assert.deepEqual(stats.treeCameraHits, [], `active R17B path intersection ${profile}/${seed}/${scenario}`);
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
  assert.equal(after.asset.assetRevision, 'R17B');
  assert.equal(after.asset.sha256, before.asset.sha256);
  assert.equal(after.bubbles?.gift, undefined);
  assert.deepEqual(after.richAmbience, before.richAmbience);
  ledger.recovery.push({ profile, glError, seat: after.focus.seatId, asset: after.asset.sha256, rich: after.richAmbience });
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
    const { page, pageErrors } = await open(candidate, 'eco', 9, flag, 'community', 'r16');
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

async function returnShot(profile, revision) {
  const { page } = await open(candidate, profile, 9, full, 'capacity', revision);
  for (const t of [63.5, 63.65, 64.1, 64.75]) {
    const r = await step(page, t);
    assert.equal(r.mode, t < 63.55 ? 'GIFT_FOCUS' : 'CINE_RETURN');
    await shot(page, `${profile}-${revision}-capacity-return-${t}.png`, r);
  }
  await page.close();
}

async function fallback(profile) {
  const pin = r17b.profiles[profile];
  const good = await open(candidate, profile, 9, full, 'community', 'r16');
  const expectedPixels = await shot(good.page, undefined, await step(good.page, 1));
  await good.page.close();
  const bytes = await readFile(new URL(`../public/r17b/${pin.file}`, import.meta.url));
  bytes[bytes.length - 1] ^= 1;
  for (const mode of ['missing', 'wrong-sha', 'both-fail', 'abort']) {
    const page = await browser.newPage({ viewport });
    const requests = [];
    page.on('request', request => {
      const path = new URL(request.url()).pathname;
      if (path.startsWith('/r16/') || path.startsWith('/r17b/')) requests.push(path);
    });
    await page.route('**/r17b/**', async route => {
      if (mode === 'abort') {
        await page.evaluate(() => {
          window.dispatchEvent(new PageTransitionEvent('pagehide'));
          window.r17AbortHarness = true;
        });
        await route.abort();
      } else if (mode === 'wrong-sha') await route.fulfill({ body: bytes, contentType: 'model/gltf-binary' });
      else await route.fulfill({ status: 404, body: '' });
    });
    if (mode === 'both-fail') await page.route('**/r16/**', route => route.fulfill({ status: 404, body: '' }));
    await page.goto(`${candidate}/?demo=community&profile=${profile}&seed=9&look=twilight&clean=1&inspect=1&botanicals=on&diversity=on&blessing=on&presence=on&chatbubbles=on&gifticons=on${full}&tree=r17b`);
    if (mode === 'abort') {
      await page.waitForFunction(() => window.r17AbortHarness);
      assert.deepEqual(await page.evaluate(() => window.viewerReport.errors), []);
      assert.deepEqual(requests, ['/r17b/' + pin.file]);
      assert.equal(await page.evaluate(() => window.viewerReport.asset), undefined);
      ledger.fallback.push({ profile, mode, requests });
    } else if (mode === 'both-fail') {
      await page.waitForFunction(() => window.viewerReport.errors.length);
      const failure = await page.evaluate(() => ({ errors: window.viewerReport.errors, asset: window.viewerReport.asset,
        ui: document.querySelector('#status').textContent }));
      assert.equal(failure.asset, undefined);
      assert.match(failure.ui, /R17B:.*R16:/);
      assert.equal(requests.length, 2);
      ledger.fallback.push({ profile, mode, requests, ...failure });
    } else {
      await page.waitForFunction(() => window.p08Review || window.viewerReport.errors.length);
      const r = await step(page, 1);
      assert.equal(r.asset.requestedRevision, 'R17B');
      assert.equal(r.asset.assetRevision, 'R16');
      assert.equal(r.asset.sha256, r16.profiles[profile].sha256);
      assert.equal(r.asset.profile, profile);
      assert.match(await page.title(), /R16 fallback/);
      assert.equal(await page.locator('aside h1').textContent(), 'Sakura R16');
      assert.ok((await page.locator('#capture').getAttribute('aria-label')).endsWith('R16'));
      assert.match(r.asset.fallbackReason, mode === 'wrong-sha' ? /SHA-256/ : /404/);
      assert.deepEqual(requests, ['/r17b/' + pin.file, '/r16/' + r16.profiles[profile].file]);
      assert.equal(await shot(page, `${profile}-fallback-${mode}.png`, r), expectedPixels);
      ledger.fallback.push({ profile, mode, requests, loaded: r.asset, pixelParity: true });
    }
    await page.close();
  }
}

try {
  if (process.argv.includes('--scan-only')) {
    for (const profile of ['eco', 'quality']) for (const seed of [9, 71, 1337]) {
      const run = await open(candidate, profile, seed, full, 'idle');
      await topSweep(run.page, profile, seed);
      await run.page.close();
      for (const scenario of ['idle', 'gifts', 'capacity', 'community']) await regression(profile, seed, scenario);
      console.log(profile, seed, 'R17B clearance and top sweep verified');
    }
  } else if (process.argv.includes('--fallback-only')) {
    for (const profile of ['eco', 'quality']) await fallback(profile);
  } else {
    for (const profile of ['eco', 'quality']) {
      for (const seed of [9, 71, 1337]) {
        await parity(profile, seed);
        await gallery(profile, seed, true);
        await gallery(profile, seed);
        for (const scenario of ['idle', 'gifts', 'capacity', 'community']) await regression(profile, seed, scenario);
        console.log(profile, seed, 'R16 parity, R17B gallery and four routes verified');
      }
      await benchmarks(profile);
      await recovery(profile);
      await returnShot(profile, 'r16');
      await returnShot(profile, 'r17b');
      await fallback(profile);
    }
    await independentFlags();
  }
  await writeFile(new URL('browser.json', output), JSON.stringify(ledger, null, 2) + '\n');
} finally {
  await browser.close();
}
