import type { Cue, GiftSound } from './director.ts';
import voicePins from './voice-pins.json' with { type: 'json' };

export type VoiceKey = GiftSound | 'generic-short';
const clipSeconds: Record<VoiceKey, number> = { rose: 2.10, lantern: 2.10, generic: 2.10, 'generic-short': Infinity };
const notePitches = { rose: [523.25, 659.25, 783.99], lantern: [392, 587.33], generic: [440, 659.25] };
const levels = { voice: .85, sfx: .45, ambience: .20 };

export type MixLevels = typeof levels;
type Loaded = { buffer: AudioBuffer; seconds: number };
export type AudioMark = {
  event: string; wallMs: number; sceneMs: number; contextSec: number;
  room?: string; request?: string; actor?: string; seat?: string; effectSequence?: number;
  variant?: string; seconds?: number; reason?: string; ambienceGain?: number; sfxGain?: number;
};

export class Mixer {
  private readonly voiceGain: GainNode;
  private readonly sfxGain: GainNode;
  private readonly ambienceGain: GainNode;
  private readonly master: GainNode;
  private readonly buffers = new Map<VoiceKey, Loaded>();
  private readonly loading = new Set<VoiceKey>();
  private readonly abort = new AbortController();
  private readonly effects = new Set<AudioScheduledSourceNode>();
  private voice?: { source: AudioBufferSourceNode; cue: Cue; key: VoiceKey };
  private bed?: AudioBufferSourceNode;
  private enabled = false;
  private ambience = false;
  private readonly volume = { ...levels };
  sceneMs = 0;

  readonly context: AudioContext;
  private readonly mark: (mark: AudioMark) => void;

  constructor(context: AudioContext, mark: (mark: AudioMark) => void) {
    this.context = context;
    this.mark = mark;
    this.voiceGain = context.createGain();
    this.sfxGain = context.createGain();
    this.ambienceGain = context.createGain();
    this.master = context.createGain();
    this.voiceGain.gain.value = levels.voice;
    this.sfxGain.gain.value = levels.sfx;
    this.ambienceGain.gain.value = levels.ambience;
    this.master.gain.value = 0;
    for (const bus of [this.voiceGain, this.sfxGain, this.ambienceGain]) bus.connect(this.master);
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -12;
    compressor.knee.value = 10;
    compressor.ratio.value = 8;
    compressor.attack.value = .004;
    compressor.release.value = .16;
    this.master.connect(compressor);
    const ceiling = context.createWaveShaper();
    ceiling.curve = Float32Array.from({ length: 2049 }, (_, i) => Math.min(.87, Math.max(-.87, i / 1024 - 1)));
    compressor.connect(ceiling).connect(context.destination);
    this.applyLevels();
  }

  prewarm() {
    for (const key of ['rose', 'lantern', 'generic', 'generic-short'] as const) {
      if (this.loading.has(key) || this.buffers.has(key)) continue;
      this.loading.add(key);
      void this.load(key);
    }
  }

  get availability() { return { ready: this.buffers.size, waiting: this.loading.size, playing: !!this.voice }; }

  enable(enabled: boolean) {
    this.enabled = enabled;
    this.master.gain.setTargetAtTime(enabled ? .56 : 0, this.context.currentTime, .012);
    if (!enabled) this.cut('muted');
    this.updateBed();
  }

  setLevel(bus: keyof MixLevels, value: number) {
    this.volume[bus] = Math.max(0, Math.min(1, value));
    this.applyLevels();
  }

  setAmbience(enabled: boolean) {
    this.ambience = enabled;
    this.updateBed();
  }

  sfx(cue?: Cue) {
    if (!this.enabled || this.context.state !== 'running' || (!cue && (this.voice || this.effects.size))) return;
    const sound = cue?.sound ?? 'generic';
    const notes = notePitches[sound];
    if (this.effects.size + notes.length > 24) return;
    const now = this.context.currentTime;
    let remaining = notes.length;
    notes.forEach((pitch, i) => {
      const at = now + i * .095;
      const source = this.context.createOscillator();
      const envelope = this.context.createGain();
      source.type = 'sine';
      source.frequency.value = pitch;
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(.17, at + .024);
      envelope.gain.exponentialRampToValueAtTime(.0001, at + .55);
      source.connect(envelope).connect(this.sfxGain);
      this.effects.add(source);
      source.onended = () => {
        this.effects.delete(source);
        source.disconnect();
        envelope.disconnect();
        if (--remaining === 0) this.log(cue ? 'sfx-end' : 'test-end', cue, sound);
      };
      source.start(at);
      source.stop(at + .56);
    });
    this.log(cue ? 'sfx-start' : 'test-start', cue, sound, .56 + (notes.length - 1) * .095);
  }

