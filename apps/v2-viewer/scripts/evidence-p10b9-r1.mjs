import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import b9 from '../src/environment-b9.json' with { type: 'json' };
import r16 from '../src/sakura-r16.json' with { type: 'json' };
import r17b from '../src/sakura-r17b.json' with { type: 'json' };
import r18a from '../src/sakura-r18a.json' with { type: 'json' };
import p08 from '../src/p08-assets.json' with { type: 'json' };
import p012b from '../src/p012b-botanicals.json' with { type: 'json' };
import p012d from '../src/p012d-actors.json' with { type: 'json' };

const execution = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const appDiff = execFileSync('git', ['status', '--porcelain', '--untracked-files=no', '--', '.'], { encoding: 'utf8' }).trim();
assert.equal(appDiff, '', 'Run the committed fixture from a clean Viewer checkout');
const output = resolve(process.env.V2_EVIDENCE_DIR ?? '../../packages/v2-live-gateway/evidence/p10b9/r1');
const origin = 'http://127.0.0.1:5197';
const fixed = { position: [0, 10, 44], target: [0, 9.5, 0], fov: 58 };
const pins = {};
const pin = ({ file, sha256, bytes }, kind, directory, commit) => {
  pins[sha256] = { file, kind, directory, commit, bytes };
};
for (const [revision, manifest] of Object.entries({ r16, r17b, r18a })) {
  for (const spec of Object.values(manifest.profiles)) pin(spec, 'tree', revision, manifest.baselineCommit);
}
for (const spec of Object.values(b9.profiles)) pin(spec, spec.kind === 'terrain' ? 'terrain' : spec.palette, 'b9', b9.baselineCommit);
pin(p08.pair.pad, 'pad', 'p08', p08.sources.pair.commit);
pin(p08.pair.actor, 'actor', 'p08', p08.sources.pair.commit);
pin(p012d.female, 'actor', 'p012d', p012d.source.commit);
for (const profile of Object.values(p012b.profiles)) {
  for (const [kind, spec] of Object.entries(profile)) pin(spec, kind, 'p012b', p012b.source.commit);
}

const receipt = { execution, reviewed: 'ecd48aa82eea32646a5acee072e9cb4b3d1ad1a5',
  node: process.version, habitat: [], fallback: [] };
let server;
let browser;
await mkdir(output, { recursive: true });

async function open(profile, { enabled = true, fault, missingTrees = [], seed = 9, density = 'lush', seats = 'rings' } = {}) {
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
  const errors = [];
  const fallbackMessages = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => {
    if (msg.text().includes('B9 environment fallback')) fallbackMessages.push(msg.text());
    if (/shader error|OUT_OF_MEMORY|INVALID_FRAMEBUFFER_OPERATION/i.test(msg.text())) errors.push(msg.text());
  });
  await page.addInitScript(config => { window.b9ProbeConfig = config; }, { pins, fault });
  await page.route(/\/src\/main\.ts(?:\?.*)?$/, async route => {
    const response = await route.fetch();
    assert(response.ok());
    await route.fulfill({ response, contentType: 'application/javascript',
      body: 'import { installProbe } from "/scripts/p10b9-r1-probe.mjs";\ninstallProbe();\n' + await response.text() });
  });
  for (const revision of missingTrees) {
    await page.route('**/' + revision + '/*.glb', route => route.fulfill({ status: 404 }));
  }
  let stagedMutation;
  if (fault?.kind === 'sha') {
    const spec = b9.profiles['koi_sanke_' + profile + '.glb'];
    const original = await readFile(resolve('public/b9', spec.file));
    const hash = bytes => createHash('sha256').update(bytes).digest('hex');
    assert.equal(hash(original), spec.sha256);
    const altered = Buffer.from(original);
    altered[altered.length - 8] ^= 1;
    stagedMutation = { file: spec.file, originalBytes: original.length, responseBytes: altered.length,
      expectedHash: spec.sha256, responseHash: hash(altered) };
    assert.equal(altered.length, original.length);
    assert.notEqual(stagedMutation.responseHash, stagedMutation.expectedHash);
    await page.route('**/b9/' + spec.file, route => route.fulfill({ contentType: 'model/gltf-binary', body: altered }));
  }
  const query = new URLSearchParams({ inspect: '1', clean: '1', profile, environment: enabled ? 'on' : 'off',
    tree: 'r18a', density, look: 'gold', seed: String(seed), demo: 'community', seats, shots: 'hero',
    presence: 'on', botanicals: 'on', diversity: 'on', ambience: 'rich' });
  await page.goto(origin + '/?' + query);
  await page.waitForFunction(() => window.p08Review || window.viewerReport?.errors.length, null, { timeout: 30_000 });
  const report = await page.evaluate(() => window.viewerReport);
  assert.deepEqual(report.errors, []);
  assert.equal(report.repoRevision, execution);
  return { page, report, errors, fallbackMessages, stagedMutation };
}

