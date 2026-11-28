import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function launchWorker(username, message, exit, presence) {
  // Explicit child environment avoids inheriting TikTok sessions, provider keys or URL overrides.
  const env = Object.fromEntries(['Path', 'PATH', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP']
    .filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
  const child = fork(fileURLToPath(new URL('./worker.mjs', import.meta.url)), [], {
    env, execArgv: [], windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc']
  });
  let ready = false;
  const send = value => {
    if (child.connected) child.send(value, error => { if (error) exit(); });
  };
  child.on('message', value => {
    if (value?.type === 'ready') {
      ready = true;
      send({ type: 'connect', username, presence });
    }
    else message(value);
  });
  child.on('error', () => exit());
  child.once('exit', code => exit(code));
  const stop = () => new Promise(resolve => {
    if (child.exitCode !== null || child.signalCode !== null || !child.pid) { resolve(); return; }
    child.once('exit', resolve);
    child.kill();
  });
  stop.configurePresence = value => {
    presence = value;
    if (ready) send({ type: 'presence', presence });
  };
  return stop;
}
