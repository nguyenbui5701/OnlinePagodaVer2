import './dashboard.css';
import { readPresenceSnapshot, validPresenceApplied, type PresenceApplied, type PresenceSnapshot } from '../../../packages/v2-events/src/presence.ts';
import { dashboardPresence } from './dashboard-presence.ts';
import { dashboardAudio } from './dashboard-audio.ts';
import { readAudioSnapshot, validAudioApplied, type AudioApplied, type AudioSnapshot } from './live-audio-settings.ts';
import { GatewayError, postGateway, readSettings } from './live-api.ts';
import { choices, validWorldApplied, type WorldApplied, type LiveSettings, type SettingsSnapshot } from './live-settings.ts';
import { reasons, type LiveCounters } from './live-receiver.ts';

type Status = {
  status: string; reason: string; viewerCount: number; counters: LiveCounters; dropped: number;
  deliveryUncertain: boolean; receiver: 'overlay' | 'legacy' | null;
  appliedRevision: number | null; overlayReady: boolean; applyPending: boolean; canApply: boolean; canConnect: boolean; canDisconnect: boolean;
  presenceDesired?: PresenceSnapshot; presenceApplied?: PresenceApplied;
  world?: WorldApplied;
  desired: SettingsSnapshot; audioDesired?: AudioSnapshot; audioApplied?: AudioApplied | null; namedProvider?: string;
};

const element = <T extends HTMLElement>(id: string) => document.getElementById(id)! as T;
const fields = element<HTMLFieldSetElement>('settings-fields');
const groupFields: [string, (keyof LiveSettings)[]][] = [
  ['Cảnh 3D', ['profile', 'tree', 'look', 'botanicals', 'density', 'diversity', 'seats']],
  ['Hiệu ứng', ['ambience', 'fx', 'presence', 'chatbubbles', 'gifticons', 'blessing']],
  ['Camera', ['shots', 'seed']],
];
const labels: Record<keyof LiveSettings, string> = {
  density: 'Mật độ đầm sen', profile: 'Chất lượng', tree: 'Cây Sakura', look: 'Ánh sáng', botanicals: 'Hoa và nụ sen',
  diversity: 'Đa dạng nhân vật', seats: 'Bố cục ghế', ambience: 'Không khí', fx: 'Hiệu ứng cảnh',
  presence: 'Tên phía trên đầu', chatbubbles: 'Bong bóng chat', gifticons: 'Biểu tượng quà',
  blessing: 'Hiệu ứng lời chúc', shots: 'Tuyến camera', seed: 'Seed camera',
};
const optionLabels: Record<string, string> = { eco: 'ECO', quality: 'QUALITY', r18a: 'R18a', lush: 'Dày theo cụm', r17b: 'R17B', r16: 'R16',
  twilight: 'Chuyển cảnh chiều tối', dusk: 'Tím-xanh', pink: 'Hồng', gold: 'Vàng', legacy: 'Ánh sáng gốc',
  on: 'Bật', off: 'Tắt', rings: 'Vòng đồng tâm', default: 'Mặc định', rich: 'Tăng hạt và sương', hero: 'Góc hero' };
const inputs = new Map<keyof LiveSettings, HTMLInputElement | HTMLSelectElement>();
for (const [name, keys] of groupFields) {
  const group = document.createElement('section');
  group.className = 'settings-group';
  const title = document.createElement('h3');
  title.textContent = name;
  const controls = document.createElement('div');
  controls.className = 'fields';
  for (const key of keys) {
    const label = document.createElement('label');
    label.append(labels[key]);
    if (key === 'seed') {
      const input = document.createElement('input');
      input.type = 'number'; input.required = true; input.min = '0'; input.max = String(0xffffffff); input.step = '1';
      label.append(input);
      inputs.set(key, input);
    } else {
      const select = document.createElement('select');
      for (const value of choices[key]) {
      select.add(new Option(key === 'density' && value === 'legacy' ? 'Mặc định' : optionLabels[value], value));
    }
      label.append(select);
      inputs.set(key, select);
    }
    controls.append(label);
  }
  group.append(title, controls);
  fields.append(group);
}

const outputCounters = new Map<string, HTMLElement>();
for (const [key, name] of [['chat', 'Chat'], ['member', 'Member'], ['like', 'Like'], ['giftFinal', 'Gói gift final'],
  ['giftProgress', 'Gói gift progress'], ['viewerCount', 'Đang xem'], ['dropped', 'Gói bỏ qua']]) {
  const group = document.createElement('div');
  const label = document.createElement('dt');
  label.textContent = name;
  const count = document.createElement('dd');
  count.textContent = '—';
  outputCounters.set(key, count);
  group.append(label, count);
  element('counters').append(group);
}

