import { decodeNamedPcm, sampleRate } from './named-voice.ts';

const maxClip = 6 * sampleRate * 2;
const manifestLimit = 16_384;

async function readBounded(url: URL, limit: number, signal: AbortSignal, fetcher: typeof fetch) {
  const response = await fetcher(url, { signal, redirect: 'error', credentials: 'omit', cache: 'no-store' });
  if (!response.ok || !response.body) throw new Error('idle-corpus-fetch');
  const reader = response.body.getReader();
  const bytes = new Uint8Array(limit);
  let offset = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return bytes.subarray(0, offset);
      if (offset + value.length > limit) throw new Error('idle-corpus-size');
      bytes.set(value, offset);
      offset += value.length;
    }
  } finally {
    await reader.cancel();
  }
}

type Clip = { id: string; bytes: number; sha256: string; durationSec: number };

export async function loadIdleCorpus(signal: AbortSignal, base = location.origin, fetcher = fetch) {
  const root = new URL('/audio/vi-gtts-demo-v1/', base);
  const manifest = JSON.parse(new TextDecoder().decode(
    await readBounded(new URL('manifest.json', root), manifestLimit, signal, fetcher)
  ));
  if (manifest?.version !== 1 || manifest.source !== 'gTTS 2.5.4 / vi' || manifest.format !== 'pcm_s16le' ||
      manifest.sampleRate !== sampleRate || manifest.channels !== 1 || !Array.isArray(manifest.clips) ||
      manifest.clips.length < 12 || manifest.clips.length > 20) throw new Error('idle-corpus-manifest');
  const ids = new Set<string>();
  for (const clip of manifest.clips as Clip[]) {
    if (!clip || typeof clip.id !== 'string' || !/^wish-(0[1-9]|1[0-9]|20)$/.test(clip.id) || ids.has(clip.id) ||
        !Number.isInteger(clip.bytes) || clip.bytes < 4800 || clip.bytes > maxClip || clip.bytes % 2 ||
        clip.durationSec !== clip.bytes / (sampleRate * 2) || typeof clip.sha256 !== 'string' ||
        !/^[a-f0-9]{64}$/.test(clip.sha256)) throw new Error('idle-corpus-manifest');
    ids.add(clip.id);
  }
  const samples = new Map<string, Float32Array>();
  for (const clip of manifest.clips as Clip[]) {
    const pcm = await readBounded(new URL(clip.id + '.pcm', root), clip.bytes, signal, fetcher);
    const sha = await crypto.subtle.digest('SHA-256', pcm);
    const digest = Array.from(new Uint8Array(sha), byte => byte.toString(16).padStart(2, '0')).join('');
    if (pcm.byteLength !== clip.bytes || digest !== clip.sha256) throw new Error('idle-corpus-integrity');
    samples.set(clip.id, decodeNamedPcm(pcm, maxClip));
  }
  return samples;
}