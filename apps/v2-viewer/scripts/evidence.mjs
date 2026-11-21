import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { cpus, platform, release } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import manifest from '../src/sakura-r16.json' with { type: 'json' };

const source = process.argv[2];
const executablePath = process.env.V2_BROWSER;
if (!source || !executablePath) throw new Error('Set V2_BROWSER and pass the R16 Cycles reference directory.');
const output = resolve(process.env.V2_EVIDENCE_DIR || 'evidence');
await mkdir(output, { recursive: true });

const referenceHashes = {
  hero_full_9x16: '164c2c93c4172beb80b87816c43966165ce8896fae90df9a23715761a1fe8532',
  top: '9763b2d142bb3b86ca96a5318b7f9c4da931959e16e47cac4ef13981544b2005',
  under: '8cf48534950babc1eeb26668fb86ac99b5b21ece927f47f70dbac59f865eec24',
  three_quarter: '9ad8e5adde73ae3ef88ffe843b80b35f9400dd43b900acd9c6b468921c43526c',
};
const base = 'http://127.0.0.1:4177';
const server = await createServer({ server: { host: '127.0.0.1', port: 4177, strictPort: true }, logLevel: 'error' });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ executablePath, args: [
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling',
  ] });
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  const validate = async (params, height = 1280, profile = 'quality') => {
    await page.setViewportSize({ width: 720, height });
    await page.goto(`${base}/?profile=${profile}&clean=1&${params}`);
    await page.waitForFunction(() => window.viewerReport.drawCalls > 0 || window.viewerReport.errors.length,
      undefined, { timeout: 25000 });
    const report = await page.evaluate(() => window.viewerReport);
    assert.deepEqual(report.errors, []);
    assert.equal(report.asset.sha256, manifest.profiles[profile].sha256);
    assert.equal(report.asset.triangles, manifest.profiles[profile].triangles);
    assert.deepEqual(report.viewport, [720, height]);
    return report;
  };
  const inspect = {};
  const sheet = await browser.newPage({ viewport: { width: 1064, height: 960 } });
  for (const [view, expectedHash] of Object.entries(referenceHashes)) {
    const reference = await readFile(join(resolve(source), `r16_final_${view}_cycles.png`));
    assert.equal(createHash('sha256').update(reference).digest('hex'), expectedHash);
    inspect[view] = await validate(`view=${view}`, view.endsWith('_9x16') ? 1280 : 835);
    const native = await page.locator('#capture').screenshot({ animations: 'disabled' });
    await sheet.setContent(`<style>
      body{margin:0;background:#141019;color:white;font:16px system-ui}
      main{display:flex;width:max-content;padding:8px;gap:8px}
      figure{margin:0}figcaption{padding:8px}img{display:block;width:520px;height:auto}
      </style><main>
      <figure><figcaption>Blender Cycles · R16 QUALITY · ${view}</figcaption>
      <img src="data:image/png;base64,${reference.toString('base64')}"></figure>
      <figure><figcaption>Three.js GLTFLoader · SHA-verified R16 QUALITY · ${view}</figcaption>
      <img src="data:image/png;base64,${native.toString('base64')}"></figure></main>`);
    await sheet.locator('main').screenshot({ path: join(output, `pbr-${view}.png`) });
  }
  await sheet.close();
  const cinematic = [];
  for (const time of [0, 9, 15, 20, 33, 42]) {
    const report = await validate(`time=${time}`, 1280, 'eco');
    await page.locator('#capture').screenshot({ path: join(output, `cinematic-${time}s.png`) });
    cinematic.push({ time, shot: report.shot, position: report.position, target: report.target, fov: report.fov });
  }
  await validate('', 1280, 'eco');
  await page.waitForFunction(() => window.viewerReport.elapsedSeconds >= 46, undefined, { timeout: 90000 });
  const replay = await page.evaluate(() => window.viewerReport);
  assert.deepEqual(replay.visited, ['CLOSE', 'COMMUNITY', 'AERIAL', 'UNDER_TREE']);
  assert.equal(replay.shot, 'CLOSE');
  assert.deepEqual(replay.errors, []);
  assert.ok(replay.frameTiming.samples > 1);

  const assetRoute = '**/r16/sakura_hero_eco.glb';
  await page.route(assetRoute, route => route.fulfill({ status: 404 }));
  await page.goto(`${base}/?clean=1`);
  await page.waitForFunction(() => window.viewerReport.errors.some(message => message.includes('404')));
  await page.unroute(assetRoute);
  await page.route(assetRoute, route => route.fulfill({ body: Buffer.alloc(manifest.profiles.eco.bytes) }));
  await page.goto(`${base}/?clean=1`);
  await page.waitForFunction(() => window.viewerReport.errors.some(message => message.includes('SHA-256')));
  await page.unroute(assetRoute);
  assert.deepEqual(failures, []);

  const report = {
    environment: { platform: platform(), release: release(), cpu: cpus()[0]?.model, liveStudio: false,
      viewport: [720, 1280], graphicsMode: 'headless SwiftShader' },
    referenceHashes, nativeMaterialChecks: inspect.hero_full_9x16.asset,
    comparisonViews: Object.fromEntries(Object.entries(inspect).map(([name, view]) =>
      [name, { position: view.position, target: view.target, fov: view.fov, viewport: view.viewport }])),
    cinematic, replay, missingAndCorruptAssetRejected: true,
  };
  await writeFile(join(output, 'browser-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Captured 4 Cycles comparisons, 6 cinematic frames and ${replay.elapsedSeconds.toFixed(2)}s replay to ${output}`);
} finally {
  await browser?.close();
  await server.close();
}
