import { GatewayError, postGateway } from './live-api.ts';
import { audioChannels, readAudioSnapshot, type AudioApplied, type AudioChannel, type AudioSnapshot,
  type AudioPatch } from './live-audio-settings.ts';

const labels: Record<AudioChannel, string> = {
  master: 'Âm thanh tổng', water: 'Tiếng nước', wind: 'Tiếng gió', giftChime: 'Chuông nhận quà',
  giftThanks: 'Giọng cảm ơn', idleBell: 'Chuông lúc rảnh', idleWish: 'Lời chúc lúc rảnh',
};
const states: Record<AudioApplied['state'], string> = {
  LOCKED: 'Chờ bấm vào cảnh 3D', STARTING: 'Đang mở Web Audio', READY: 'Đã mở âm thanh', PLAYING: 'Đang phát giọng cảm ơn',
  SUSPENDED: 'Trình duyệt tạm dừng Web Audio. Bấm vào cảnh 3D để mở lại.',
  MUTED: 'Đang tắt tiếng hoặc chờ mở lại', BLOCKED: 'Cửa sổ khác đang giữ quyền phát',
  UNAVAILABLE: 'Web Audio không khả dụng', DISCONNECTED: 'Đã mở Web Audio, đang chờ phiên LIVE',
};
const clipStates: Record<AudioApplied['thanks'], string> = {
  OFF: 'Tắt', PENDING: 'Chờ mở âm thanh', LOADING: 'Đang tải', AVAILABLE: 'Có clip hợp lệ', UNAVAILABLE: 'Thiếu clip hợp lệ',
};
const element = <T extends HTMLElement>(id: string) => document.getElementById(id)! as T;

