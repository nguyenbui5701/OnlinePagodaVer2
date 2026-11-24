import { GatewayError, postGateway } from './live-api.ts';
import { audioChannels, readAudioSnapshot, type AudioApplied, type AudioChannel, type AudioSnapshot,
  type LiveAudioSettings } from './live-audio-settings.ts';

const labels: Record<AudioChannel, string> = {
  master: 'Âm thanh tổng', water: 'Tiếng nước', wind: 'Tiếng gió', giftChime: 'Chuông nhận quà',
  giftThanks: 'Giọng cảm ơn', idleBell: 'Chuông lúc rảnh', idleWish: 'Lời chúc lúc rảnh',
};
const states: Record<AudioApplied['state'], string> = {
  LOCKED: 'Chờ bấm vào cảnh 3D', STARTING: 'Đang mở Web Audio', READY: 'Đã mở âm thanh', PLAYING: 'Đang phát giọng cảm ơn',
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

  let desired: AudioSnapshot | undefined;
  let revision = 0;
  let queued: LiveAudioSettings | undefined;
  let sending = false;
  let timer: ReturnType<typeof setTimeout>;
  let nextSaveAt = 0;
  let failed = false;

  function load(snapshot: AudioSnapshot) {
    revision = snapshot.revision;
    for (const [key, { enabled, volume, value }] of inputs) {
      enabled.checked = snapshot.settings[key].enabled;
      volume.value = String(snapshot.settings[key].volume);
      value.value = volume.value + '%';
    }
    interval.value = snapshot.settings.idleSeconds === null ? '' : String(snapshot.settings.idleSeconds);
  }

  async function save() {
    if (!queued || sending || failed || !desired) return;
    const settings = queued;
    queued = undefined;
    sending = true;
    nextSaveAt = performance.now() + 1500;
    try {
      const saved = readAudioSnapshot(await (await postGateway('/save-audio', { revision, settings })).json());
      if (!saved) throw new Error('audio-settings');
      revision = saved.revision;
      if (!desired || desired.revision <= revision) desired = saved;
      message.textContent = queued ? 'Đang chờ lưu thay đổi mới…' : 'Đã lưu cài đặt âm thanh.';
    } catch (error) {
      failed = true;
      reload.hidden = false;
      message.textContent = error instanceof GatewayError && error.reason === 'SETTINGS_CONFLICT'
        ? 'Một Dashboard khác đã lưu thay đổi. Nạp bản đã lưu trước khi chỉnh tiếp.'
        : 'Chưa xác nhận lưu được âm thanh. Nạp bản đã lưu để kiểm tra, rồi chỉnh lại nếu cần.';
    } finally {
      sending = false;
      schedule();
    }
  }

  function schedule() {
    clearTimeout(timer);
    if (!sending && queued && desired && !failed) {
      timer = setTimeout(() => void save(), Math.max(300, nextSaveAt - performance.now()));
    }
  }

  function change() {
    if (!desired || failed || !interval.reportValidity()) return;
    const channels = Object.fromEntries([...inputs].map(([key, { enabled, volume }]) =>
      [key, { enabled: enabled.checked, volume: volume.valueAsNumber }])) as Record<AudioChannel, { enabled: boolean; volume: number }>;
    queued = { ...channels, idleSeconds: interval.value === '' ? null : interval.valueAsNumber };
    message.textContent = 'Đang chờ lưu…';
    schedule();
  }
  fields.addEventListener('change', change);
  interval.addEventListener('change', change);
  reload.addEventListener('click', () => {
    if (!desired) return;
    queued = undefined;
    failed = false;
    reload.hidden = true;
    load(desired);
    message.textContent = 'Đã nạp bản lưu.';
  });

  return (snapshot?: AudioSnapshot, applied?: AudioApplied | null) => {
    desired = snapshot;
    fields.disabled = interval.disabled = !snapshot;
    reload.disabled = !snapshot;
    if (snapshot && !sending && !queued && !failed && snapshot.revision >= revision && snapshot.revision !== revision) load(snapshot);
    schedule();
    element('audio-state').textContent = snapshot
      ? 'Đã lưu r' + snapshot.revision + ' · Overlay ' + (applied ? 'r' + applied.revision + ' · ' + states[applied.state] : 'chưa báo trạng thái')
      : 'Chưa đọc được cấu hình âm thanh từ Gateway.';
    element('audio-clips').textContent = applied
      ? 'Giọng cảm ơn · ' + clipStates[applied.thanks] + ' / Lời chúc · ' + clipStates[applied.wishes] : '';
    const warning = element('audio-warning');
    warning.hidden = !snapshot?.warning;
    warning.textContent = snapshot?.warning === 'INVALID' ? 'Tệp âm thanh không hợp lệ. Đang dùng mặc định tắt.'
      : 'Chưa lưu âm thanh. Mặc định đang tắt.';
  };
}
