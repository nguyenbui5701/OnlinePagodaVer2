import { pathToFileURL } from 'node:url';
import manifest from '../src/environment-b9.json' with { type: 'json' };
import { stageVerifiedPair } from './stage-r17b.mjs';

export const stageB9 = (publicDir, git) => stageVerifiedPair(manifest, publicDir, git);
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const receipt of stageB9()) console.log(JSON.stringify(receipt));
}
