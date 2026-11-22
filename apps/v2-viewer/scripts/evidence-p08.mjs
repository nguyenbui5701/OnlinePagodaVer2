import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, platform, release } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import manifest from '../src/p08-assets.json' with { type: 'json' };
import sakura from '../src/sakura-r16.json' with { type: 'json' };

const executablePath = process.env.V2_BROWSER;
if (!executablePath) throw new Error('Set V2_BROWSER to a Chromium or Edge executable.');
const output = resolve(process.env.V2_EVIDENCE_DIR || 'evidence/p08');
await mkdir(output, { recursive: true });
const port = 4178;
const base = `http://127.0.0.1:${port}`;
const server = await createServer({ server: { host: '127.0.0.1', port, strictPort: true }, logLevel: 'error' });
const capture = { width: 720, height: 1280 };
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ executablePath, args: [
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling',
  ] });
  const page = await browser.newPage({ viewport: capture });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = async () => page.evaluate(() => window.viewerReport);
  const ready = async (params, profile = 'eco', height = capture.height) => {
    await page.setViewportSize({ width: capture.width, height });
    await page.goto(`${base}/?clean=1&profile=${profile}&${params}`);
    const manual = params.includes('inspect=1');
    await page.waitForFunction(manual => window.viewerReport &&
      (window.viewerReport.errors.length || (manual ? window.p08Review : window.viewerReport.drawCalls)),
      manual, { timeout: 30000 });
    const current = await state();
    assert.deepEqual(current.errors, []);
    assert.equal(current.asset.sha256, sakura.profiles[profile].sha256);
    assert.deepEqual(current.viewport, [capture.width, height]);
    if (!params.startsWith('view=')) {
      assert.equal(current.pair.pad.sha256, manifest.pair.pad.sha256);
      assert.equal(current.pair.actor.sha256, manifest.pair.actor.sha256);
    }
    return current;
  };
  const shot = name => page.locator('#stage').screenshot({ path: join(output, `${name}.png`), animations: 'disabled' });
  const step = (seconds, draw = true, angle, idle) =>
    page.evaluate(({ seconds, draw, angle, idle }) => window.p08Review.step(seconds, draw, angle, idle),
      { seconds, draw, angle, idle });
  const native = await ready('inspect=1', 'quality');
  const qualityFrame = await step(3);
  await shot('quality-integrated');

  const references = {};
  const referenceHashes = {
    hero_full_9x16: '164c2c93c4172beb80b87816c43966165ce8896fae90df9a23715761a1fe8532',
    top: '9763b2d142bb3b86ca96a5318b7f9c4da931959e16e47cac4ef13981544b2005',
    under: '8cf48534950babc1eeb26668fb86ac99b5b21ece927f47f70dbac59f865eec24',
    three_quarter: '9ad8e5adde73ae3ef88ffe843b80b35f9400dd43b900acd9c6b468921c43526c',
  };
  const sheet = await browser.newPage({ viewport: { width: 1064, height: 990 } });
  for (const [view, sha] of Object.entries(referenceHashes)) {
    const path = `${sakura.canonicalDirectory}/Blender_Evidence_R16/r16_final/r16_final_${view}_cycles.png`;
    const cycle = execFileSync('git', ['cat-file', 'blob', `${manifest.sources.sakura.commit}:${path}`]);
    assert.equal(createHash('sha256').update(cycle).digest('hex'), sha);
    const result = await ready(`view=${view}`, 'quality', view === 'hero_full_9x16' ? 1280 : 835);
    const browserImage = await page.locator('#capture').screenshot();
    await sheet.setContent(`<style>
      body{margin:0;background:#141019;color:white;font:16px system-ui}
      main{display:flex;width:max-content;padding:8px;gap:8px}
      figure{margin:0}figcaption{padding:8px}img{display:block;width:520px;height:auto}
      </style><main><figure><figcaption>R16 Cycles · ${view}</figcaption>
      <img src="data:image/png;base64,${cycle.toString('base64')}"></figure>
      <figure><figcaption>P0.8 Three.js · ${view}</figcaption>
      <img src="data:image/png;base64,${browserImage.toString('base64')}"></figure></main>`);
    await sheet.locator('main').screenshot({ path: join(output, `cycles-${view}.png`) });
    references[view] = { sha256: sha, pose: result.position, fov: result.fov, viewport: result.viewport };
  }
  await sheet.close();

  await ready('inspect=1');
  const idle = [];
  for (const time of [0, 0.5, 1, 1.5, 2]) {
    await step(time, true, 0.26, time);
    const fit = await page.evaluate(() => window.p08Review.fit());
    assert.ok(fit.contactError < 1e-6);
    assert.ok(fit.lowestActorOffset > -0.015, JSON.stringify(fit));
    idle.push({ time, ...fit });
    await shot(`fit-idle-${time.toFixed(1)}s`);
  }
  assert.ok(new Set(idle.map(frame => frame.headWorld[1])).size > 1);
  assert.equal(idle[0].headWorld[1], idle.at(-1).headWorld[1]);
  for (const [name, angle] of [['front', 0], ['side', Math.PI / 2], ['three-quarter', Math.PI / 4]]) {
    await step(2, true, angle, 0);
    await shot(`fit-${name}`);
  }
  const cinematicFrames = [];
  for (const time of [3, 9, 15, 20, 33, 42]) {
    const frame = await step(time);
    cinematicFrames.push({ seconds: time, shot: frame.shot, position: frame.position, target: frame.target, fov: frame.fov });
    await shot(`cinematic-${time}s`);
  }

  await ready('inspect=1&demo=gifts');
  const rehearsed = await page.evaluate(() => {
    const trace = [];
    for (let atMs = 0; atMs <= 66500; atMs += 50) {
      const { shot, mode, position, target, focus, labels, confirmedGiftCount, pendingGivers } =
        window.p08Review.step(atMs / 1000, false);
      trace.push({ atMs, shot, mode, position, target, focus, labels, confirmedGiftCount, pendingGivers });
    }
    return { trace, events: window.p08Review.trace() };
  });
  const gifts = rehearsed.events.flatMap(row => row.effects.filter(effect => effect.type === 'focusStarted'));
  const focusFrames = rehearseFocus(rehearsed.trace);
  assert.deepEqual(focusFrames.map(frame => [frame.focus.name, frame.focus.seatId, frame.labels.name]),
    [['An', 'seat-1', 'An'], ['Bình', 'seat-2', 'Bình'], ['Chi', 'seat-3', 'Chi']]);
  assert.deepEqual(focusFrames.map(frame => frame.focus.actorId), gifts.map(event => event.intent.actorId));
  assert.equal(rehearsed.trace.at(-1).confirmedGiftCount, 7);
  assert.equal(rehearsed.trace.at(-1).mode, 'CINEMATIC');
  assert.equal(rehearsed.events.filter(row => row.disposition === 'duplicate').length, 3);
  const distance = (a, b) => Math.hypot(...a.map((x, i) => x - b[i]));
  const movement = rehearsed.trace.slice(1).map((row, i) => distance(row.position, rehearsed.trace[i].position));
  assert.ok(Math.max(...movement) < 2.5, String(Math.max(...movement)));
  const sample50msMaximumDistance = Math.max(...movement);
  // Advance the same browser pipeline at logical ticks, drawing only the review frames.
  await ready('inspect=1&demo=gifts');
  let cursor = 0;
  for (const [name, atMs] of [['transition', 46600], ['A', 48100], ['B', 53700], ['C', 59550], ['return', 64250], ['resumed', 66500]]) {
    const data = await page.evaluate(({ cursor, atMs }) => {
      for (let ms = cursor; ms < atMs; ms += 50) window.p08Review.step(ms / 1000, false);
      return window.p08Review.step(atMs / 1000);
    }, { cursor, atMs });
    cursor = atMs + 50;
    if (['A', 'B', 'C'].includes(name)) {
      assert.equal(data.mode, 'GIFT_FOCUS');
      assert.equal(data.labels.name, { A: 'An', B: 'Bình', C: 'Chi' }[name]);
      assert.ok(data.labels.fx);
    }
    if (name === 'return') assert.equal(data.mode, 'CINE_RETURN');
    await shot(`gift-${name}`);
  }

  await ready('inspect=1&demo=capacity');
  await page.evaluate(() => {
    for (let ms = 45500; ms < 48900; ms += 50) window.p08Review.step(ms / 1000, false);
    window.p08Review.step(48.9);
  });
  const fallback = await state();
  assert.equal(fallback.focus.name, 'An');
  assert.match(fallback.labels.fallback, /^Duyên/);
  await shot('gift-capacity-fallback');

  await ready('demo=gifts');
  await page.waitForFunction(() => window.viewerReport.mode === 'CINEMATIC');
  // Read real rAF samples throughout the replay from the same document.
  const recorded = await page.evaluate(() => new Promise(resolve => {
    const rows = [];
    const deadline = performance.now() + 90000;
    let last = -Infinity;
    const poll = () => {
      const r = window.viewerReport;
      if (r.elapsedSeconds !== last) {
        rows.push({
          seconds: r.elapsedSeconds, shot: r.shot, mode: r.mode, position: r.position, target: r.target,
          revision: r.revision, roomSessionId: r.roomSessionId, focus: r.focus, labels: r.labels,
          confirmedGiftCount: r.confirmedGiftCount,
        });
        last = r.elapsedSeconds;
      }
      if (last >= 66.5 || performance.now() > deadline) resolve({ rows, report: r });
      else setTimeout(poll, 75);
    };
    poll();
  }));
  const firstGift = recorded.rows.findIndex(frame => frame.mode !== 'CINEMATIC');
  const replay = recorded.rows.slice(0, firstGift);
  const giftRaf = recorded.rows.slice(firstGift);
  const live = recorded.report;
  assert.ok(live.elapsedSeconds >= 66.5);
  assert.ok(replay.at(-1).seconds >= 45);
  assert.deepEqual(live.visited, ['CLOSE', 'COMMUNITY', 'AERIAL', 'UNDER_TREE']);
  assert.ok(replay.some(row => row.shot === 'CLOSE' && row.seconds >= 40));
  assert.ok(replay.length > 45);
  assert.ok(replay.every(row => row.mode === 'CINEMATIC'));
  const rafFocusFrames = rehearseFocus(giftRaf);
  assert.deepEqual(rafFocusFrames.map(row => row.labels.name), ['An', 'Bình', 'Chi']);
  assert.ok(giftRaf.some(row => row.mode === 'CINE_RETURN'));
  assert.equal(live.mode, 'CINEMATIC');
  assert.deepEqual(live.errors, []);

  const actorRoute = `**/p08/${manifest.pair.actor.file}`;
  const failures = {};
  for (const [kind, response, pattern] of [
    ['missing', { status: 404 }, '404'],
    ['corrupt', { body: Buffer.alloc(manifest.pair.actor.bytes) }, 'SHA-256'],
  ]) {
    await page.route(actorRoute, route => route.fulfill(response));
    await page.goto(`${base}/?clean=1`);
    await page.waitForFunction(pattern => window.viewerReport.errors.some(error => error.includes(pattern)), pattern);
    failures[kind] = await page.locator('#status').textContent();
    assert.ok(await page.locator('#status').isVisible());
    assert.equal((await state()).drawCalls, undefined);
    await page.unroute(actorRoute);
  }
  assert.deepEqual(errors, []);

  await write('runtime-report.json', {
    environment: { platform: platform(), release: release(), cpu: cpus()[0]?.model, browser: live.browser,
      graphics: live.graphics, liveStudio: false, viewport: [capture.width, capture.height] },
    sourceRevision: live.repoRevision,
    assets: { quality: native.asset, eco: live.asset, ...live.pair },
    references, idle, cinematicFrames, actualRaf: {
      seconds: live.elapsedSeconds, noGiftSeconds: replay.at(-1).seconds, noGiftFramesObserved: replay.length,
      framesObserved: recorded.rows.length, visited: live.visited, rafFocusFrames,
      timing: live.frameTiming, drawCalls: live.drawCalls, trianglesDrawn: live.trianglesDrawn, textures: live.textures,
    },
    qualityDraw: { drawCalls: qualityFrame.drawCalls, trianglesDrawn: qualityFrame.trianglesDrawn, textures: qualityFrame.textures },
    focusFrames, sample50msMaximumDistance, fallback: fallback.labels, failures, pageErrors: errors,
  });
  await write('cinematic-trace.json', replay);
  await write('gift-raf-trace.json', giftRaf);
  await write('gift-trace.json', rehearsed.events);
  await write('camera-handoffs.json', rehearsed.trace.filter((row, index, rows) =>
    (row.atMs >= 45000 && row.atMs % 250 === 0) ||
    row.mode !== rows[index - 1]?.mode || row.focus?.actorId !== rows[index - 1]?.focus?.actorId));
  console.log(`P08 WebGL verification: ${live.elapsedSeconds.toFixed(2)}s rAF, ${replay.at(-1).seconds.toFixed(2)}s no gift, A/B/C plus capacity fallback, four GLBs, 26 screenshots.`);
} finally {
  await browser?.close();
  await server.close();
}

function rehearseFocus(rows) {
  const shots = new Map();
  for (const row of rows) {
    if (row.mode === 'GIFT_FOCUS' && row.focus && row.labels.name && row.labels.fx && !shots.has(row.focus.actorId)) {
      shots.set(row.focus.actorId, row);
    }
  }
  return [...shots.values()];
}

async function write(file, contents) {
  await writeFile(join(output, file), JSON.stringify(contents, null, 2) + '\n');
}
