import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { defineConfig, type UserConfig } from 'vite';
import { localCaptureBoundary, loopback } from './local-capture-boundary.ts';

export default defineConfig((): UserConfig => {
  let revision = process.env.V2_REPO_REVISION ?? 'unknown';
  try {
    revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    if (execFileSync('git', ['status', '--porcelain', '--untracked-files=no', '--', '.'], { encoding: 'utf8' }).trim()) {
      revision += '-working-tree';
    }
  } catch {
    // A source archive may have no Git metadata.
  }

  const local = { host: loopback, cors: false, strictPort: true, allowedHosts: [] };
  return {
    base: '/',
    build: {
      rollupOptions: {
        input: ['index.html', 'dashboard/index.html', 'overlay/index.html']
          .map(path => fileURLToPath(new URL(path, import.meta.url))),
      },
    },
    plugins: [localCaptureBoundary()],
    server: {
      ...local,
      ws: false,
      hmr: false,
      fs: {
        strict: true,
        allow: [
          fileURLToPath(new URL('./', import.meta.url)),
          fileURLToPath(new URL('../../packages/v2-events/src/', import.meta.url)),
        ],
      },
    },
    preview: { ...local, port: 5189 },
    define: { __REPO_REVISION__: JSON.stringify(revision) },
  };
});
