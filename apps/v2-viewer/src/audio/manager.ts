import type { Snapshot } from '../../../../packages/v2-events/src/protocol.ts';
import { AudioDirector, type Binding, type Cue, type CueRecord } from './director.ts';
import { IdleBlessingDirector, idleGap, type IdleCue } from './idle-blessing.ts';
import { loopbackVoice, NamedVoice, type NamedProvider } from './named-voice.ts';
import { Mixer, type AudioMark, type MixLevels } from './mixer.ts';

type Status = 'LOCKED' | 'STARTING' | 'READY' | 'PLAYING' | 'MUTED' | 'BLOCKED' | 'UNAVAILABLE' |
  'DISCONNECTED' | 'VOICE_LOADING' | 'VOICE_DEGRADED' | 'VOICE_UNAVAILABLE';

type AudioOptions = {
  idle?: { seed: number; gap?: number };
  dynamic?: boolean;
  namedProvider?: NamedProvider;
  idleSpeech?: ReadonlyMap<string, Float32Array>;
};

const bells: IdleCue[] = [0, 1, 2, 3].map(i => ({ id: 'lotus-bell-' + i, kind: 'bell' }));

export class AudioManager {
  private named?: NamedVoice;
  private dynamic = 'DYNAMIC_TTS_BLOCKED';
  private readonly idle?: IdleBlessingDirector;
  private readonly speech?: ReadonlyMap<string, Float32Array>;
  private playBell = true;
  private playSpeech = false;
  private idlePool: IdleCue[] = bells;
  private readonly director: AudioDirector;
  private readonly marks: AudioMark[] = [];
  private mixer?: Mixer;
  private opening?: AudioContext;
  private release?: () => void;
  private disposed = false;
  private muted = true;
  private session?: { room: string; epoch: number; connected: boolean };
  private outputEnabled = false;
  private generation = 0;
  private readonly clock: () => number;
  private ambience = false;
  private levels: MixLevels = { voice: .85, sfx: .45, ambience: .20 };
  private readonly panel = document.createElement('section');
  private readonly action = document.createElement('button');
  private readonly test = document.createElement('button');
  private readonly message = document.createElement('p');
  private readonly statusText: Record<Status, string> = {
    LOCKED: 'Chờ thao tác bật âm thanh', STARTING: 'Đang mở âm thanh',
    READY: 'Sẵn sàng', PLAYING: 'Đang phát lời cảm ơn', MUTED: 'Đang tắt tiếng',
    DISCONNECTED: 'M\u1ea5t k\u1ebft n\u1ed1i ph\u00f2ng. \u00c2m thanh \u0111ang t\u1ea1m d\u1eebng',
    VOICE_LOADING: '\u00c2m thanh \u0111\u00e3 b\u1eadt. \u0110ang t\u1ea3i gi\u1ecdng \u0111\u1ecdc',
    VOICE_DEGRADED: '\u00c2m thanh \u0111\u00e3 b\u1eadt. Ch\u1ec9 c\u00f3 m\u1ed9t s\u1ed1 gi\u1ecdng \u0111\u1ecdc',
    VOICE_UNAVAILABLE: 'Gi\u1ecdng \u0111\u1ecdc kh\u00f4ng kh\u1ea3 d\u1ee5ng. Chu\u00f4ng v\u00e0 \u00e2m n\u1ec1n v\u1eabn d\u00f9ng \u0111\u01b0\u1ee3c',
    BLOCKED: 'Âm thanh đang được dùng ở tab khác', UNAVAILABLE: 'Âm thanh không khả dụng',
  };
  private status: Status = 'LOCKED';

