import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import integration from '../src/p08-assets.json' with { type: 'json' };
import sakura from '../src/sakura-r16.json' with { type: 'json' };

const git = (...args) => execFileSync('git', args, { maxBuffer: 12 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
const { sources, pair } = integration;
for (const source of Object.values(sources)) {
  try {
    git('cat-file', '-e', `${source.commit}^{commit}`);
  } catch {
    git('fetch', 'https://github.com/nguyenbui5701/OnlinePagodaVer2.git', source.ref);
    git('cat-file', '-e', `${source.commit}^{commit}`);
  }
}

const inputs = [
  ...Object.values(sakura.profiles).map(asset => ({
    ...asset, source: sources.sakura, path: `${sakura.canonicalDirectory}/${asset.file}`, directory: 'r16',
  })),
  ...Object.values(pair).map(asset => ({ ...asset, source: sources.pair, directory: 'p08' })),
];
const staged = inputs.map(asset => {
  const key = `${asset.source.commit}:${asset.path}`;
  const bytes = git('cat-file', 'blob', key);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (bytes.length !== asset.bytes || sha256 !== asset.sha256 || bytes.readUInt32LE(0) !== 0x46546c67 ||
      bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) {
    throw new Error(`P0.8 asset integrity failure: ${key} (${bytes.length} bytes, ${sha256})`);
  }
  return { asset, bytes, sha256, gitBlob: git('rev-parse', key).toString().trim() };
});
for (const { asset, bytes, sha256, gitBlob } of staged) {
  const output = new URL(`../public/${asset.directory}/`, import.meta.url);
  await mkdir(output, { recursive: true });
  await writeFile(new URL(asset.file, output), bytes);
  console.log(JSON.stringify({ path: asset.path, commit: asset.source.commit, gitBlob, bytes: bytes.length, sha256 }));
}
