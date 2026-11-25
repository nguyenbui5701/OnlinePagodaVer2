import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import manifest from '../src/environment-b9.json' with { type: 'json' };
import { stageB9 } from '../scripts/stage-b9.mjs';

test('B9 staging validates all eight source blobs and rejects a corrupted file without replacing the previous set', t => {
  const folder = mkdtempSync(join(tmpdir(), 'pagoda-b9-'));
  t.after(() => rmSync(folder, { force: true, recursive: true }));
  const runGit = (...args) => execFileSync('git', args, { maxBuffer: 2 * 1024 * 1024 });
  const receipts = stageB9(folder, runGit);
  assert.equal(receipts.length, 8);
  assert.throws(() => stageB9(folder, (...args) => {
    const data = runGit(...args);
    if (args[0] === 'cat-file' && args[1] === 'blob' && args[2].endsWith('terrain_quality.glb')) data[50] ^= 1;
    return data;
  }), /integrity/);
  assert.deepEqual(receipts.map(({ bytes }) => bytes),
    Object.keys(manifest.profiles).map(name => readFileSync(join(folder, 'b9', name)).length));
});
