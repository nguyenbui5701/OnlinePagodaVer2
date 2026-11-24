import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { Vector3 } from 'three';
import r16 from '../src/sakura-r16.json' with { type: 'json' };
import r17b from '../src/sakura-r17b.json' with { type: 'json' };

const base = '2f08d17d58f6bcd6093ca30ba3bad8f103219335';
const capture = process.env.V2_CAPTURE_REVISION;
assert.match(capture, /^[0-9a-f]{40}$/, 'Set V2_CAPTURE_REVISION to the clean candidate build source');
const before = process.env.V2_BASELINE_ORIGIN ?? 'http://127.0.0.1:5194';
const after = process.env.V2_CANDIDATE_ORIGIN ?? 'http://127.0.0.1:5189';
for (const origin of [before, after]) assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
const output = new URL('../evidence/p10b2-security/', import.meta.url);
const viewport = { width: 720, height: 1280 };
const browser = await chromium.launch({
  executablePath: process.env.V2_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const evidence = { base, capture, browser: browser.version(), viewport, matches: [], scenarios: [] };
const hash = data => createHash('sha256').update(data).digest('hex');

async function open(origin, profile, tree, scenario, offline = false, intercept) {
  const page = await browser.newPage({ viewport });
  const external = [];
  const errors = [];
  const treeRequests = [];
  const glb = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('response', res => {
    const url = new URL(res.url());
    if (url.origin === origin && url.pathname.endsWith('.glb')) glb.push({ path: url.pathname, status: res.status() });
  });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) {
      external.push(url.origin);
      await route.abort();
      return;
    }
    if (/^\/r(16|17b)\//.test(url.pathname)) treeRequests.push(url.pathname);
    if (intercept && url.pathname.startsWith('/r17b/')) await intercept(route, page);
    else await route.continue();
  });
  const query = new URLSearchParams({
    profile, seed: '9', look: 'twilight', clean: '1', inspect: '1', botanicals: 'on', diversity: 'on',
    blessing: 'on', presence: 'on', chatbubbles: 'on', gifticons: 'on', ambience: 'rich', seats: 'rings', shots: 'hero',
    ...(offline ? { source: 'live' } : { demo: scenario }), ...(tree === 'r17b' ? { tree } : {}),
  });
  await page.goto(`${origin}/?${query}`);
  return {
    page, treeRequests, glb,
    async close() {
      await page.close();
      assert.deepEqual(external, []);
      assert.deepEqual(errors, []);
    },
  };
}

async function ready(page, revision, profile, tree) {
  await page.waitForFunction(() => window.p08Review || window.viewerReport?.errors.length);
  const state = await page.evaluate(() => window.viewerReport);
  const pin = tree === 'r17b' ? r17b : r16;
  assert.deepEqual(state.errors, []);
  assert.equal(state.repoRevision, revision);
  assert.equal(state.asset.assetRevision, pin.revision);
  assert.equal(state.asset.profile, profile);
  assert.equal(state.asset.sha256, pin.profiles[profile].sha256);
  await page.addStyleTag({ content: '#gift-fx { animation: none }' });
  return state;
}

async function step(page, t, pose) {
  return page.evaluate(({ t, pose }) => {
    const first = Math.floor((window.viewerReport.elapsedSeconds ?? 0) * 60 + 1e-6) + 1;
    for (let i = first; i / 60 < t - 1e-6; i++) window.p08Review.step(i / 60, false);
    return window.p08Review.step(t, true, undefined, undefined, undefined, pose);
  }, { t, pose });
}

async function shot(run, label, state) {
  assert.deepEqual(state.errors, []);
  const png = await run.page.locator('#stage').screenshot();
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [viewport.width, viewport.height]);
  await writeFile(new URL(label, output), png);
  return { label, sha256: hash(png), source: state.repoRevision, asset: state.asset.sha256, shot: state.shot,
    time: state.elapsedSeconds, mode: state.mode, position: state.position, target: state.target, fov: state.fov };
}