const connect = element<HTMLButtonElement>('connect');
const disconnect = element<HTMLButtonElement>('disconnect');
const save = element<HTMLButtonElement>('save');
const apply = element<HTMLButtonElement>('apply');
const reload = element<HTMLButtonElement>('reload-settings');
const operation = element('operation');
const renderAudio = dashboardAudio();
const renderPresence = dashboardPresence();
let current: Status | undefined;
let draftRevision = 0;
let dirty = false;
let busy = false;
let statusGeneration = 0;

function loadDraft(snapshot: SettingsSnapshot) {
  for (const [key, input] of inputs) input.value = String(snapshot.settings[key]);
  draftRevision = snapshot.revision;
  dirty = false;
}

function render(state?: Status) {
  current = state;
  renderPresence(state?.presenceDesired, state?.presenceApplied);
  renderAudio(state?.audioDesired, state?.audioApplied, state?.namedProvider);
  const code = state?.status ?? 'GATEWAY_UNAVAILABLE';
  const titles: Record<string, string> = {
    OFFLINE: 'Chưa kết nối LIVE', CONNECTING: 'Đang kết nối', RECONNECTING: 'Đang kết nối lại',
    CONNECTED_NO_EVENTS: 'Đã nối · Chờ sự kiện', EVENTS_VERIFIED: 'Đã nhận sự kiện',
    ERROR: 'Lỗi kết nối', DEGRADED: 'Gián đoạn giao nhận', GATEWAY_UNAVAILABLE: 'Chưa nối Gateway',
  };
  element('live-state').textContent = titles[code] ?? code;
  element('live-state').dataset.state = code;
  element('overlay-state').textContent = !state ? 'Đang chờ Gateway cục bộ.' :
    state.receiver === 'overlay' ? (state.applyPending ? 'Overlay đang nạp lại cấu hình…' :
      state.overlayReady ? 'Overlay sẵn sàng' : 'Overlay chưa sẵn sàng. Đang chờ khung hình WebGL.') :
    state.receiver === 'legacy' ? 'Viewer LIVE cũ đang giữ phiên nhận. Đóng Viewer cũ để dùng Overlay.' : 'Chưa có Overlay sẵn sàng.';
  const reason = state?.reason;
  element('source-reason').hidden = !reason;
  element('source-reason').textContent = reason && Object.hasOwn(reasons, reason) ? reasons[reason] : '';
  element('delivery-warning').hidden = !state?.deliveryUncertain;
  const counts: Record<string, number> | undefined = state && { ...state.counters, viewerCount: state.viewerCount, dropped: state.dropped };
  for (const [key, count] of outputCounters) count.textContent = counts ? String(counts[key]) : '—';

  const desired = state?.desired;
  if (desired && !dirty && desired.revision !== draftRevision) loadDraft(desired);
  const pending = !!state && state.receiver === 'overlay' && state.appliedRevision !== desired?.revision;
  element('settings-state').textContent = desired ?
    'Đã lưu ' + (desired.warning ? '—' : 'r' + desired.revision) +
    ' · Overlay ' + (state?.appliedRevision ? 'r' + state.appliedRevision : '—') +
    (pending ? ' · Chờ áp dụng' : '') + (dirty ? ' · Có chỉnh sửa chưa lưu' : '') : 'Chưa đọc được cấu hình từ Gateway.';
  const world = state?.world;
  const failureLabels = { MISSING: 'thiếu GLB', INTEGRITY: 'lỗi kiểm tra tính toàn vẹn', IMPORT: 'lỗi nạp GLB' };
  const failureText = world?.failures.map(({ revision, code }) => revision + ' – ' + failureLabels[code]).join(', ');
  element('world-applied').textContent = world ?
    'Cây đang dùng ' + world.tree + (world.fallback ? ' · Đã dùng dự phòng thay cho ' + world.requestedTree + ' (' + failureText + ')' : '') +
    ' · Đầm sen ' + (world.density === 'lush' ? 'dày theo cụm' : 'mặc định') +
    (world.density !== world.requestedDensity ? ' · Bố cục chưa áp dụng mật độ dày' : '') : '';
  const warning = element('settings-warning');
  warning.hidden = !desired?.warning;
  warning.textContent = desired?.warning === 'INVALID' ? 'Tệp cấu hình không đọc được. Đang dùng mặc định.' :
    'Chưa có tệp lưu. Đang dùng cấu hình mặc định.';

  const available = !!desired && !busy;
  fields.disabled = !available;
  connect.disabled = !state?.canConnect || busy;
  disconnect.disabled = state?.receiver !== 'overlay' || !state.canDisconnect || busy;
  save.disabled = !available || (!dirty && !desired?.warning);
  apply.disabled = !pending || !state?.canApply || dirty || busy;
  reload.disabled = !available || !dirty;
}

