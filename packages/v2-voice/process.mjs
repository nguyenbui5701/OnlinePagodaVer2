import { execFile, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const synth = fileURLToPath(new URL('./synthesize.py', import.meta.url));

export function boundedProcess(executable, args, input, signal) {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const detached = process.platform !== 'win32';
    const child = spawn(executable, args, { detached, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
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
    child.once('error', reject);
    child.once('close', code => {
      signal.removeEventListener('abort', stop);
      if (failed || code !== 0) reject(new Error('synthesis-failed'));
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

export function synthesize(template, signal) {
  return boundedProcess('python', [synth], JSON.stringify(template), signal);
}