  constructor(holdMs: number, clock: () => number, options: AudioOptions = {}) {
    this.clock = clock;
    this.idle = options.idle && new IdleBlessingDirector(options.idle.seed, options.idle.gap);
    this.speech = options.idleSpeech;
    if (options.namedProvider) {
      this.named = new NamedVoice(options.namedProvider);
      this.dynamic = 'DYNAMIC_TTS_FIXTURE';
    }
    this.director = new AudioDirector(holdMs, {
      sfx: cue => this.mixer?.sfx(cue),
      voice: (cue, available) => this.playGiftVoice(cue, available),
      prepare: cue => this.named?.prefetch(cue),
      discard: request => this.named?.cancel(request),
      cut: reason => this.mixer?.cut(reason),
    });
    this.panel.id = 'audio-controls';
    this.panel.setAttribute('aria-label', 'Điều khiển âm thanh DEMO');
    this.message.setAttribute('role', 'status');
    this.action.type = this.test.type = 'button';
    this.action.addEventListener('click', () => void this.toggle());
    this.test.textContent = 'Thử chuông';
    this.test.addEventListener('click', () => this.mixer?.sfx());
    this.panel.append(this.message, this.action, ' ', this.test);
    this.addLevels();
    if (options.idle) this.addIdleControls(options.idle.gap);
    if (options.dynamic) this.addDynamicControl();
    document.querySelector('main')!.after(this.panel);
    document.addEventListener('visibilitychange', this.visibility);
    this.show('LOCKED');
  }

  frame(state: Snapshot, delivery: { epoch: number; records: readonly CueRecord[] }, binding?: Binding) {
    if (this.mixer) this.mixer.sceneMs = state.atMs;
    const previous = this.session;
    const changed = previous && (previous.room !== state.roomSessionId || previous.epoch !== delivery.epoch ||
      previous.connected !== state.connected);
    this.session = { room: state.roomSessionId, epoch: delivery.epoch, connected: state.connected };
    if (changed) this.setOutput(false, state.connected ? 'session-change' : 'disconnect');
    // A frame spanning a session boundary may carry earlier cues. Resume past that entire batch.
    this.syncOutput(changed ? state.atMs : this.clock());
    const gift = this.idle && delivery.records.some(record => record.effect.type === 'giftFx' &&
      record.disposition === 'accepted' && record.room === state.roomSessionId);
    const idleAllowed = this.outputEnabled && !gift && state.camera.mode === 'CINEMATIC' && !state.focus &&
      state.camera.pendingGivers === 0 && this.director.queued === 0 && !this.named?.pending && !this.mixer?.busy;
    if (this.idle && (!idleAllowed || changed)) {
      this.idle.reset();
      this.mixer?.stopIdle(gift ? 'gift-activity' : 'idle-ineligible');
    }
    this.director.frame(state, delivery.epoch, delivery.records, binding);
    const idleCue = this.idle?.update(state.atMs, idleAllowed && !changed &&
      !this.mixer?.idlePlaying && !this.mixer?.busy && this.director.queued === 0, this.idlePool);
    if (idleCue) this.mixer?.startIdle(idleCue.id, this.speech?.get(idleCue.id));
    this.refreshStatus();
  }

  get report() {
    return { status: this.status, connected: this.session?.connected, outputEnabled: this.outputEnabled,
      sfxAvailable: this.outputEnabled, ambience: this.ambience && this.outputEnabled,
      queue: this.director.queued, marks: this.marks, suppressed: this.director.suppressed,
      voice: this.mixer?.availability, dynamic: this.dynamic,
      ...(this.idle ? { idle: { playing: this.mixer?.idlePlaying ?? false, bell: this.playBell,
        speech: this.speech?.size ? this.playSpeech : 'IDLE_SPEECH_LIBRARY_PENDING' } } : {}) };
  }

  suspend(reason: string) {
    this.generation++;
    this.muted = true;
    this.setOutput(false, reason);
    this.refreshStatus();
  }

  dispose() {
    this.disposed = true;
    this.suspend('dispose');
    this.release?.();
    if (this.opening) void this.opening.close().catch(() => {});
    this.mixer?.dispose();
    this.panel.remove();
    document.removeEventListener('visibilitychange', this.visibility);
  }

