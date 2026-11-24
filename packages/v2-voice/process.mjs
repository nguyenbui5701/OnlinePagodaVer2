import { execFile, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./synthesize.py', import.meta.url));
const failures = { 69: 'service-unreachable', 75: 'service-http-failure', 77: 'disabled', 78: 'dependency-unavailable' };

function launch(executable, args, env) {
  const detached = process.platform !== 'win32';
  const child = spawn(executable, args, { env, detached, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
  const chunks = [];
  let bytes = 0;
  let failed = false;
  let closed = false;
  const stop = () => {
    if (failed || closed) return;
    failed = true;
    if (!child.pid) return;
    if (detached) {
      try { process.kill(-child.pid, 'SIGKILL'); } catch {}
    } else execFile('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, timeout: 1000 },
      error => { if (error) child.kill(); });
  };
  const result = new Promise((resolve, reject) => {
    child.once('error', () => reject(new Error('python-unavailable')));
    child.once('close', code => {
      closed = true;
      if (failed || code !== 0) reject(new Error(failed ? 'synthesis-failed' : failures[code] ?? 'synthesis-failed'));
      else resolve(Buffer.concat(chunks));
    });
    child.stdout.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > 192000) stop();
      else if (!failed) chunks.push(chunk);
    });
    child.stdin.on('error', () => {});
  });
  return {
    result, stop,
    async send(input, signal) {
      if (signal.aborted) stop();
      else if (!closed && !failed) child.stdin.end(input, 'utf8');
      signal.addEventListener('abort', stop, { once: true });
      try { return await result; }
      finally { signal.removeEventListener('abort', stop); }
    }
  };
}

export function boundedProcess(executable, args, input, signal, env = process.env) {
  signal.throwIfAborted();
  return launch(executable, args, env).send(input, signal);
}

export function demoEnabled(env = process.env) {
  return env.V2_GTTS_DEMO_ENABLED === '1';
}

export function createSynthesizer() {
  if (!demoEnabled()) return undefined;
  const env = { ...process.env, V2_GTTS_DEMO_ENABLED: '1' };
  delete env.V2_TTS_TOKEN;
  let ready;
  let idle;
  let closed = false;
  const warm = () => {
    // Import dependencies while idle. Python cannot synthesize until a validated template is sent.
    ready = launch(env.TTS_PYTHON || 'python', [script], env);
    void ready.result.catch(() => {});
    idle = setTimeout(() => { ready.stop(); ready = undefined; }, 120_000);
    idle.unref();
  };
  warm();
  return {
    async run(template, signal) {
      signal.throwIfAborted();
      if (!ready) warm();
      clearTimeout(idle);
      const job = ready;
      ready = undefined;
      try {
        return await job.send(JSON.stringify(template), signal);
      } finally {
        if (!closed) warm();
      }
    },
    close() {
      closed = true;
      clearTimeout(idle);
      ready?.stop();
    }
  };
}