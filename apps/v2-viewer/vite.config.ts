import { execFileSync } from 'node:child_process';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  let revision = process.env.V2_REPO_REVISION ?? 'unknown';
  try {
    revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    if (execFileSync('git', ['status', '--porcelain', '--untracked-files=no', '--', '.'], { encoding: 'utf8' }).trim()) {
      revision += '-working-tree';
    }
  } catch {
    // A source archive may have no Git metadata.
  }
  return { base: './', preview: { cors: false }, define: { __REPO_REVISION__: JSON.stringify(revision) } };
});