  private visibility = () => { if (document.hidden) this.suspend('hidden'); };

  private async toggle() {
    if (this.disposed || this.opening) return;
    const generation = this.generation;
    if (this.mixer) {
      if (!this.muted) { this.suspend('operator'); return; }
      try {
        await this.mixer.context.resume();
        if (!this.disposed && generation === this.generation && !document.hidden && this.mixer.context.state === 'running') this.activate();
        else if (!this.disposed) this.show('MUTED');
      } catch { this.show('UNAVAILABLE'); }
      return;
    }
    if (!navigator.locks || typeof AudioContext !== 'function') { this.show('UNAVAILABLE'); return; }
    let context: AudioContext;
    try {
      context = new AudioContext();
    } catch {
      this.show('UNAVAILABLE');
      return;
    }
    this.opening = context;
    this.show('STARTING');
    // Preserve the real gesture. This context has no nodes connected until the lock is granted.
    const resumed = context.resume().then(() => true, () => false);
    try {
      await navigator.locks.request('online-pagoda-v2-audio', { ifAvailable: true }, async lock => {
        if (!lock) { if (!this.disposed) this.show('BLOCKED'); return; }
        const ready = await resumed;
        if (this.disposed) return;
        if (generation !== this.generation) { this.show('LOCKED'); return; }
        if (!ready || context.state !== 'running' || document.hidden) { this.show('UNAVAILABLE'); return; }
        const hold = new Promise<void>(resolve => { this.release = resolve; });
        this.mixer = new Mixer(context, mark => {
          if (this.marks.length >= 128) this.marks.shift();
          this.marks.push(mark);
        });
        this.opening = undefined;
        context.addEventListener('statechange', () => {
          if (!this.disposed && context.state !== 'running') this.suspend('audio-context');
        });
        for (const bus of ['voice', 'sfx', 'ambience'] as const) this.mixer.setLevel(bus, this.levels[bus]);
        this.mixer.setAmbience(this.ambience);
        this.mixer.prewarm();
        this.activate();
        await hold;
      });
    } catch {
      if (!this.disposed) this.show('UNAVAILABLE');
    } finally {
      if (this.opening === context) this.opening = undefined;
      if (!this.owns(context) && context.state !== 'closed') void context.close().catch(() => {});
    }
  }

  private owns(context: AudioContext) { return this.mixer?.context === context; }

  private activate() {
    this.muted = false;
    this.syncOutput(this.clock());
    this.refreshStatus();
  }

  private syncOutput(watermark: number) {
    this.setOutput(!this.disposed && !this.muted && !document.hidden && this.session?.connected === true &&
      this.mixer?.context.state === 'running', 'enable', watermark);
  }

  private setOutput(enabled: boolean, reason: string, watermark?: number) {
    if (this.outputEnabled === enabled) return;
    this.outputEnabled = enabled;
    this.director.enable(enabled, reason, watermark);
    if (!enabled) {
      this.idle?.reset();
      this.named?.clear();
    }
    this.mixer?.enable(enabled);
  }

  private refreshStatus() {
    if (!this.mixer) return;
    if (this.session?.connected === false) { this.show('DISCONNECTED'); return; }
    if (!this.outputEnabled) { this.show(this.muted ? 'MUTED' : 'STARTING'); return; }
    const voice = this.mixer.availability;
    this.show(voice.playing ? 'PLAYING' : voice.status);
  }

  private show(status: Status) {
    this.status = status;
    const line = this.statusText[status];
    if (this.message.textContent !== line) this.message.textContent = line;
    this.action.disabled = status === 'STARTING';
    this.action.textContent = this.muted ? 'Bật âm thanh' : 'Tắt tiếng';
    this.test.disabled = !this.outputEnabled;
  }

  private playGiftVoice(cue: Cue, available: number) {
    const mixer = this.mixer;
    if (!mixer) return 'unavailable';
    const picked = this.named?.pick(cue, this.clock(), available, mixer.fallbackFits(cue, available - 350));
    if (picked === 'waiting') return 'waiting';
    return mixer.voiceCue(cue, available, picked);
  }