async function snapshot(page) {
  return page.evaluate(async fixed => {
    const r = window.p08Review.step(4, true, undefined, undefined, undefined, fixed);
    const gl = document.querySelector('canvas').getContext('webgl2');
    const rgba = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', rgba)), b =>
      b.toString(16).padStart(2, '0')).join('');
    return { hash, world: r.world, layout: r.lotusVisible, ambience: r.richAmbience, appearance: r.appearance,
      glError: gl.getError(), pond: !!r.pond, pondFx: !!r.pondFx };
  }, fixed);
}

try {
  server = await createServer({ server: { port: 5197 } });
  await server.listen();
  browser = await chromium.launch({ executablePath: process.env.V2_BROWSER ||
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  receipt.browser = browser.version();
  console.log(JSON.stringify({ execution, reviewed: receipt.reviewed, node: receipt.node, browser: receipt.browser }));
  for (const profile of ['eco', 'quality']) {
    for (const [index, missingTrees] of [[], ['r18a'], ['r18a', 'r17b']].entries()) {
      const { page, report, errors } = await open(profile, { missingTrees, seed: [9, 71, 1337][index],
        density: index === 1 ? 'legacy' : 'lush', seats: index === 2 ? 'default' : 'rings' });
      const measured = await page.evaluate(pose => window.b9Probe.stepAll(4, pose), fixed);
      measured.assets = await page.evaluate(() => window.b9Probe.parserCalls());
      assert.equal(measured.actualTree, ['R18A', 'R17B', 'R16'][index]);
      assert.equal(report.world.pond, true);
      assert.equal(measured.terrain.count, 30);
      assert.equal(measured.pad.realSeatPad.count, 15);
      assert.equal(measured.pad.anonymousPad.count, 45);
      assert.equal(measured.pad.bloom.count, report.botanicals.plants.filter(p => p.kind === 'bloom').length * 3);
      assert.equal(measured.pad.bud.count, report.botanicals.plants.filter(p => p.kind === 'bud').length * 2);
      if (report.lotusLayout) {
        assert.equal(measured.pad.padInstance.count, report.lotusLayout.instances.filter(p => p.kind === 'pad').length * 5);
        assert.equal(measured.pad.leafInstance.count, report.lotusLayout.instances.filter(p => p.kind === 'leaf').length * 5);
      }
      for (const [name, bounds] of Object.entries(measured.worldTransforms)) {
        assert(bounds.yOnly, name + ' must preserve vertical transforms');
        assert(measured.pad[name].minY >= measured.acrossSeeds[name] - 1e-6, name + ' fell outside the across-seed bound');
      }
      assert.deepEqual(errors, []);
      receipt.habitat.push(measured);
      console.log(JSON.stringify({ profile, actualTree: measured.actualTree, origin: measured.origin, fish: measured.fish,
        root: measured.tree.belowFishTopRadius, terrain: measured.terrain.nearestAabb, margins: measured.margins,
        worldTransforms: measured.worldTransforms }));
      await page.close();
    }

    const off = await open(profile, { enabled: false });
    const reference = await snapshot(off.page);
    assert.equal(reference.world.pond, undefined);
    assert.equal(reference.glError, 0);
    await off.page.close();
    for (const kind of ['sha', 'parser', 'structure']) {
      const test = await open(profile, { fault: { kind } });
      const outcome = await snapshot(test.page);
      const audit = await test.page.evaluate(() => ({
        calls: window.b9Probe.parserCalls().filter(call => call.directory === 'b9'),
        disposal: window.b9Probe.disposed(),
      }));
      const code = kind === 'parser' ? 'IMPORT' : 'INTEGRITY';
      assert.deepEqual(outcome, { ...reference, world: { ...reference.world, pond: ['sanke', code] } });
      assert.deepEqual(test.errors, []);
      const rejection = audit.calls.find(call => call.kind === 'sanke');
      if (kind === 'sha') {
        assert.equal(rejection, undefined);
        assert(test.fallbackMessages.some(message => message.includes('SHA-256')));
      } else if (kind === 'parser') {
        assert(rejection?.parserError && !rejection.parsed);
      } else {
        assert(rejection?.parsed && rejection.structureInjection);
        assert(test.fallbackMessages.some(message => message.includes('runtime structure')));
      }
      const expected = kind === 'structure' ? ['kohaku', 'sanke', 'terrain', 'yamabuki'] : ['kohaku', 'terrain', 'yamabuki'];
      assert.deepEqual(audit.disposal.map(asset => asset.kind).sort(), expected);
      for (const asset of audit.disposal) for (const counts of Object.values(asset.counts)) {
        assert.equal(counts.disposed, counts.objects);
      }
      const details = { profile, kind, stagedMutation: test.stagedMutation,
        status: outcome.world.pond, referenceHash: reference.hash, actualHash: outcome.hash,
        diagnostic: test.fallbackMessages, ...audit };
      receipt.fallback.push(details);
      console.log(JSON.stringify(details));
      await test.page.close();
    }
  }
  await writeFile(resolve(output, 'focused.json'), JSON.stringify(receipt, null, 2) + '\n');
  assert(receipt.habitat.every(x => Object.values(x.margins).every(margin => margin > 0)),
    'Measured obstacle overlaps the previously verified swept koi envelope');
  console.log('PASS: six loaded habitat combinations and six focused failure/disposal cases');
} finally {
  await browser?.close();
  await server?.close();
}