  voiceCue(cue: Cue, availableMs: number): 'started' | 'waiting' | 'unavailable' | 'too-long' {
    if (!this.enabled || this.context.state !== 'running' || this.voice) return 'unavailable';
    const choices: VoiceKey[] = !cue.binding ? ['generic-short'] :
      cue.sound === 'generic' ? ['generic', 'generic-short'] : [cue.sound, 'generic', 'generic-short'];
    let decoded = false;
    for (const key of choices) {
      const clip = this.buffers.get(key);
      if (!clip) continue;
      decoded = true;
      if (clip.seconds * 1000 > availableMs) continue;
      const source = this.context.createBufferSource();
      source.buffer = clip.buffer;
      source.connect(this.voiceGain);
      this.voice = { source, cue, key };
      this.applyLevels();
      this.log('voice-start', cue, key, clip.seconds);
      source.onended = () => {
        source.disconnect();
        if (this.voice?.source !== source) return;
        this.voice = undefined;
        this.applyLevels();
        this.log('voice-end', cue, key);
      };
      source.start(0, 0, clip.seconds);
      return 'started';
    }
    if (choices.some(key => this.loading.has(key))) return 'waiting';
    return decoded ? 'too-long' : 'unavailable';
  }

  cut(reason: string) {
    const voice = this.voice;
    if (voice) {
      this.voice = undefined;
      voice.source.stop();
      this.applyLevels();
      this.log('voice-cut', voice.cue, voice.key, undefined, reason);
    }
    for (const source of this.effects) source.stop();
  }

  dispose() {
    this.abort.abort();
    this.enable(false);
    this.buffers.clear();
    if (this.context.state !== 'closed') void this.context.close().catch(() => {});
  }

  private async load(key: VoiceKey) {
    try {
      const url = new URL(`audio/vi-v1-approved/${key}.voice.json`, document.baseURI);
      const response = await fetch(url, { mode: 'same-origin', redirect: 'error', signal: this.abort.signal });
      if (!response.ok) throw new Error('audio-fetch');
      const expected = voicePins.profiles[key];
      const text = await response.text();
      const encodedLength = Math.ceil(expected.bytes / 3) * 4;
      if (text.length > encodedLength + 30) throw new Error('audio-size');
      const payload: unknown = JSON.parse(text).wavBase64;
      if (typeof payload !== 'string' || payload.length !== encodedLength) throw new Error('audio-size');
      const bytes = Uint8Array.from(atob(payload), character => character.charCodeAt(0));
      if (bytes.byteLength !== expected.bytes) throw new Error('audio-size');
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const sha = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
      if (sha !== expected.sha256) throw new Error('audio-integrity');
      const buffer = await this.context.decodeAudioData(bytes.buffer);
      if (buffer.duration > 6 || buffer.numberOfChannels !== 1) throw new Error('audio-format');
      if (this.abort.signal.aborted) return;
      const samples = buffer.getChannelData(0);
      const seconds = Math.min(clipSeconds[key], buffer.duration);
      let peak = 0;
      for (let i = 0; i < Math.min(samples.length, Math.floor(seconds * buffer.sampleRate)); i++) peak = Math.max(peak, Math.abs(samples[i]));
      if (!Number.isFinite(peak) || peak < .01) throw new Error('audio-silent');
      const gain = Math.min(2, .91 / peak);
      for (let i = 0; i < samples.length; i++) samples[i] *= gain;
      this.buffers.set(key, { buffer, seconds });
    } catch {
      if (!this.abort.signal.aborted) this.log('voice-asset-unavailable', undefined, key);
    } finally {
      this.loading.delete(key);
    }
  }

  private applyLevels() {
    const now = this.context.currentTime;
    this.voiceGain.gain.setTargetAtTime(this.volume.voice, now, .025);
    this.sfxGain.gain.setTargetAtTime(this.volume.sfx * (this.voice ? .48 : 1), now, this.voice ? .020 : .10);
    this.ambienceGain.gain.setTargetAtTime(this.volume.ambience * (this.voice ? .28 : 1), now, this.voice ? .020 : .10);
  }

  private updateBed() {
    if (!this.enabled || !this.ambience) {
      const bed = this.bed;
      this.bed = undefined;
      if (bed) {
        bed.stop();
        bed.disconnect();
      }
      return;
    }
    if (this.bed) return;
    const rate = this.context.sampleRate;
    const buffer = this.context.createBuffer(1, rate * 3, rate);
    const samples = buffer.getChannelData(0);
    let seed = 971;
    let water = 0;
    let air = 0;
    for (let i = 0; i < samples.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = seed / 2147483648 - 1;
      water += (noise - water) * .052;
      air += (water - air) * .018;
      const phase = i / samples.length * Math.PI * 2;
      samples[i] = (.34 * water + .26 * air) * (.55 - .45 * Math.cos(phase));
    }
    const bed = this.context.createBufferSource();
    bed.buffer = buffer;
    bed.loop = true;
    bed.connect(this.ambienceGain);
    bed.start();
    this.bed = bed;
  }

  private log(event: string, cue?: Cue, variant?: string, seconds?: number, reason?: string) {
    this.mark({ event, wallMs: performance.now(), sceneMs: this.sceneMs, contextSec: this.context.currentTime,
      room: cue?.room, request: cue?.request, actor: cue?.binding?.actorId, seat: cue?.binding?.seatId,
      effectSequence: cue?.sequence, variant, seconds, reason,
      ambienceGain: this.volume.ambience * (this.voice ? .28 : 1),
      sfxGain: this.volume.sfx * (this.voice ? .48 : 1) });
  }
}