async function collect(origin, revision, profile, tree, suffix) {
  const frames = {};
  for (const scenario of ['idle', 'community', 'capacity']) {
    const run = await open(origin, profile, tree, scenario);
    try {
      await ready(run.page, revision, profile, tree);
      const save = async (label, state) => {
        frames[label] = await shot(run, `${profile}-${tree}-${label}-${suffix}.png`, state);
      };
      const expected = (tree === 'r17b' ? r17b : r16).profiles[profile];
      assert.deepEqual(run.treeRequests, [`/${tree}/${expected.file}`]);
      assert(run.glb.some(r => r.path === run.treeRequests[0] && r.status === 200));

      if (scenario === 'idle') {
        for (const [label, t, actual] of [
          ['wide', 1, 'HERO_WIDE_TREE_REFLECTION'], ['top', 22, 'HERO_TOP_RING'], ['under', 35, 'UNDER_TREE'],
        ]) {
          const state = await step(run.page, t);
          assert.equal(state.shot, actual);
          await save(label, state);
        }
      } else if (scenario === 'community') {
        const first = await step(run.page, 1);
        const [x, , z] = first.communityLayout[0].position;
        const [tx, , tz] = first.treeTarget;
        const radial = new Vector3(x - tx, 0, z - tz).normalize();
        const position = new Vector3(x, 1.5, z).addScaledVector(radial, -4.8);
        const pose = { position: position.toArray(), target: [x, .86, z], fov: 43 };
        const actor = await step(run.page, 8.6, pose);
        assert.equal(actor.bubbles?.chat?.seatId, 'seat-1');
        assert(actor.community.names.some(n => n.seatId === 'seat-1'));
        await save('actor-chat', actor);
        const floating = await step(run.page, 10, pose);
        assert.equal(floating.bubbles?.chat?.phase, 'float');
        assert(floating.community.names.some(n => n.seatId === 'seat-1'));
        await save('chat-float', floating);
      } else {
        const trace = await run.page.evaluate(() => {
          const fifo = [];
          let maxSeats = 0;
          let decorativeAtCapacity;
          for (let i = 0; i <= 63.5 * 60; i++) {
            const r = window.p08Review.step(i / 60, false);
            const { realActors, slots } = r.community;
            if (realActors > maxSeats) {
              maxSeats = realActors;
              decorativeAtCapacity = slots.filter(s => s.kind === 'DECORATIVE_ANONYMOUS').length;
            }
            if (r.mode === 'GIFT_FOCUS' && r.focus && fifo.at(-1)?.request !== r.focus.requestId) {
              fifo.push({ request: r.focus.requestId, seat: r.focus.seatId, at: i / 60 });
            }
          }
          return { fifo, maxSeats, decorativeAtCapacity };
        });
        assert.deepEqual(trace.fifo.map(f => f.seat), ['seat-1', 'seat-2', 'seat-3']);
        assert.equal(trace.maxSeats, 3);
        assert.equal(trace.decorativeAtCapacity, 9);
        const gift = await step(run.page, 63.5);
        assert.equal(gift.mode, 'GIFT_FOCUS');
        await save('gift', gift);
        const returning = await step(run.page, 64.1);
        assert.equal(returning.mode, 'CINE_RETURN');
        await save('return', returning);
        evidence.scenarios.push({ profile, tree, source: revision, scenario, externalRequests: 0, ...trace });
      }
    } finally {
      await run.close();
    }
  }
  return frames;
}

async function fallbackAndOffline(profile) {
  for (const mode of ['missing', 'abort', 'offline']) {
    const intercept = mode === 'offline' ? undefined : async (route, page) => {
      if (mode === 'abort') {
        await page.evaluate(() => {
          window.dispatchEvent(new PageTransitionEvent('pagehide'));
          window.securityAbort = true;
        });
        await route.abort();
      } else await route.fulfill({ status: 404 });
    };
    const run = await open(after, profile, 'r17b', 'idle', mode === 'offline', intercept);
    try {
      const candidatePath = '/r17b/' + r17b.profiles[profile].file;
      if (mode === 'abort') {
        await run.page.waitForFunction(() => window.securityAbort);
        const state = await run.page.evaluate(() => window.viewerReport);
        assert.equal(state.repoRevision, capture);
        assert.equal(state.asset, undefined);
        assert.deepEqual(state.errors, []);
        assert.deepEqual(run.treeRequests, [candidatePath]);
        evidence.scenarios.push({ profile, mode, requests: run.treeRequests, assetAttached: false, externalRequests: 0 });
      } else {
        const state = await ready(run.page, capture, profile, mode === 'missing' ? 'r16' : 'r17b');
        if (mode === 'missing') {
          assert.match(state.asset.fallbackReason, /404/);
          assert.equal(state.asset.requestedRevision, 'R17B');
          assert.deepEqual(run.treeRequests, [candidatePath, '/r16/' + r16.profiles[profile].file]);
          const frame = await shot(run, `${profile}-fallback.png`, await step(run.page, 1));
          assert.equal(frame.sha256, evidence.matches.find(m => m.profile === profile && m.tree === 'r16' && m.label === 'wide').candidate.sha256);
          evidence.scenarios.push({ profile, mode, requests: run.treeRequests, frame, externalRequests: 0 });
        } else {
          const offline = await step(run.page, 18.1);
          assert.equal(offline.liveStatus, 'OFFLINE');
          assert.equal(offline.community.realActors, 0);
          assert.equal(offline.community.slots.length, 12);
          assert.equal(offline.confirmedGiftCount, 0);
          evidence.scenarios.push({ profile, mode, status: offline.liveStatus, realActors: 0, confirmedGifts: 0, externalRequests: 0 });
        }
      }
    } finally {
      await run.close();
    }
  }
}

try {
  await mkdir(output, { recursive: true });
  for (const profile of ['eco', 'quality']) {
    for (const tree of ['r16', 'r17b']) {
      const baseline = await collect(before, base, profile, tree, 'baseline');
      const candidate = await collect(after, capture, profile, tree, 'candidate');
      for (const label of Object.keys(baseline)) {
        assert.equal(candidate[label].sha256, baseline[label].sha256, `${profile}/${tree}/${label} pixels differ`);
        evidence.matches.push({ profile, tree, label, baseline: baseline[label], candidate: candidate[label] });
      }
      console.log(`${profile} ${tree}: seven matched native shots`);
    }
    await fallbackAndOffline(profile);
  }
  await writeFile(new URL('browser.json', output), JSON.stringify(evidence, null, 2) + '\n');
} finally {
  await browser.close();
}
