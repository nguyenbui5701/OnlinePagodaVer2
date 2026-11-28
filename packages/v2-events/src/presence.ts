export const presenceDefaults = {
  autoJoinMember: true, autoJoinChat: true, autoJoinLike: false, seatExpiryEnabled: true, idleSeconds: 60,
};
export type PresenceSettings = typeof presenceDefaults;
export type PresenceSnapshot = { revision: number; settings: PresenceSettings; warning: '' | 'MISSING' | 'INVALID' };
export type PresenceApplied = { revision: number; occupied: number; waiting: number; dropped: number };
export const presenceKeys = Object.keys(presenceDefaults) as (keyof PresenceSettings)[];
export const waitCapacity = 64;
export const waitTTLms = 60_000;

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const integer = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
export const validIdleSeconds = (v: unknown): v is number => integer(v, 6, 1800);

export function patchPresence(current: PresenceSettings, patch: unknown): PresenceSettings | undefined {
  if (!object(patch) || !Object.keys(patch).length) return;
  const next = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'idleSeconds' && validIdleSeconds(value)) next.idleSeconds = value;
    else if ((key === 'autoJoinMember' || key === 'autoJoinChat' || key === 'autoJoinLike' || key === 'seatExpiryEnabled') &&
        typeof value === 'boolean') next[key] = value;
    else return;
  }
  return next;
}

export function validPresenceSettings(v: unknown): v is PresenceSettings {
  return object(v) && Object.keys(v).length === presenceKeys.length && !!patchPresence(presenceDefaults, v);
}

export function migratePresenceSettings(value: unknown): PresenceSettings | undefined {
  if (!object(value)) return;
  const settings = { autoJoinLike: false, ...value };
  if (validPresenceSettings(settings)) return settings;
}

export const presenceFlowKeys = ['ingested', 'rejected', 'duplicate', 'seated', 'alreadySeated', 'queued',
  'refilled', 'waitExpired', 'seatExpired', 'capacity', 'disabled', 'queueRemoved', 'visibleNames'] as const;
export const newPresenceFlow = () => Object.fromEntries(presenceFlowKeys.map(key => [key, 0])) as Record<typeof presenceFlowKeys[number], number>;
export function validPresenceFlow(v: unknown): v is number[] {
  return Array.isArray(v) && v.length === presenceFlowKeys.length &&
    v.every(n => integer(n, 0, Number.MAX_SAFE_INTEGER)) && (v[v.length - 1] ?? Infinity) <= 3;
}

export function readPresenceSnapshot(v: unknown): PresenceSnapshot | undefined {
  if (object(v) && integer(v.revision, 1, Number.MAX_SAFE_INTEGER) &&
      (v.warning === '' || v.warning === 'MISSING' || v.warning === 'INVALID')) {
    const settings = migratePresenceSettings(v.settings);
    if (settings) return { revision: v.revision, settings, warning: v.warning };
  }
}

export function validPresenceApplied(v: unknown, revision: number): v is PresenceApplied {
  return object(v) && Object.keys(v).length === 4 && integer(v.revision, 1, revision) &&
    integer(v.occupied, 0, 3) && integer(v.waiting, 0, waitCapacity) && integer(v.dropped, 0, Number.MAX_SAFE_INTEGER);
}