  private addIdleControls(gap?: number) {
    const checkbox = (text: string, checked: boolean, change: (value: boolean) => void) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = checked;
      input.addEventListener('change', () => {
        change(input.checked);
        this.idlePool = this.playBell ? [...bells] : [];
        if (this.playSpeech && this.speech) {
          for (const id of this.speech.keys()) this.idlePool.push({ id, kind: 'speech' });
        }
        this.idle?.reset();
        this.mixer?.stopIdle('idle-options', true);
      });
      label.append(input, text);
      this.panel.append(label);
      return input;
    };
    checkbox(' Chu\u00f4ng l\u00fac r\u1ea3nh', true, value => { this.playBell = value; });
    checkbox(this.speech?.size ? ' L\u1eddi ch\u00fac l\u00fac r\u1ea3nh' :
      ' L\u1eddi ch\u00fac l\u00fac r\u1ea3nh (ch\u1edd duy\u1ec7t b\u1ea3n thu)', false,
      value => { this.playSpeech = value; }).disabled = !this.speech?.size;
    const label = document.createElement('label');
    const interval = document.createElement('input');
    interval.type = 'number';
    interval.min = '10';
    interval.max = '120';
    interval.placeholder = '20?40 / 25?45';
    if (gap !== undefined) interval.value = String(gap / 1000);
    interval.addEventListener('change', () => {
      const value = idleGap(interval.value);
      interval.value = value === undefined ? '' : String(value / 1000);
      this.idle?.setGap(value);
    });
    label.append(' Kho\u1ea3ng ch\u1edd l\u00fac r\u1ea3nh (gi\u00e2y) ', interval);
    this.panel.append(label);
  }

  private addDynamicControl() {
    const label = document.createElement('label');
    const password = document.createElement('input');
    const connect = document.createElement('button');
    const status = document.createElement('output');
    password.type = 'password';
    password.autocomplete = 'off';
    password.maxLength = 64;
    connect.type = 'button';
    connect.textContent = 'K\u1ebft n\u1ed1i gi\u1ecdng DEMO';
    status.textContent = this.dynamic;
    connect.addEventListener('click', () => {
      const token = password.value;
      password.value = '';
      this.named?.clear();
      this.named = undefined;
      if (!/^[a-f0-9]{64}$/.test(token)) {
        status.textContent = this.dynamic = 'DYNAMIC_TTS_BLOCKED';
        return;
      }
      status.textContent = this.dynamic = 'DYNAMIC_TTS_AWAITING_GIFT';
      this.named = new NamedVoice(loopbackVoice(token, state => { status.textContent = this.dynamic = state; }));
    });
    label.append('M\u00e3 phi\u00ean gi\u1ecdng DEMO ', password);
    this.panel.append(label, connect, status);
  }

  private addLevels() {
    const ambienceLabel = document.createElement('label');
    const ambience = document.createElement('input');
    ambience.type = 'checkbox';
    ambience.addEventListener('change', () => {
      this.ambience = ambience.checked;
      this.mixer?.setAmbience(this.ambience);
    });
    ambienceLabel.append(ambience, ' Âm nền nước và gió');
    this.panel.append(ambienceLabel);
    const labels = { voice: 'Giọng đọc', sfx: 'Hiệu ứng quà', ambience: 'Âm nền' };
    for (const bus of ['voice', 'sfx', 'ambience'] as const) {
      const label = document.createElement('label');
      const range = document.createElement('input');
      range.type = 'range';
      range.min = '0';
      range.max = '100';
      range.value = String(this.levels[bus] * 100);
      range.addEventListener('input', () => {
        this.levels[bus] = Number(range.value) / 100;
        this.mixer?.setLevel(bus, this.levels[bus]);
      });
      label.append(labels[bus], ' ', range);
      this.panel.append(label);
    }
  }
}
