import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function launchWorker(username, message, exit) {
  // Explicit child environment avoids inheriting TikTok sessions, provider keys or URL overrides.
  const env = Object.fromEntries(['Path', 'PATH', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP']
    .filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
  const child = fork(fileURLToPath(new URL('./worker.mjs', import.meta.url)), [], {
    env, execArgv: [], windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc']
  });
  child.on('message', value => {
    if (value?.type === 'ready') child.send({ type: 'connect', username }, error => { if (error) exit(); });
    else message(value);
  });
  child.on('error', () => exit());
  child.once('exit', code => exit(code));
  return () => new Promise(resolve => {
    if (child.exitCode !== null || child.signalCode !== null || !child.pid) { resolve(); return; }
    child.once('exit', resolve);
    child.kill();
  });
}