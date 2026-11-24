import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { readPair, stageR17b } from '../scripts/stage-r17b.mjs';
import manifest from '../src/sakura-r17b.json' with { type: 'json' };

const profiles = Object.values(manifest.profiles);
const originals = new Map(profiles.map(profile => [profile.file, execFileSync('git',
  ['cat-file', 'blob', profile.gitBlob], { maxBuffer: 12 * 1024 * 1024 })]));
const virtualGit = ({ missingFile, wrongBlob, missingCommit, damage } = {}) => (command, ...args) => {
  if (command === 'fetch') return;
  if (command === 'cat-file' && args[0] === '-e') {
    if (missingCommit) throw new Error('missing pinned object');
    return;
  }
  const entry = profiles.find(profile => args.at(-1).endsWith('/' + profile.file));
  assert(entry);
  if (entry.file === missingFile) throw new Error('missing pinned path');
  if (command === 'rev-parse') return Buffer.from(entry.file === wrongBlob ? '0'.repeat(40) : entry.gitBlob);
  const bytes = Buffer.from(originals.get(entry.file));
  if (entry.file === damage) bytes[bytes.length - 1] ^= 1;
  return bytes;
};

test('staging requires exact commit, both paths, blob IDs and raw SHA-256', () => {
  assert.equal(readPair(virtualGit()).length, 2);
  assert.throws(() => readPair(virtualGit({ missingCommit: true })), /missing pinned object/);
  assert.throws(() => readPair(virtualGit({ missingFile: profiles[1].file })), /missing pinned path/);
  assert.throws(() => readPair(virtualGit({ wrongBlob: profiles[1].file })), /integrity/);
  assert.throws(() => readPair(virtualGit({ damage: profiles[1].file })), /integrity/);
});

test('invalid second asset leaves an existing verified pair unchanged', () => {
  const folder = mkdtempSync(join(tmpdir(), 'p10b3d-pair-'));
  try {
    stageR17b(folder, virtualGit());
    stageR17b(folder, virtualGit());
    assert.throws(() => stageR17b(folder, virtualGit({ damage: profiles[1].file })), /integrity/);
    assert.deepEqual(readdirSync(folder), ['r17b']);
    for (const profile of profiles) assert.deepEqual(readFileSync(join(folder, 'r17b', profile.file)), originals.get(profile.file));
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
