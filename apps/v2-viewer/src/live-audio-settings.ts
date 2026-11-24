export const audioChannels = ['master', 'water', 'wind', 'giftChime', 'giftThanks', 'idleBell', 'idleWish'] as const;
export type AudioChannel = typeof audioChannels[number];
type Channel = { enabled: boolean; volume: number };
export type LiveAudioSettings = Record<AudioChannel, Channel> & { idleSeconds: number | null };
export type AudioSnapshot = { revision: number; settings: LiveAudioSettings; warning: '' | 'MISSING' | 'INVALID' };

export const audioDefaults: LiveAudioSettings = {
  master: { enabled: false, volume: 100 },
  water: { enabled: true, volume: 20 },
  wind: { enabled: true, volume: 20 },
  giftChime: { enabled: true, volume: 45 },
  giftThanks: { enabled: false, volume: 85 },
  idleBell: { enabled: true, volume: 45 },
  idleWish: { enabled: false, volume: 85 },
  idleSeconds: null,
};

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const integer = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
export function validAudioSettings(v: unknown): v is LiveAudioSettings {
  return object(v) && Object.keys(v).length === audioChannels.length + 1 &&
    (v.idleSeconds === null || integer(v.idleSeconds, 10, 120)) &&
    audioChannels.every(key => {
      const channel = v[key];
      return object(channel) && Object.keys(channel).length === 2 &&
        typeof channel.enabled === 'boolean' && integer(channel.volume, 0, 100);
    });
}

export function readAudioSnapshot(v: unknown): AudioSnapshot | undefined {
  const data = v as AudioSnapshot | undefined;
  if (data && integer(data.revision, 1, Number.MAX_SAFE_INTEGER) &&
      ['', 'MISSING', 'INVALID'].includes(data.warning) && validAudioSettings(data.settings)) return data;
}

const audioStates = ['LOCKED', 'STARTING', 'READY', 'PLAYING', 'MUTED', 'BLOCKED', 'UNAVAILABLE', 'DISCONNECTED'] as const;
const clipStates = ['OFF', 'PENDING', 'LOADING', 'AVAILABLE', 'UNAVAILABLE'] as const;
export type AudioApplied = { revision: number; state: typeof audioStates[number];
  thanks: typeof clipStates[number]; wishes: typeof clipStates[number] };

export function validAudioApplied(v: unknown, revision: number): v is AudioApplied {
  const data = v as AudioApplied | undefined;
  return object(v) && Object.keys(v).length === 4 && !!data && integer(data.revision, 1, revision) &&
    audioStates.includes(data.state) && clipStates.includes(data.thanks) && clipStates.includes(data.wishes);
}
