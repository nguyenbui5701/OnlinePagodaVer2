import type { Cue, GiftSound } from './director.ts';

const names = new Map([['An', 'an'], ['B\u00ecnh', 'binh'], ['Chi', 'chi'], ['Duy\u00ean', 'duyen']] as const);
export type NameId = 'an' | 'binh' | 'chi' | 'duyen';
export function demoName(value: string): NameId | undefined {
  for (const [name, id] of names) if (value.normalize('NFC') === name) return id;
}

export type VoiceTemplate = { nameId: NameId; gift: Exclude<GiftSound, 'generic'>; count: number };
export type NamedProvider = (template: VoiceTemplate, signal: AbortSignal) => Promise<Uint8Array>;
export const sampleRate = 24_000;
export const maxPcmBytes = 4 * sampleRate * 2;

export function decodeNamedPcm(bytes: Uint8Array, limit = maxPcmBytes): Float32Array {
  if (bytes.length < 4800 || bytes.length > limit || bytes.length % 2) throw new Error('invalid-pcm');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const samples = new Float32Array(bytes.length / 2);
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const sample = view.getInt16(i * 2, true) / 32768;
    samples[i] = sample;
    peak = Math.max(peak, Math.abs(sample));
  }
  if (peak < .01 || peak >= 32767 / 32768) throw new Error('invalid-pcm');
  return samples;
}

type Entry = {
  cue: Cue;
  request: AbortController;
  state: 'pending' | 'ready' | 'failed';
  samples?: Float32Array;
};

export class NamedVoice {
  private readonly entries = new Map<string, Entry>();
  readonly prepare: NamedProvider;

  constructor(prepare: NamedProvider) { this.prepare = prepare; }

  get pending() { return [...this.entries.values()].some(entry => entry.state === 'pending'); }

  prefetch(cue: Cue) {
    this.cancel(cue.request);
    if (!cue.binding || !cue.identity?.nameId || cue.sound === 'generic' || this.entries.size >= 20) return;
    const request = new AbortController();
    const entry: Entry = { cue, request, state: 'pending' };
    this.entries.set(cue.request, entry);
    const template = { nameId: cue.identity.nameId, gift: cue.sound, count: cue.identity.count };
    const timeout = setTimeout(() => {
      entry.state = 'failed';
      request.abort();
    }, 8000);
    void Promise.resolve().then(() => {
      request.signal.throwIfAborted();
      return this.prepare(template, request.signal);
    }).then(bytes => {
      if (request.signal.aborted || this.entries.get(cue.request) !== entry) return;
      entry.samples = decodeNamedPcm(bytes);
      entry.state = 'ready';
    }).catch(() => { entry.state = 'failed'; }).finally(() => clearTimeout(timeout));
    request.signal.addEventListener('abort', () => clearTimeout(timeout), { once: true });
  }

  pick(cue: Cue, now: number, availableMs: number, fallbackFitsAfterWait: boolean, waitUntil: number): Float32Array | 'waiting' | undefined {
    const entry = this.entries.get(cue.request);
    if (!entry || entry.cue !== cue || entry.state === 'failed') return;
    if (now >= waitUntil) return;
    if (entry.samples && entry.samples.length / sampleRate * 1000 <= availableMs) return entry.samples;
    if (entry.state === 'pending' && fallbackFitsAfterWait) return 'waiting';
  }

  clear() { for (const key of this.entries.keys()) this.cancel(key); }

  cancel(request: string) {
    this.entries.get(request)?.request.abort();
    this.entries.delete(request);
  }
}

export function loopbackVoice(token: string, report: (status: string) => void): NamedProvider {
  let blocked = false;
  return async (template, signal) => {
    if (blocked) throw new Error('voice-response');
    try {
      const response = await fetch('http://127.0.0.1:5202/demo-voice', {
        method: 'POST', redirect: 'error', credentials: 'omit', cache: 'no-store', signal,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(template),
      });
      if (!response.ok) {
        blocked = response.status === 503;
        report(blocked ? 'DYNAMIC_TTS_BLOCKED' : 'DYNAMIC_TTS_UNAVAILABLE');
        throw new Error('voice-response');
      }
      const length = Number(response.headers.get('Content-Length'));
      if (response.headers.get('Content-Type') !== 'application/octet-stream' ||
          !Number.isInteger(length) || length < 4800 || length > maxPcmBytes || !response.body) throw new Error('voice-format');
      const bytes = new Uint8Array(length);
      const stream = response.body.getReader();
      let offset = 0;
      for (;;) {
        const chunk = await stream.read();
        if (chunk.done) break;
        if (offset + chunk.value.length > length) { await stream.cancel(); throw new Error('voice-size'); }
        bytes.set(chunk.value, offset);
        offset += chunk.value.length;
      }
      if (offset !== length) throw new Error('voice-size');
      decodeNamedPcm(bytes);
      report('DYNAMIC_TTS_READY');
      return bytes;
    } catch (error) {
      if (!signal.aborted && !(error instanceof Error && error.message === 'voice-response')) report('DYNAMIC_TTS_UNAVAILABLE');
      throw error;
    }
  };
}
