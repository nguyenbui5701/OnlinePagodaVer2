import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { stageR18a } from '../scripts/stage-r18a.mjs';
import manifest from '../src/sakura-r18a.json' with { type: 'json' };

test('R18a stages the immutable pair and a swapped profile cannot replace it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pagoda-r18a-'));
  const git = (...args) => execFileSync('git', args, { maxBuffer: 16 * 1024 * 1024 });
  try {
    const receipt = stageR18a(dir, git);
    assert.equal(receipt.length, 2);
    assert(receipt.every(item => item.commit === manifest.baselineCommit));
    const swapped = (...args) => args[0] === 'cat-file' && args[1] === 'blob' && args[2].endsWith('_eco.glb')
      ? git('cat-file', 'blob', manifest.profiles.quality.gitBlob) : git(...args);
    assert.throws(() => stageR18a(dir, swapped), /R18A integrity/);
    assert.deepEqual(readdirSync(dir), ['r18a']);
    for (const spec of Object.values(manifest.profiles)) {
      assert.deepEqual(readFileSync(join(dir, 'r18a', spec.file)), git('cat-file', 'blob', spec.gitBlob));
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
