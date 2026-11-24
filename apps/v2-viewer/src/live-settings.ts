export const choices = {
  profile: ['eco', 'quality'], tree: ['r17b', 'r16'], look: ['twilight', 'dusk', 'pink', 'gold', 'legacy'],
  botanicals: ['on', 'off'], diversity: ['on', 'off'], seats: ['rings', 'default'],
  ambience: ['rich', 'default'], shots: ['hero', 'default'], fx: ['on', 'off'], presence: ['on', 'off'],
  chatbubbles: ['on', 'off'], gifticons: ['on', 'off'], blessing: ['on', 'off'],
} as const;

export type LiveSettings = { [K in keyof typeof choices]: (typeof choices)[K][number] } & { seed: number };
export type SettingsSnapshot = { revision: number; settings: LiveSettings; warning: '' | 'MISSING' | 'INVALID' };
export const liveDefaults: Readonly<LiveSettings> = Object.freeze({
  profile: 'eco', tree: 'r17b', seed: 9, look: 'twilight', botanicals: 'on', diversity: 'on',
  seats: 'rings', ambience: 'rich', shots: 'hero', fx: 'on', presence: 'on',
  chatbubbles: 'on', gifticons: 'on', blessing: 'on',
});
export function validSettings(input: unknown): input is LiveSettings {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const fields = input as Record<string, unknown>;
  const seed = fields.seed;
  return Object.keys(fields).length === Object.keys(liveDefaults).length &&
    Object.hasOwn(fields, 'seed') && typeof seed === 'number' && Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff &&
    Object.entries(choices).every(([key, values]) => Object.hasOwn(fields, key) &&
      (values as readonly unknown[]).includes(fields[key]));
}

export function overlayQuery(settings: LiveSettings): URLSearchParams {
  const query = new URLSearchParams({ source: 'live', clean: '1' });
  for (const [key, value] of Object.entries(settings)) query.set(key, String(value));
  return query;
}