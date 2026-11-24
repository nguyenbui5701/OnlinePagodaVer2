import { execFile, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const synth = fileURLToPath(new URL('./synthesize.py', import.meta.url));

export function boundedProcess(executable, args, input, signal, env = process.env) {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const detached = process.platform !== 'win32';
    const child = spawn(executable, args, { env, detached, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
    const chunks = [];
    let bytes = 0;
    let failed = false;
    const stop = () => {
      if (failed) return;
      failed = true;
      if (!child.pid) return;
      if (detached) {
        try { process.kill(-child.pid, 'SIGKILL'); } catch {}
      } else execFile('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, timeout: 1000 },
        error => { if (error) child.kill(); });
    };
    child.once('error', () => reject(new Error('python-unavailable')));
    child.once('close', code => {
      signal.removeEventListener('abort', stop);
      const failures = { 69: 'service-unreachable', 75: 'service-http-failure', 77: 'disabled', 78: 'dependency-unavailable' };
      if (failed || code !== 0) reject(new Error(failed ? 'synthesis-failed' : failures[code] ?? 'synthesis-failed'));
      else resolve(Buffer.concat(chunks));
    });
    child.stdout.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > 192000) stop();
      else if (!failed) chunks.push(chunk);
    });
    child.stdin.on('error', () => {});
    signal.addEventListener('abort', stop, { once: true });
    child.stdin.end(input, 'utf8');
    if (signal.aborted) stop();
  });
}

export function demoEnabled(env = process.env) {
  return env.V2_GTTS_DEMO_ENABLED === '1';
}

export function synthesize(template, signal) {
  if (!demoEnabled()) return Promise.reject(new Error('disabled'));
  const env = { ...process.env, V2_GTTS_DEMO_ENABLED: '1' };
  delete env.V2_TTS_TOKEN;
  return boundedProcess(env.TTS_PYTHON || 'python', [synth], JSON.stringify(template), signal, env);
}
