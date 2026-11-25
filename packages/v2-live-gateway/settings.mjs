import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { liveDefaults, migrateVisualSettings, validSettings } from '../../apps/v2-viewer/src/live-settings.ts';

import { audioDefaults, patchAudio, validAudioSettings } from '../../apps/v2-viewer/src/live-audio-settings.ts';

import { patchPresence, presenceDefaults, validPresenceSettings } from '../v2-events/src/presence.ts';

const presencePath = fileURLToPath(new URL('./data/presence-settings.json', import.meta.url));
const audioPath = fileURLToPath(new URL('./data/audio-settings.json', import.meta.url));
const settingsPath = fileURLToPath(new URL('./data/settings.json', import.meta.url));

export class SettingsStore {
  constructor(path = settingsPath, defaults = liveDefaults, validate = validSettings) {
    this.path = path;
    this.validate = validate;
    try {
      if (statSync(path).size > 4096) throw new Error('settings file too large');
      const data = JSON.parse(readFileSync(path, 'utf8'));
      const settings = validate === validSettings ? migrateVisualSettings(data?.settings) : data?.settings;
      if (data?.version !== 1 || !Number.isSafeInteger(data.revision) || data.revision < 1 ||
          !validate(settings)) throw new Error('invalid settings');
      this.snapshot = { revision: data.revision, settings, warning: '' };
    } catch (error) {
      this.snapshot = { revision: 1, settings: defaults, warning: error.code === 'ENOENT' ? 'MISSING' : 'INVALID' };
    }
  }

  save(revision, settings) {
    if (!this.validate(settings)) return 'INVALID_SETTINGS';
    if (revision !== this.snapshot.revision || revision === Number.MAX_SAFE_INTEGER) return 'SETTINGS_CONFLICT';
    const next = { revision: revision + 1, settings: structuredClone(settings), warning: '' };
    const temp = this.path + '.' + randomUUID() + '.tmp';
    try {
      mkdirSync(dirname(this.path), { recursive: true });
      writeFileSync(temp, JSON.stringify({ version: 1, revision: next.revision, settings: next.settings }) + '\n',
        { flag: 'wx' });
      renameSync(temp, this.path);
    } catch {
      try { unlinkSync(temp); } catch {}
      return 'SETTINGS_WRITE_FAILED';
    }
    this.snapshot = next;
  }
}

export class PresenceSettingsStore extends SettingsStore {
  constructor(path = presencePath) { super(path, presenceDefaults, validPresenceSettings); }

  patch(revision, fields) {
    const settings = patchPresence(this.snapshot.settings, fields);
    return settings ? this.save(revision, settings) : 'INVALID_SETTINGS';
  }
}

export class AudioSettingsStore extends SettingsStore {
  muteFence = randomUUID();
  instance = randomUUID();
  priorityUsed = false;
  constructor(path = audioPath) { super(path, audioDefaults, validAudioSettings); }
  get desired() { return { ...this.snapshot, muteFence: this.muteFence, instance: this.instance }; }

  patch(revision, fence, values) {
    const settings = patchAudio(this.snapshot.settings, values);
    if (!settings) return 'INVALID_SETTINGS';
    if (values['master.enabled'] === true && fence !== this.muteFence) return 'STALE_ENABLE';
    return this.save(revision, settings);
  }

  mute() {
    const current = this.snapshot;
    const settings = { ...current.settings, master: { ...current.settings.master, enabled: false } };
    this.muteFence = randomUUID();
    this.priorityUsed = true;
    if (this.save(current.revision, settings)) {
      this.snapshot = { revision: current.revision + 1, settings, warning: 'UNSAVED' };
    }
    return this.desired;
  }
}