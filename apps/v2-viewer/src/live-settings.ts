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

const treeOrder = ['R18A', 'R17B', 'R16'] as const;
const failureCodes = ['MISSING', 'INTEGRITY', 'IMPORT'] as const;
export type TreeRevision = (typeof treeOrder)[number];
export type GlbFailure = (typeof failureCodes)[number];
export type TreeFallback = { revision: TreeRevision; code: GlbFailure };

export function treeFallbackChain(revision: TreeRevision): readonly TreeRevision[] {
  return treeOrder.slice(treeOrder.indexOf(revision));
}

export type WorldApplied = { requestedTree: TreeRevision; tree: TreeRevision; requestedDensity: 'legacy' | 'lush';
  density: 'legacy' | 'lush'; fallback: boolean; failures: TreeFallback[] };

export function validWorldApplied(value: unknown): value is WorldApplied {
  const data = value as WorldApplied | null;
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length !== 6 ||
      !treeOrder.includes(data.requestedTree) || !treeOrder.includes(data.tree) ||
      !choices.density.includes(data.requestedDensity) || !choices.density.includes(data.density) ||
      !Array.isArray(data.failures)) return false;
  const chain = treeFallbackChain(data.requestedTree);
  const depth = chain.indexOf(data.tree);
  return depth >= 0 && data.fallback === (depth > 0) && data.failures.length === depth &&
    chain.slice(0, depth).every((revision, i) => {
      const failure = data.failures[i];
      return !!failure && typeof failure === 'object' && !Array.isArray(failure) &&
        Object.keys(failure).length === 2 && Object.hasOwn(failure, 'revision') && Object.hasOwn(failure, 'code') &&
        failure.revision === revision && failureCodes.includes(failure.code);
    });
}

export function overlayQuery(settings: LiveSettings): URLSearchParams {
  const query = new URLSearchParams({ source: 'live', clean: '1' });
  for (const [key, value] of Object.entries(settings)) query.set(key, String(value));
  return query;
}