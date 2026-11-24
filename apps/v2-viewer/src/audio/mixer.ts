import type { Cue, GiftSound } from './director.ts';
import type { LiveAudioSettings } from '../live-audio-settings.ts';
import voicePins from './voice-pins.json' with { type: 'json' };

export type VoiceKey = GiftSound | 'generic-short';
const voiceKeys = ['rose', 'lantern', 'generic', 'generic-short'] as const;
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
  private readonly live: boolean;
  private liveSettings?: LiveAudioSettings;
  private readonly bellGain: GainNode;
  private readonly wishGain: GainNode;
  private readonly waterGain: GainNode;
  private readonly windGain: GainNode;
  private liveBeds = new Map<'water' | 'wind', AudioBufferSourceNode>();
  private prewarmed = false;
  private readonly buffers = new Map<VoiceKey, Loaded>();
  private readonly loading = new Set<VoiceKey>();
  private readonly abort = new AbortController();
  private readonly effects = new Set<AudioScheduledSourceNode>();
  private voice?: { source: AudioBufferSourceNode; cue: Cue; key: VoiceKey | 'named' };
  private bed?: AudioBufferSourceNode;
  private idle?: { source: AudioScheduledSourceNode; envelope: GainNode; id: string; kind: 'bell' | 'speech'; stopping?: boolean };
  private enabled = false;
  private ambience = false;
  private readonly volume = { ...levels };
  sceneMs = 0;

  readonly context: AudioContext;
  private readonly mark: (mark: AudioMark) => void;

  constructor(context: AudioContext, mark: (mark: AudioMark) => void, live = false) {
    this.live = live;
    this.context = context;
    this.mark = mark;
    this.voiceGain = context.createGain();
    this.sfxGain = context.createGain();
    this.ambienceGain = context.createGain();
    this.master = context.createGain();
    this.bellGain = context.createGain();
    this.wishGain = context.createGain();
    this.waterGain = context.createGain();
    this.windGain = context.createGain();
    this.bellGain.connect(this.master);
    this.wishGain.connect(this.master);
    this.waterGain.connect(this.ambienceGain);
    this.windGain.connect(this.ambienceGain);
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
    if (this.prewarmed) return;
    this.prewarmed = true;
    for (const key of this.live ? ['generic', 'generic-short'] as const : voiceKeys) {
      this.loading.add(key);
      void this.load(key);
    }
  }

  get availability() {
    const ready = this.buffers.size;
    const waiting = this.loading.size;
    const status: 'VOICE_LOADING' | 'READY' | 'VOICE_DEGRADED' | 'VOICE_UNAVAILABLE' = waiting ? 'VOICE_LOADING' : ready === (this.live ? 2 : voiceKeys.length) ? 'READY' :
      ready > 0 ? 'VOICE_DEGRADED' : 'VOICE_UNAVAILABLE';
    return { ready, waiting, playing: !!this.voice, status };
  }

  enable(enabled: boolean) {
    this.enabled = enabled;
    this.applyMaster();
    if (!enabled) { this.cut('muted'); this.stopIdle('output-off', true); }
    this.updateBed();
  }

  private applyMaster() {
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    if (this.enabled) this.master.gain.setTargetAtTime(.56 * (this.liveSettings?.master.volume ?? 100) / 100, now, .012);
    else if (this.live) this.master.gain.setValueAtTime(0, now);
    else this.master.gain.setTargetAtTime(0, now, .012);
  }

  configure(settings: LiveAudioSettings) {
    const previous = this.liveSettings;
    this.liveSettings = settings;
    if (previous?.giftChime.enabled && !settings.giftChime.enabled) this.stopEffects();
    if (previous?.giftThanks.enabled && !settings.giftThanks.enabled) this.stopVoice('channel-off');
    const idle = this.idle;
    if (idle && !settings[idle.kind === 'bell' ? 'idleBell' : 'idleWish'].enabled) this.stopIdle('channel-off', true);
    if (previous?.master.volume !== settings.master.volume) this.applyMaster();
    this.applyLevels();
    this.updateBed();
    if (settings.giftThanks.enabled) this.prewarm();
  }

  setLevel(bus: keyof MixLevels, value: number) {
    this.volume[bus] = Math.max(0, Math.min(1, value));
    this.applyLevels();
  }

  setAmbience(enabled: boolean) {
    this.ambience = enabled;
    this.updateBed();
  }

  get busy() { return !!this.voice || this.effects.size > 0; }

  sfx(cue?: Cue) {
    if (!this.enabled || (this.live && !this.liveSettings?.giftChime.enabled) || this.context.state !== 'running' || (!cue && (this.voice || this.effects.size))) return;
    const sound = cue?.sound ?? 'generic';
    const notes = notePitches[sound];
    if (this.effects.size + notes.length > 24) return;
    this.stopIdle(cue ? 'gift-sfx' : 'operator-test', true);
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

  fallbackFits(cue: Cue, availableMs: number) {
    return this.voiceChoices(cue).some(key => (this.buffers.get(key)?.seconds ?? Infinity) * 1000 <= availableMs);
  }

  voiceCue(cue: Cue, availableMs: number, named?: Float32Array): 'started' | 'waiting' | 'unavailable' | 'too-long' {
    if (!this.enabled || (this.live && !this.liveSettings?.giftThanks.enabled) || this.context.state !== 'running' || this.voice) return 'unavailable';
    if (named) {
      const buffer = this.pcmBuffer(named);
      return this.playVoice(cue, 'named', { buffer, seconds: buffer.duration });
    }
    const choices = this.voiceChoices(cue);
    let decoded = false;
    for (const key of choices) {
      const clip = this.buffers.get(key);
      if (!clip) continue;
      decoded = true;
      if (clip.seconds * 1000 <= availableMs) return this.playVoice(cue, key, clip);
    }
    if (choices.some(key => this.loading.has(key))) return 'waiting';
    return decoded ? 'too-long' : 'unavailable';
  }

  private voiceChoices(cue: Cue): VoiceKey[] {
    return !cue.binding ? ['generic-short'] :
      this.live ? ['generic', 'generic-short'] :
      cue.sound === 'generic' ? ['generic', 'generic-short'] : [cue.sound, 'generic', 'generic-short'];
  }

  private pcmBuffer(samples: Float32Array) {
    const buffer = this.context.createBuffer(1, samples.length, 24_000);
    buffer.getChannelData(0).set(samples);
    return buffer;
  }

  private playVoice(cue: Cue, key: VoiceKey | 'named', clip: Loaded) {
    this.stopIdle('gift-voice', true);
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
    return 'started' as const;
  }

  startIdle(id: string, samples?: Float32Array) {
    if (!this.enabled || this.context.state !== 'running' || this.busy || this.idle) return;
    if (samples && (!samples.length || samples.length > 144_000)) return;
    const now = this.context.currentTime;
    const envelope = this.context.createGain();
    const kind = samples ? 'speech' : 'bell';
    const source = samples ? this.context.createBufferSource() : this.context.createOscillator();
    if (source instanceof AudioBufferSourceNode && samples) source.buffer = this.pcmBuffer(samples);
    if (source instanceof OscillatorNode) {
      source.type = 'sine';
      source.frequency.value = [392, 440, 493.88, 523.25][Number(id.slice(-1)) % 4] ?? 440;
    }
    const duration = samples ? samples.length / 24_000 : 1.4;
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(samples ? 1 : .24, now + .035);
    if (!samples) envelope.gain.exponentialRampToValueAtTime(.0001, now + duration);
    source.connect(envelope).connect(this.live
      ? (samples ? this.wishGain : this.bellGain)
      : (samples ? this.voiceGain : this.sfxGain));
    this.idle = { source, envelope, id, kind };
    this.applyLevels();
    this.log('idle-start', undefined, id, duration);
    source.onended = () => {
      source.disconnect();
      envelope.disconnect();
      if (this.idle?.source !== source) return;
      this.idle = undefined;
      this.applyLevels();
      this.log('idle-end', undefined, id);
    };
    source.start(now);
    source.stop(now + duration);
  }

  stopIdle(reason: string, immediate = false) {
    const idle = this.idle;
    if (!idle || (idle.stopping && !immediate)) return;
    idle.stopping = true;
    const now = this.context.currentTime;
    const fade = immediate ? 0 : .030;
    idle.envelope.gain.cancelAndHoldAtTime(now);
    idle.envelope.gain.linearRampToValueAtTime(0, now + fade);
    idle.source.stop(now + fade);
    // Retain the source until its stop so an immediate gift cue can also stop any release tail.
    if (fade) idle.source.onended = () => {
      idle.source.disconnect();
      idle.envelope.disconnect();
      if (this.idle === idle) this.idle = undefined;
      this.applyLevels();
      this.log('idle-cut-end', undefined, idle.id, undefined, reason);
    };
    else this.idle = undefined;
    this.applyLevels();
    this.log('idle-cut', undefined, idle.id, fade, reason);
  }

  get idlePlaying() { return !!this.idle; }

  cut(reason: string) {
    this.stopVoice(reason);
    this.stopEffects();
  }

  private stopVoice(reason: string) {
    const voice = this.voice;
    if (voice) {
      this.voice = undefined;
      voice.source.stop();
      this.applyLevels();
      this.log('voice-cut', voice.cue, voice.key, undefined, reason);
    }
  }

  private stopEffects() {
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
      const url = new URL(`/audio/vi-v1-approved/${key}.voice.json`, location.origin);
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
    const duck = this.voice || this.idle?.kind === 'speech';
    if (this.liveSettings) {
      const cfg = this.liveSettings;
      this.voiceGain.gain.setTargetAtTime(cfg.giftThanks.volume / 100, now, .025);
      this.sfxGain.gain.setTargetAtTime(cfg.giftChime.volume / 100 * (duck ? .48 : 1), now, duck ? .020 : .10);
      this.ambienceGain.gain.setTargetAtTime(duck ? .28 : 1, now, duck ? .020 : .10);
      this.bellGain.gain.setTargetAtTime(cfg.idleBell.volume / 100, now, .025);
      this.wishGain.gain.setTargetAtTime(cfg.idleWish.volume / 100, now, .025);
      this.waterGain.gain.setTargetAtTime(cfg.water.volume / 100, now, .025);
      this.windGain.gain.setTargetAtTime(cfg.wind.volume / 100, now, .025);
      return;
    }
    this.voiceGain.gain.setTargetAtTime(this.volume.voice, now, .025);
    this.sfxGain.gain.setTargetAtTime(this.volume.sfx * (duck ? .48 : 1), now, duck ? .020 : .10);
    this.ambienceGain.gain.setTargetAtTime(this.volume.ambience * (duck ? .28 : 1), now, duck ? .020 : .10);
  }

  private updateBed() {
    if (this.live) {
      for (const channel of ['water', 'wind'] as const) {
        const bed = this.liveBeds.get(channel);
        if (this.enabled && this.liveSettings?.[channel].enabled) {
          if (!bed) this.liveBeds.set(channel, this.startBed(channel === 'water' ? this.waterGain : this.windGain, channel));
        } else if (bed) {
          bed.stop();
          bed.disconnect();
          this.liveBeds.delete(channel);
        }
      }
      return;
    }
    if (!this.enabled || !this.ambience) {
      const bed = this.bed;
      this.bed = undefined;
      if (bed) {
        bed.stop();
        bed.disconnect();
      }
      return;
    }
    this.bed ??= this.startBed(this.ambienceGain);
  }

  private startBed(output: GainNode, channel?: 'water' | 'wind') {
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
      samples[i] = ((channel === 'wind' ? 0 : .34 * water) + (channel === 'water' ? 0 : .26 * air)) * (.55 - .45 * Math.cos(phase));
    }
    const bed = this.context.createBufferSource();
    bed.buffer = buffer;
    bed.loop = true;
    bed.connect(output);
    bed.start();
    return bed;
  }

  private log(event: string, cue?: Cue, variant?: string, seconds?: number, reason?: string) {
    this.mark({ event, wallMs: performance.now(), sceneMs: this.sceneMs, contextSec: this.context.currentTime,
      room: cue?.room, request: cue?.request, actor: cue?.binding?.actorId, seat: cue?.binding?.seatId,
      effectSequence: cue?.sequence, variant, seconds, reason,
      ambienceGain: this.volume.ambience * (this.voice ? .28 : 1),
      sfxGain: this.volume.sfx * (this.voice ? .48 : 1) });
  }
}
