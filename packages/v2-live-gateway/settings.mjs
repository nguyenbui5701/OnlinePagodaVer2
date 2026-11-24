import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { liveDefaults, validSettings } from '../../apps/v2-viewer/src/live-settings.ts';

import { audioDefaults, validAudioSettings } from '../../apps/v2-viewer/src/live-audio-settings.ts';

const audioPath = fileURLToPath(new URL('./data/audio-settings.json', import.meta.url));
const settingsPath = fileURLToPath(new URL('./data/settings.json', import.meta.url));

export class SettingsStore {
  constructor(path = settingsPath, defaults = liveDefaults, validate = validSettings) {
    this.path = path;
    this.validate = validate;
    try {
      if (statSync(path).size > 4096) throw new Error('settings file too large');
      const data = JSON.parse(readFileSync(path, 'utf8'));
      if (data?.version !== 1 || !Number.isSafeInteger(data.revision) || data.revision < 1 ||
          !validate(data.settings)) throw new Error('invalid settings');
      this.snapshot = { revision: data.revision, settings: data.settings, warning: '' };
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

export class AudioSettingsStore extends SettingsStore {
  constructor(path = audioPath) { super(path, audioDefaults, validAudioSettings); }
}