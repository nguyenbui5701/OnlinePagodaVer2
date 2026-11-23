import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import manifest from '../src/p012d-actors.json' with { type: 'json' };

const git = (...args) => execFileSync('git', args, { stdio: ['ignore', 'pipe', 'pipe'] });
const { commit, ref } = manifest.source;
try {
  git('cat-file', '-e', `${commit}^{commit}`);
} catch {
  git('fetch', '--no-tags', 'https://github.com/nguyenbui5701/OnlinePagodaVer2.git', ref);
  const fetched = git('rev-parse', 'FETCH_HEAD').toString().trim();
  if (fetched !== commit) throw new Error(`PR #2 pin mismatch: expected ${commit}, fetched ${fetched}`);
}
const { file, path, sha256: expectedHash, bytes } = manifest.female;
const key = `${commit}:${path}`;
const data = git('cat-file', 'blob', key);
const sha256 = createHash('sha256').update(data).digest('hex');
if (data.length < 12 || data.length !== bytes || sha256 !== expectedHash || data.readUInt32LE(0) !== 0x46546c67 ||
  data.readUInt32LE(4) !== 2 || data.readUInt32LE(8) !== bytes) {
  throw new Error(`P05f binary integrity failure: ${key}`);
}
const output = new URL('../public/p012d/', import.meta.url);
await mkdir(output, { recursive: true });
await writeFile(new URL(file, output), data);
console.log(JSON.stringify({ path, commit, gitBlob: git('rev-parse', key).toString().trim(), bytes, sha256 }));
