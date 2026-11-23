import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const viewport = { width: 720, height: 1280 };
const baseline = process.env.V2_BASELINE_ORIGIN ?? 'http://127.0.0.1:5191';
const candidate = process.env.V2_CANDIDATE_ORIGIN ?? 'http://127.0.0.1:5190';
const output = new URL('../evidence/p10b3a/r1/', import.meta.url);
const browser = await chromium.launch({
  executablePath: process.env.V2_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const flags = '&presence=on&chatbubbles=on&gifticons=on';
const poseA = { position: [1.20, 1.42, 8.8], target: [2, 0.9, 13.5], fov: 37 };
const poseB = { position: [-0.5, 1.42, 7.65], target: [-1.4, 0.9, 12.35], fov: 37 };
const report = { browser: browser.version(), classification: 'SYNTHETIC_DEMO_NATIVE_WEBGL', frames: [], pixelParity: [],
  performance: [], recovery: [], offline: [], motion: [] };
await mkdir(output, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

async function open(origin, profile, seed, enabled = false, mode = '', scenario = 'community') {
  const page = await browser.newPage({ viewport });
  const exceptions = [];
  page.on('pageerror', err => exceptions.push(err.message));
  const externalRequests = [];
  await page.route('**/*', route => {
    const requested = new URL(route.request().url()).origin;
    if (requested === origin) return route.continue();
    externalRequests.push(requested);
    return route.abort();
  });
  await page.goto(`${origin}/?demo=${scenario}&seed=${seed}&profile=${profile}&look=twilight&clean=1&inspect=1&botanicals=on&diversity=on&blessing=on${enabled ? flags : ''}${mode}`);
  await page.waitForFunction(() => window.p08Review || window.viewerReport?.errors.length);
  assert.deepEqual(await page.evaluate(() => window.viewerReport.errors), []);
  await page.addStyleTag({ content: '#gift-fx { animation: none }' });
  return { page, exceptions, externalRequests };
}

async function step(page, time, pose, draw = true) {
  return page.evaluate(({ time, pose, draw }) => {
    const review = window.p08Review;
    const start = Math.floor((window.viewerReport.elapsedSeconds ?? 0) * 60) + 1;
    for (let tick = start; tick < Math.round(time * 60); tick++) review.step(tick / 60, false);
    const r = review.step(time, draw, undefined, undefined, undefined, pose);
    return { time, revision: r.repoRevision, renderer: r.graphics, mode: r.mode, focus: r.focus?.seatId,
      count: r.confirmedGiftCount, labels: r.labels, bubbles: r.bubbles, room: r.roomSessionId,
      community: r.community && { slots: r.community.slots.length, actors: r.community.realActors },
      names: [...document.querySelectorAll('.community-name:not([hidden])')].map(node => node.textContent),
      remotePhotos: document.querySelectorAll('#stage img').length,
      badges: document.querySelectorAll('.community-name:not([hidden]) .avatar-badge').length,
      bubbleBoxes: [...document.querySelectorAll('.chat-bubble:not([hidden]),.gift-token:not([hidden])')].map(node => {
        const { x, y, width, height } = node.getBoundingClientRect();
        return { x, y, width, height, alpha: Number(node.style.opacity) };
      }),
      errors: r.errors };
  }, { time, pose, draw });
}

async function png(page) {
  const bytes = await page.locator('#stage').screenshot();
  assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [720, 1280]);
  return bytes;
}

async function frame(page, state, file) {
  assert.deepEqual(state.errors, []);
  for (const { x, y, width, height } of state.bubbleBoxes) {
    assert(x >= 720 * .08 && x + width <= 720 * .92 && y >= 1280 * .08 && y + height <= 1280 * .92,
      `Bubble outside safe crop in ${file}`);
  }
  const bytes = await png(page);
  await writeFile(new URL(file + '.png', output), bytes);
  report.frames.push({ file: file + '.png', sha256: hash(bytes), ...state });
}

async function parity(profile, seed) {
  const previous = await open(baseline, profile, seed);
  const next = await open(candidate, profile, seed);
  for (const [name, time, pose] of [['presence', 8.6, poseA], ['gift', 17.43, undefined]]) {
    const before = await step(previous.page, time, pose);
    const after = await step(next.page, time, pose);
    assert.equal(before.revision, 'f22033b5a6f9bc7e34208d0ddcdf40ce2c0c1282');
    const a = hash(await png(previous.page));
    const b = hash(await png(next.page));
    assert.equal(a, b, `OFF parity ${profile} ${seed} ${name}`);
    report.pixelParity.push({ profile, seed, name, before: before.revision, after: after.revision, sha256: a });
    if (seed === 9) await frame(next.page, after, `${profile}-9-${name}-off`);
  }
  assert.deepEqual([...previous.exceptions, ...next.exceptions], []);
  await previous.page.close();
  await next.page.close();
}

async function gallery(profile, seed) {
  const { page, exceptions } = await open(candidate, profile, seed, true);
  const save = (name, state) => frame(page, state, `${profile}-${seed}-${name}`);
  if (seed === 9) {
    for (const [age, phase] of [[.2, 'read'], [1, 'read'], [1.5, 'float'], [2.1, 'float'], [2.8, undefined]]) {
      const state = await step(page, 8.4 + age, poseA);
      assert.equal(state.bubbles.chat?.phase, phase);
      assert.equal(state.remotePhotos, 0);
      if (phase) assert.equal(state.bubbles.chat.seatId, 'seat-1');
      if (age === .2) assert(state.badges > 0);
      await save(`chat-${age.toFixed(1)}s`, state);
    }
    assert.equal((await step(page, 12.6, poseB)).badges, 0);
    const long = await step(page, 13.6, poseB);
    assert.equal(long.bubbles.chat?.seatId, 'seat-2');
    await save('long-chat', long);
    const overflow = await step(page, 14.4, poseB);
    assert.equal(overflow.bubbles.chat, undefined);
    assert.equal(await page.locator('#stage .chat-bubble').count(), 0);
    await save('no-seat-chat', overflow);
    assert.equal((await step(page, 16.8)).bubbles.gift, undefined);
  }
  const first = await step(page, 17.43);
  assert.equal(first.bubbles.gift?.type, 'rosette');
  assert.equal(first.bubbles.gift.seatId, 'seat-1');
  assert.equal(first.bubbles.gift.count, profile === 'eco' ? 3 : 5);
  assert.equal(first.bubbles.chat, undefined);
  assert.match(first.labels.fallback, /Duyên/);
  await save('gift-early', first);
  if (seed === 9) {
    await save('gift-mid', await step(page, 17.95));
    const expired = await step(page, 18.7);
    assert.equal(expired.bubbles.gift, undefined);
    await save('gift-expired', expired);
    assert.deepEqual((await step(page, 40.05)).bubbles, {});
    const lantern = await step(page, 46.42);
    assert.equal(lantern.bubbles.gift?.type, 'lantern');
    await save('gift-lantern', lantern);
    const neutral = await step(page, 55.95);
    assert.equal(neutral.bubbles.gift?.type, 'neutral');
    await save('gift-neutral', neutral);
  }
  assert.deepEqual(exceptions, []);
  await page.close();
}

async function measure(profile, on) {
  const { page } = await open(candidate, profile, 9, on);
  await step(page, 8.6, poseA, false);
  const sample = await page.evaluate(({ pose }) => new Promise((resolve, reject) => {
    const cpu = [];
    const frames = [];
    let n = 0;
    let last;
    const tick = now => {
      try {
        const start = performance.now();
        const r = window.p08Review.step(8.6 + n / 60, true, undefined, undefined, undefined, pose);
        if (n >= 4) {
          cpu.push(performance.now() - start);
          frames.push(now - last);
        }
        last = now;
        if (++n < 16) return requestAnimationFrame(tick);
        const pct = (values, p) => values.toSorted((a, b) => a - b)[Math.ceil(p * values.length) - 1];
        resolve({ samples: frames.length, cpuMs: [pct(cpu, .5), pct(cpu, .95), pct(cpu, .99)],
          frameMs: [pct(frames, .5), pct(frames, .95), pct(frames, .99)], draws: r.drawCalls, triangles: r.trianglesDrawn,
          points: r.pointsDrawn, overlayNodes: document.querySelectorAll('#stage .avatar-badge,#stage .chat-bubble,#stage .gift-token').length,
          renderer: r.graphics, errors: r.errors, cpu, frames });
      } catch (error) { reject(error); }
    };
    requestAnimationFrame(tick);
  }), { pose: poseA });
  assert.deepEqual(sample.errors, []);
  report.performance.push({ profile, on, ...sample });
  await page.close();
}

async function recover(profile) {
  const { page } = await open(candidate, profile, 9, true);
  const before = await step(page, 17.43);
  assert.equal(before.bubbles.gift?.type, 'rosette');
  await page.evaluate(() => {
    const gl = document.querySelector('canvas').getContext('webgl2');
    const extension = gl.getExtension('WEBGL_lose_context');
    window.restoreBubbleTest = () => extension.restoreContext();
    extension.loseContext();
  });
  await page.waitForFunction(() => window.viewerReport.errors.includes('webglcontextlost'));
  assert.equal(await page.locator('.gift-token:not([hidden]),.chat-bubble:not([hidden]),.community-name:not([hidden])').count(), 0);
  await page.evaluate(() => window.restoreBubbleTest());
  await page.waitForFunction(() => window.viewerReport.contextRestores === 1);
  const after = await step(page, 17.5);
  assert.deepEqual(after.bubbles, {});
  assert.ok(after.badges > 0);
  const glError = await page.evaluate(() => document.querySelector('canvas').getContext('webgl2').getError());
  assert.equal(glError, 0);
  report.recovery.push({ profile, glError, before: before.bubbles, after: after.bubbles,
    canvasLostEvent: after.errors.includes('webglcontextlost') });
  await page.close();
}

async function movingNameplates(profile, seed, scenario) {
  const { page, exceptions, externalRequests } = await open(candidate, profile, seed, true, '', scenario);
  const isCommunity = scenario === 'community';
  const points = isCommunity
    ? [8.6, 9.9, 10.5, 12.22, 12.5, 13.6, 14.4, 16.35, 16.85, 17.43, 18.1, 21.87, 22.35, 23.25, 40.05, 46.42, 47.2, 53, 55.95]
    : [47.4, 52.3, 55.75, 61.35, 63.5, 66, 67.2];
  const rows = [];
  for (const [i, time] of points.entries()) {
    const batch = await page.evaluate(({ previous, time }) => {
      const rows = [];
      const review = window.p08Review;
      const stage = document.querySelector('#stage');
      const watched = window.r1Watched ??= [...stage.querySelectorAll('.persistent-nameplate')];
      const start = Math.floor(previous * 60 + 1e-6) + 1;
      const times = [];
      for (let tick = start; tick / 60 < time - 1e-6; tick++) times.push(tick / 60);
      times.push(time);
      for (const t of times) {
        const r = review.step(t, t === time);
        const rect = stage.getBoundingClientRect();
        const labels = [];
        for (const node of stage.querySelectorAll('.persistent-nameplate:not([hidden])')) {
          const { x, bottom, width } = node.getBoundingClientRect();
          const p = r.nameplates[node.dataset.seat];
          const center = x + width / 2 - rect.left;
          const base = bottom - rect.top;
          labels.push({ seat: node.dataset.seat, actor: node.dataset.actor, slotNode: watched.indexOf(node),
            head: [p.head.x * rect.width, p.head.y * rect.height],
            anchor: [p.anchor.x * rect.width, p.anchor.y * rect.height], center, base,
            room: r.roomSessionId });
        }
        const expected = Object.values(r.nameplates ?? {}).filter(p => p.visible).map(p => p.actorId);
        rows.push({ t, mode: r.mode, position: r.position, fov: r.fov, chat: r.bubbles?.chat?.phase,
          gift: r.bubbles?.gift?.type, fallback: r.labels?.fallback, labels, expected,
          oldGiftName: !!stage.querySelector('#gift-name'), chatNodes: stage.querySelectorAll('.chat-bubble').length });
      }
      return rows;
    }, { previous: points[i - 1] ?? 0, time });
    for (const row of batch) {
      assert.equal(row.oldGiftName, false);
      assert.deepEqual(row.labels.map(l => l.actor).sort(), row.expected.sort());
      assert.equal(new Set(row.labels.map(l => l.actor)).size, row.labels.length);
      for (const l of row.labels) {
        assert(l.slotNode >= 0);
        assert(Math.abs(l.center - l.anchor[0]) <= .5 && Math.abs(l.base - l.anchor[1] + 4) <= .5,
          `${profile}/${seed} t=${row.t}: DOM detached from anchor ${JSON.stringify(l)}`);
        assert(l.base < l.head[1], `${profile}/${seed} t=${row.t}: label below head ${JSON.stringify(l)}`);
      }
    }
    rows.push(...batch);
    const state = await step(page, time);
    if (isCommunity && time === 14.4) assert.equal(batch.at(-1).chatNodes, 0);
    if (isCommunity && time === 17.43) {
      assert.match(batch.at(-1).fallback, /Duyên/);
      assert(batch.at(-1).labels.some(l => l.seat === state.focus));
    }
    await frame(page, state, `${profile}-${seed}-${scenario}-motion-${time.toFixed(2)}`);
  }
  const count = (mode, minimum = 1) => rows.filter(row => row.mode === mode && row.labels.length >= minimum).length;
  for (const mode of ['CINEMATIC', 'GIFT_TRANSITION', 'GIFT_FOCUS']) assert(count(mode) > 0);
  if (isCommunity) {
    assert(rows.some(row => row.labels.length >= 2));
    assert(rows.some(row => row.chat === 'read' && row.labels.length));
    assert(rows.some(row => row.chat === 'float' && row.labels.length));
  } else assert(count('CINE_RETURN') > 0);
  assert.deepEqual([...exceptions, ...externalRequests], []);
  const file = `${profile}-${seed}-${scenario}-motion.json`;
  await writeFile(new URL(file, output), JSON.stringify(rows.filter(row => row.t >= (isCommunity ? 8 : 46))) + '\n');
  report.motion.push({ profile, seed, scenario, file, samples: rows.length, maxLabels: Math.max(...rows.map(row => row.labels.length)),
    modesWithNames: Object.fromEntries(['CINEMATIC', 'GIFT_TRANSITION', 'GIFT_FOCUS', 'CINE_RETURN'].map(mode => [mode, count(mode)])) });
  await page.close();
}

try {
  for (const profile of ['eco', 'quality']) {
    for (const seed of [9, 71, 1337]) {
      await parity(profile, seed);
      await gallery(profile, seed);
      await movingNameplates(profile, seed, 'community');
      if (seed === 9) await movingNameplates(profile, seed, 'capacity');
      console.log(profile, seed, 'portrait evidence done');
    }
    const { page } = await open(candidate, profile, 9, true, '&source=live');
    const offline = await step(page, 18.1);
    assert.deepEqual(offline.bubbles, {});
    assert.deepEqual(offline.community, { actors: 0, slots: 12 });
    assert.equal(await page.evaluate(() => window.viewerReport.liveStatus), 'OFFLINE');
    assert.equal(offline.count, 0);
    report.offline.push({ profile, ...offline });
    await page.close();
    await recover(profile);
    await measure(profile, false);
    await measure(profile, true);
  }
  await writeFile(new URL('browser.json', output), JSON.stringify(report, null, 2) + '\n');
} finally {
  await browser.close();
}
