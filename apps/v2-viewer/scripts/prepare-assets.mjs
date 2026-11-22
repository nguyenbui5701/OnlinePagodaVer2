import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import manifest from '../src/sakura-r16.json' with { type: 'json' };

const source = process.argv[2];
if (!source) throw new Error(`Usage: npm run assets -- <directory containing ${manifest.canonicalDirectory} files>`);
const assets = await Promise.all(Object.values(manifest.profiles).map(async asset => {
  const path = join(resolve(source), asset.file);
  const bytes = await readFile(path);
  const sha = createHash('sha256').update(bytes).digest('hex');
  if (bytes.length !== asset.bytes || sha !== asset.sha256) throw new Error(`R16 mismatch: ${path} (${sha})`);
  return { asset, bytes };
}));
const destination = new URL('../public/r16/', import.meta.url);
await mkdir(destination, { recursive: true });
for (const { asset, bytes } of assets) {
  await writeFile(new URL(asset.file, destination), bytes);
  console.log(`${manifest.assetId} ${manifest.revision} ${asset.file} ${asset.sha256}`);
}
