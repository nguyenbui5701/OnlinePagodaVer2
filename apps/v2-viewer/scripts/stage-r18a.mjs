import { pathToFileURL } from 'node:url';
import manifest from '../src/sakura-r18a.json' with { type: 'json' };
import { readVerifiedPair, stageVerifiedPair } from './stage-r17b.mjs';

export const readR18a = git => readVerifiedPair(manifest, git);
export const stageR18a = (publicDir, git) => stageVerifiedPair(manifest, publicDir, git);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const receipt of stageR18a()) console.log(JSON.stringify(receipt));
}