export function dashboardAudio() {
  const fields = element<HTMLFieldSetElement>('audio-fields');
  const interval = element<HTMLInputElement>('audio-idle-seconds');
  const reload = element<HTMLButtonElement>('audio-reload');
  const message = element('audio-operation');
  const inputs = new Map<AudioChannel, { enabled: HTMLInputElement; volume: HTMLInputElement; value: HTMLOutputElement }>();
  for (const key of audioChannels) {
    const group = document.createElement('div');
    const label = document.createElement('label');
    const enabled = document.createElement('input');
    enabled.type = 'checkbox';
    enabled.id = 'audio-' + key;
    label.append(enabled, labels[key]);
    const range = document.createElement('label');
    const volume = document.createElement('input');
    volume.type = 'range';
    volume.id = 'audio-' + key + '-volume';
    volume.min = '0'; volume.max = '100'; volume.step = '1';
    volume.setAttribute('aria-label', 'Âm lượng ' + labels[key].toLocaleLowerCase('vi'));
    const value = document.createElement('output');
    value.htmlFor = volume.id;
    volume.addEventListener('input', () => { value.value = volume.value + '%'; });
    range.append(volume, value);
    group.append(label, range);
    fields.append(group);
    inputs.set(key, { enabled, volume, value });
  }

  const mute = element<HTMLButtonElement>('audio-mute');
  const named = element<HTMLInputElement>('audio-named');
  const variety = element<HTMLInputElement>('audio-variety');
  const intervalError = element('audio-idle-error');
  let desired: AudioSnapshot | undefined;
  let available = false;
  let invalidDraft = false;
  let sending = false;
  let muting = false;
  let unconfirmedMute = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let backoffUntil = 0;
  const pending = new Map<string, { value: AudioPatch[string]; fence?: string }>();

  function use(snapshot: unknown, fromPoll = false) {
    const next = readAudioSnapshot(snapshot);
    if (!next?.muteFence || !next.instance || retiredInstances.has(next.instance)) return;
    if (desired && desired.instance !== next.instance) {
      if (!fromPoll) return;
      if (desired.instance) retiredInstances.add(desired.instance);
      if (retiredInstances.size > 16) retiredInstances.delete(retiredInstances.values().next().value!);
      pending.clear();
    } else if (desired && next.revision < desired.revision) return;
    if (desired?.muteFence !== next.muteFence) pending.delete('master.enabled');
    desired = next;
    syncInputs();
  }
  const retiredInstances = new Set<string>();

  function syncInputs() {
    if (!desired) return;
    const s = desired.settings;
    for (const [key, { enabled, volume, value }] of inputs) {
      if (!pending.has(key + '.enabled')) enabled.checked = key === 'master' && (muting || unconfirmedMute) ? false : s[key].enabled;
      if (!pending.has(key + '.volume') && document.activeElement !== volume) {
        volume.value = String(s[key].volume);
        value.value = volume.value + '%';
      }
    }
    if (!pending.has('idleSeconds') && !invalidDraft && document.activeElement !== interval) interval.value = s.idleSeconds?.toString() ?? '';
    if (!pending.has('namedEnabled')) named.checked = !!s.namedEnabled;
    if (!pending.has('namedVariety')) variety.checked = s.namedVariety !== false;
    inputs.get('master')!.enabled.disabled = muting || unconfirmedMute;
  }

  function schedule(delay = 120) {
    clearTimeout(timer);
    timer = undefined;
    if (!sending && available && pending.size) {
      timer = setTimeout(() => { timer = undefined; void save(); }, Math.max(delay, backoffUntil - performance.now()));
    }
  }

  async function save() {
    if (sending || !desired || !available || !pending.size) return;
    sending = true;
    const batch = new Map(pending);
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const current: AudioSnapshot = desired;
        const entries = [...batch].filter(([key, intent]) => pending.get(key) === intent &&
          (key !== 'master.enabled' || (!muting && intent.fence === current.muteFence)));
        if (!entries.length) break;
        const patch = Object.fromEntries(entries.map(([key, intent]) => [key, intent.value]));
        try {
          const saved = await (await postGateway('/patch-audio', { revision: current.revision, fence: current.muteFence, patch })).json();
          for (const [key, intent] of entries) if (pending.get(key) === intent) pending.delete(key);
          use(saved);
          if (!muting && !unconfirmedMute) message.textContent = 'Đã lưu cài đặt âm thanh.';
          return;
        } catch (error) {
          if (error instanceof GatewayError && error.status === 409) {
            use((error.body as { audio?: unknown })?.audio);
            continue;
          }
          if (error instanceof GatewayError && error.status === 429) {
            backoffUntil = performance.now() + 2200;
            if (!muting && !unconfirmedMute) message.textContent = 'Gateway đang giới hạn lượt lưu. Đang chờ thử lại.';
            return;
          }
          throw error;
        }
      }
      backoffUntil = performance.now() + 250;
    } catch {
      backoffUntil = performance.now() + 2200;
      for (const [key, intent] of batch) if (pending.get(key) === intent) pending.delete(key);
      if (!muting && !unconfirmedMute) message.textContent = 'Chưa xác nhận lưu được thay đổi. Kiểm tra Gateway rồi chỉnh lại.';
      reload.hidden = false;
      syncInputs();
    } finally {
      sending = false;
      schedule();
    }
  }

  function change(key: string, value: AudioPatch[string], delay = 0) {
    if (!desired || !available) return;
    pending.set(key, { value, fence: desired.muteFence });
    schedule(delay);
  }

  async function muteAll() {
    if (muting) return;
    muting = true;
    pending.delete('master.enabled');
    syncInputs();
    message.textContent = 'Đang gửi yêu cầu tắt tiếng ưu tiên…';
    try {
      const snapshot = readAudioSnapshot(await (await postGateway('/mute-audio')).json());
      if (!snapshot || snapshot.settings.master.enabled) throw new Error('mute');
      use(snapshot);
      unconfirmedMute = false;
      message.textContent = snapshot.warning === 'UNSAVED' ? 'Gateway đã tắt tiếng. Chưa ghi được xuống đĩa.'
        : 'Đã lưu lệnh tắt âm thanh. Đang chờ Overlay phản hồi.';
    } catch {
      unconfirmedMute = true;
      message.textContent = 'Chưa xác nhận tắt tiếng. Thử lại hoặc nhấn M ngay trên Overlay.';
    } finally {
      muting = false;
      syncInputs();
      schedule();
    }
  }

  mute.addEventListener('click', () => void muteAll());
  for (const [key, { enabled, volume }] of inputs) {
    enabled.addEventListener('change', () => {
      if (key === 'master' && !enabled.checked) void muteAll();
      else change(key + '.enabled', enabled.checked);
    });
    volume.addEventListener('change', () => change(key + '.volume', volume.valueAsNumber, 125));
    volume.addEventListener('blur', syncInputs);
  }
  named.addEventListener('change', () => change('namedEnabled', named.checked));
  variety.addEventListener('change', () => change('namedVariety', variety.checked));
  interval.addEventListener('change', () => {
    const value = interval.valueAsNumber;
    invalidDraft = interval.validity.badInput || (interval.value !== '' && (!Number.isInteger(value) || value < 10 || value > 120));
    intervalError.hidden = !invalidDraft;
    interval.setAttribute('aria-invalid', String(invalidDraft));
    if (!invalidDraft) change('idleSeconds', interval.value === '' ? null : value);
  });
  reload.addEventListener('click', () => {
    invalidDraft = false;
    intervalError.hidden = true;
    interval.setAttribute('aria-invalid', 'false');
    reload.hidden = true;
    syncInputs();
  });

  return (snapshot?: AudioSnapshot, applied?: AudioApplied | null, provider?: string) => {
    available = !!snapshot;
    if (snapshot) use(snapshot, true);
    fields.disabled = interval.disabled = named.disabled = variety.disabled = !available;
    const state = desired;
    element('audio-state').textContent = snapshot && state
      ? (state.warning === 'UNSAVED' ? 'Gateway r' : 'Đã lưu r') + state.revision + ' · Overlay ' +
        (applied ? 'r' + applied.revision + ' · ' + states[applied.state] : 'chưa báo trạng thái')
      : 'Chưa đọc được cấu hình âm thanh từ Gateway.';
    element('audio-clips').textContent = applied
      ? 'Giọng cảm ơn · ' + clipStates[applied.thanks] + ' / Lời chúc · ' + clipStates[applied.wishes] : '';
    element('audio-provider').textContent = ({
      OFF: 'gTTS đọc tên đang tắt.', READY: 'gTTS có thể nhận yêu cầu. Dùng câu cảm ơn chung nếu trễ.',
      UNAVAILABLE: 'gTTS đang không khả dụng. Dùng câu cảm ơn chung.',
      STANDBY: 'Đã cấu hình gTTS. Chờ bật kênh cảm ơn và đọc tên.',
      PENDING: 'gTTS chưa tổng hợp clip trong phiên này.',
    } as Record<string, string>)[provider ?? 'OFF'] ?? '';
    const warning = element('audio-warning');
    warning.hidden = !snapshot?.warning;
    warning.textContent = snapshot?.warning === 'UNSAVED' ? 'Đã tắt trong Gateway. Kiểm tra quyền ghi và lưu lại trước khi khởi động lại.'
      : snapshot?.warning === 'INVALID' ? 'Tệp âm thanh không hợp lệ. Đang dùng mặc định tắt.'
      : 'Chưa lưu âm thanh. Mặc định đang tắt.';
    if (!sending && !timer) schedule();
  };
}
