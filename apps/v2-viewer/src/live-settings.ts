export const choices = {
  profile: ['eco', 'quality'], tree: ['r18a', 'r17b', 'r16'], density: ['legacy', 'lush'], look: ['twilight', 'dusk', 'pink', 'gold', 'legacy'],
  botanicals: ['on', 'off'], diversity: ['on', 'off'], seats: ['rings', 'default'],
  ambience: ['rich', 'default'], shots: ['hero', 'default'], fx: ['on', 'off'], presence: ['on', 'off'],
  chatbubbles: ['on', 'off'], gifticons: ['on', 'off'], blessing: ['on', 'off'],
} as const;

export type LiveSettings = { [K in keyof typeof choices]: (typeof choices)[K][number] } & { seed: number };
export type SettingsSnapshot = { revision: number; settings: LiveSettings; warning: '' | 'MISSING' | 'INVALID' };
export const liveDefaults: Readonly<LiveSettings> = Object.freeze({
  profile: 'eco', tree: 'r17b', density: 'legacy', seed: 9, look: 'twilight', botanicals: 'on', diversity: 'on',
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

export function migrateVisualSettings(value: unknown): LiveSettings | undefined {
  if (validSettings(value)) return value;
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.hasOwn(value, 'density')) return;
  const migrated = { ...value, density: 'legacy' };
  if (validSettings(migrated)) return migrated;
}

type TreeStatus = 'R16' | 'R17B' | 'R18A';
export type WorldApplied = { requestedTree: TreeStatus; tree: TreeStatus; requestedDensity: 'legacy' | 'lush';
  density: 'legacy' | 'lush'; fallback: boolean };

export function validWorldApplied(value: unknown): value is WorldApplied {
  const data = value as WorldApplied | null;
  return !!data && typeof data === 'object' && Object.keys(data).length === 5 &&
    ['R16', 'R17B', 'R18A'].includes(data.requestedTree) && ['R16', 'R17B', 'R18A'].includes(data.tree) &&
    choices.density.includes(data.requestedDensity) && choices.density.includes(data.density) &&
    typeof data.fallback === 'boolean' && data.fallback === (data.tree !== data.requestedTree);
}

export function overlayQuery(settings: LiveSettings): URLSearchParams {
  const query = new URLSearchParams({ source: 'live', clean: '1' });
  for (const [key, value] of Object.entries(settings)) query.set(key, String(value));
  return query;
}