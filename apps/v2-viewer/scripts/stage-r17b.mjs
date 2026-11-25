import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, rmdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import manifest from '../src/sakura-r17b.json' with { type: 'json' };

const workspace = fileURLToPath(new URL('../', import.meta.url));
const runGit = (...args) => execFileSync('git', args, { cwd: workspace, maxBuffer: 12 * 1024 * 1024 });
const repository = 'https://github.com/nguyenbui5701/OnlinePagodaVer2.git';

function validGlb(data) {
  if (data.length < 28 || data.readUInt32LE(0) !== 0x46546c67 ||
    data.readUInt32LE(4) !== 2 || data.readUInt32LE(8) !== data.length) return false;
  const jsonLength = data.readUInt32LE(12);
  const bin = 20 + jsonLength;
  return jsonLength > 0 && jsonLength % 4 === 0 && bin + 8 < data.length &&
    data.readUInt32LE(16) === 0x4e4f534a && data.readUInt32LE(bin + 4) === 0x004e4942 &&
    data.readUInt32LE(bin) % 4 === 0 && bin + 8 + data.readUInt32LE(bin) === data.length;
}

export const readPair = git => readVerifiedPair(manifest, git);
export const stageR17b = (publicDir, git) => stageVerifiedPair(manifest, publicDir, git);

export function readVerifiedPair(manifest, git = runGit) {
  const { baselineCommit: commit, sourceRef, canonicalDirectory, profiles } = manifest;
  try { git('cat-file', '-e', commit + '^{commit}'); }
  catch {
    git('fetch', repository, sourceRef);
    git('cat-file', '-e', commit + '^{commit}');
  }
  return Object.values(profiles).map(expected => {
    const path = canonicalDirectory + '/' + expected.file;
    const key = commit + ':' + path;
    const gitBlob = git('rev-parse', '--verify', key).toString().trim();
    const data = git('cat-file', 'blob', key);
    const sha256 = createHash('sha256').update(data).digest('hex');
    if (gitBlob !== expected.gitBlob || data.length !== expected.bytes || sha256 !== expected.sha256 || !validGlb(data)) {
      throw new Error(`${manifest.revision} integrity check failed for ${key} (${gitBlob}, ${data.length} bytes, ${sha256})`);
    }
    return { file: expected.file, data, receipt: { path, commit, gitBlob, bytes: data.length, sha256 } };
  });
}

export function stageVerifiedPair(manifest, publicDir = join(workspace, 'public'), git = runGit) {
  const pair = readVerifiedPair(manifest, git);
  const directory = manifest.revision.toLowerCase();
  mkdirSync(publicDir, { recursive: true });
  const target = join(publicDir, directory);
  const lock = join(publicDir, '.' + directory + '-lock');
  mkdirSync(lock);
  let temp;
  let backedUp = false;
  try {
    temp = mkdtempSync(join(publicDir, '.' + directory + '-stage-'));
    const pending = join(temp, 'pair');
    const previous = join(temp, 'previous');
    mkdirSync(pending);
    for (const { file, data } of pair) writeFileSync(join(pending, file), data, { flag: 'wx' });
    if (existsSync(target)) {
      renameSync(target, previous);
      backedUp = true;
    }
    try { renameSync(pending, target); }
    catch (error) {
      if (backedUp) {
        renameSync(previous, target);
        backedUp = false;
      }
      throw error;
    }
    backedUp = false;
    return pair.map(item => item.receipt);
  } finally {
    // Keep the previous pair in the temporary directory if restoring it failed.
    if (temp && !backedUp) rmSync(temp, { recursive: true, force: true });
    rmdirSync(lock);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const receipt of stageR17b()) console.log(JSON.stringify(receipt));
}
