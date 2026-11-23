import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import manifest from '../src/p012b-botanicals.json' with { type: 'json' };

const git = (...args) => execFileSync('git', args, { stdio: ['ignore', 'pipe', 'pipe'] });
const { commit, ref, canonicalDirectory } = manifest.source;
try {
  git('cat-file', '-e', `${commit}^{commit}`);
} catch {
  git('fetch', '--no-tags', 'https://github.com/nguyenbui5701/OnlinePagodaVer2.git', ref);
  const fetched = git('rev-parse', 'FETCH_HEAD').toString().trim();
  if (fetched !== commit) throw new Error(`PR #10 pin mismatch: expected ${commit}, fetched ${fetched}`);
}

// Verify all four inputs before touching the staging directory.
const verified = Object.values(manifest.profiles).flatMap(Object.values).map(asset => {
  const path = `${canonicalDirectory}/${asset.file}`;
  const key = `${commit}:${path}`;
  const data = git('cat-file', 'blob', key);
  const sha256 = createHash('sha256').update(data).digest('hex');
  if (data.length < 12 || data.length !== asset.bytes || sha256 !== asset.sha256 ||
      data.readUInt32LE(0) !== 0x46546c67 || data.readUInt32LE(4) !== 2 || data.readUInt32LE(8) !== data.length) {
    throw new Error(`P0.12-B asset integrity failure: ${key} (${data.length} bytes, ${sha256})`);
  }
  return { file: asset.file, data, log: { path, commit, gitBlob: git('rev-parse', key).toString().trim(),
    bytes: data.length, sha256, triangles: asset.triangles } };
});
const output = new URL('../public/p012b/', import.meta.url);
await mkdir(output, { recursive: true });
for (const { file, data, log } of verified) {
  await writeFile(new URL(file, output), data);
  console.log(JSON.stringify(log));
}
