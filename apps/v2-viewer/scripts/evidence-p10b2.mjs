import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const origin = 'http://127.0.0.1:5189';
const output = new URL('../evidence/p10b2/', import.meta.url);
const viewport = { width: 720, height: 1280 };
const executablePath = process.env.V2_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const results = [];
await mkdir(output, { recursive: true });

try {
  for (const profile of ['eco', 'quality']) {
    const page = await browser.newPage({ viewport });
    const failures = [];
    const foreignRequests = [];
    page.on('pageerror', error => failures.push(error.message));
    await page.route('**/*', route => {
      if (new URL(route.request().url()).origin === origin) return route.continue();
      foreignRequests.push(new URL(route.request().url()).origin);
      return route.abort();
    });
    const url = `${origin}/?demo=community&seed=9&profile=${profile}&look=twilight&botanicals=on&diversity=on&blessing=on&inspect=1`;
    const offline = url + '&source=live';
    await page.goto(offline);
    await page.waitForFunction(() => window.p08Review || window.viewerReport?.errors.length);
    assert.match(await page.locator('#live-status').innerText(), /^OFFLINE/);
    assert(await page.locator('#live-status').isVisible());
    await page.goto(offline + '&clean=1');
    await page.waitForFunction(() => window.p08Review || window.viewerReport?.errors.length);
    assert.equal(await page.locator('#live-status').isVisible(), false);
    const frames = [];

    async function capture(label, time, report) {
      assert.deepEqual(report.errors, []);
      const canvas = page.locator('#capture');
      assert.deepEqual(await canvas.evaluate(node => [node.width, node.height]), [720, 1280]);
      const png = await canvas.screenshot();
      assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [720, 1280]);
      const file = `${profile}-${label}.png`;
      await writeFile(new URL(file, output), png);
      frames.push({
        file, time, sha256: createHash('sha256').update(png).digest('hex'),
        source: report.liveStatus === 'OFFLINE' ? 'OFFLINE_LOCAL_WEBGL' : 'SYNTHETIC_TEST',
        shot: report.shot, mode: report.mode, focus: report.focus?.seatId,
        gifts: report.confirmedGiftCount, position: report.position,
      });
    }

    const checkpoints = [3, 14.5, 27];
    const shots = new Set();
    for (let tick = 0; tick <= 85 * 4; tick++) {
      const time = tick / 4;
      const draw = checkpoints.includes(time);
      const report = await page.evaluate(({ time, draw }) => window.p08Review.step(time, draw), { time, draw });
      assert.equal(report.liveStatus, 'OFFLINE');
      assert.equal(report.mode, 'CINEMATIC');
      assert.equal(report.confirmedGiftCount, 0);
      assert.equal(report.focus, undefined);
      assert.deepEqual([report.community.slots.length, report.community.realActors, report.community.viewerCount], [12, 0, 0]);
      assert.deepEqual(report.errors, []);
      shots.add(report.shot);
      if (draw) await capture(`offline-${time}`, time, report);
      if (time === 18) {
        const comparison = await page.evaluate(() => window.p08Review.step(18.1));
        assert.equal(comparison.confirmedGiftCount, 0);
        assert.equal(comparison.focus, undefined);
        await capture('offline-gift-checkpoint', 18.1, comparison);
      }
    }
    assert(shots.size >= 3);
    await page.goto(url + '&clean=1');
    await page.waitForFunction(() => window.p08Review || window.viewerReport?.errors.length);
    const review = await page.evaluate(() => {
      let report;
      for (let tick = 0; tick <= 1086; tick++) report = window.p08Review.step(tick / 60, tick === 1086);
      return report;
    });
    assert.equal(review.liveStatus, undefined);
    assert.equal(review.confirmedGiftCount, 3);
    assert.equal(review.focus?.seatId, 'seat-1');
    await capture('demo-gift', 18.1, review);
    assert.deepEqual(failures, []);
    assert.deepEqual(foreignRequests, []);
    results.push({ profile, viewport, virtualOfflineSeconds: 85, shots: [...shots], renderer: review.graphics,
      browser: browser.version(), revision: review.repoRevision, frames });
    await page.close();
  }
  await writeFile(new URL('browser.json', output), JSON.stringify(results, null, 2) + '\n');
} finally {
  await browser.close();
}