async function refresh() {
  const generation = ++statusGeneration;
  try {
    const state = await (await postGateway('/status')).json() as Status;
    state.desired = readSettings(state.desired);
    if (!validWorldApplied(state.world)) state.world = undefined;
    state.presenceDesired = readPresenceSnapshot(state.presenceDesired);
    if (!validPresenceApplied(state.presenceApplied, state.presenceDesired?.revision ?? 0)) state.presenceApplied = undefined;
    state.audioDesired = readAudioSnapshot(state.audioDesired);
    if (!validAudioApplied(state.audioApplied, state.audioDesired?.revision ?? 0)) state.audioApplied = null;
    if (statusGeneration === generation) render(state);
  } catch {
    if (statusGeneration === generation) render();
  }
}

const messages: Record<string, string> = {
  OVERLAY_NOT_READY: 'Mở Overlay và đợi cảnh tải xong.',
  APPLY_BLOCKED: 'Chờ ngắt LIVE và xử lý hết các gói trước khi áp dụng.',
  SETTINGS_CONFLICT: 'Cấu hình vừa được thay đổi từ tab khác. Nạp bản đã lưu rồi thử lại.',
  SETTINGS_WRITE_FAILED: 'Không ghi được tệp cấu hình.',
  INVALID_SETTINGS: 'Cấu hình không hợp lệ.',
  SOURCE_BUSY: 'Nguồn LIVE đang bận hoặc còn gói chờ giao.',
  LOCAL_RATE_LIMITED: 'Gateway đang giới hạn yêu cầu. Thử lại sau.',
};

async function act(run: () => Promise<void>, success: string) {
  if (busy) return;
  busy = true;
  statusGeneration++;
  render(current);
  try {
    await run();
    operation.textContent = success;
  } catch (error) {
    const code = error instanceof GatewayError ? error.reason : '';
    operation.textContent = (Object.hasOwn(messages, code) ? messages[code] :
      Object.hasOwn(reasons, code) ? reasons[code] : 'Không thực hiện được thao tác trên Gateway.');
  } finally {
    busy = false;
    await refresh();
  }
}

element<HTMLFormElement>('source-form').addEventListener('submit', event => {
  event.preventDefault();
  const username = element<HTMLInputElement>('username').value.trim();
  if (!/^@?[a-zA-Z0-9_.]{1,24}$/.test(username)) {
    operation.textContent = reasons.INVALID_USERNAME;
    return;
  }
  void act(async () => { await postGateway('/operate', { action: 'connect', username }); }, 'Đã gửi yêu cầu kết nối.');
});
disconnect.addEventListener('click', () => void act(async () => {
  await postGateway('/operate', { action: 'disconnect' });
}, 'Đã yêu cầu ngắt kết nối.'));
fields.addEventListener('input', () => { dirty = true; render(current); });
element<HTMLFormElement>('settings-form').addEventListener('submit', event => {
  event.preventDefault();
  const settings = Object.fromEntries([...inputs].map(([key, input]) => [key, key === 'seed' ? Number(input.value) : input.value]));
  void act(async () => {
    loadDraft(readSettings(await (await postGateway('/save-settings', { revision: draftRevision, settings })).json()));
  }, 'Đã lưu cấu hình.');
});
apply.addEventListener('click', () => {
  const revision = current?.desired.revision;
  if (revision !== undefined) void act(async () => { await postGateway('/apply', { revision }); },
    'Overlay sẽ tải lại để áp dụng cấu hình.');
});
reload.addEventListener('click', () => {
  if (current) { loadDraft(current.desired); render(current); operation.textContent = 'Đã nạp bản cấu hình lưu trên máy.'; }
});

async function poll() {
  if (!busy) await refresh();
  setTimeout(poll, 2000);
}
void poll();