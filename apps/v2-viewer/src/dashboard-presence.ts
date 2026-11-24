import { presenceKeys, readPresenceSnapshot, validIdleSeconds, type PresenceApplied, type PresenceSettings,
  type PresenceSnapshot } from '../../../packages/v2-events/src/presence.ts';
import { GatewayError, postGateway } from './live-api.ts';

const find = <T extends HTMLElement>(id: string) => document.getElementById(id)! as T;

export function dashboardPresence() {
  const fields = find<HTMLFieldSetElement>('presence-fields');
  const inputs = new Map(presenceKeys.map(key => [key, find<HTMLInputElement>('presence-' + key)]));
  const duration = inputs.get('idleSeconds')!;
  const invalid = find('presence-invalid');
  const alert = find('presence-message');
  const stateLine = find('presence-state');
  const counts = find('presence-counts');
  let desired: PresenceSnapshot | undefined;
  let applied: PresenceApplied | undefined;
  let sending = false;
  const pending = new Map<keyof PresenceSettings, { value: number | boolean }>();

  function display() {
    fields.disabled = !desired;
    for (const [key, input] of inputs) {
      if (!desired || pending.has(key)) continue;
      if (key !== 'idleSeconds') input.checked = desired.settings[key];
      else if (invalid.hidden && document.activeElement !== duration) duration.value = String(desired.settings.idleSeconds);
    }
    stateLine.textContent = desired
      ? (desired.warning ? 'Mặc định r' : 'Đã lưu r') + desired.revision +
        ' · Overlay ' + (applied ? 'r' + applied.revision : 'chưa báo trạng thái') +
        (applied && applied.revision < desired.revision ? ' · Chờ áp dụng' : '')
      : 'Chưa đọc được cấu hình chỗ ngồi từ Gateway.';
    counts.textContent = applied ? `${applied.occupied}/3 ghế đang dùng · ${applied.waiting} đang chờ` +
      (applied.dropped ? ` · ${applied.dropped} lượt vượt sức chứa hàng chờ` : '') : '';
    find('presence-warning').hidden = desired?.warning !== 'INVALID';
  }

  function accept(snapshot: PresenceSnapshot | undefined) {
    if (!snapshot || !desired || snapshot.revision >= desired.revision) desired = snapshot;
  }

  async function save() {
    if (sending || !desired || !pending.size) return;
    sending = true;
    const batch = new Map(pending);
    try {
      for (let n = 0; n < 3; n++) {
        const current: PresenceSnapshot | undefined = desired;
        if (!current) throw new Error('presence unavailable');
        const entries = [...batch].filter(([key, intent]) => pending.get(key) === intent);
        if (!entries.length) return;
        const patch = Object.fromEntries(entries.map(([key, intent]) => [key, intent.value]));
        try {
          const snapshot = readPresenceSnapshot(await (await postGateway('/patch-presence', { revision: current.revision, patch })).json());
          if (!snapshot) throw new Error('invalid presence snapshot');
          accept(snapshot);
          alert.textContent = 'Đã lưu cấu hình chỗ ngồi.';
          return;
        } catch (error) {
          if (!(error instanceof GatewayError && error.status === 409)) throw error;
          const snapshot = readPresenceSnapshot((error.body as { presence?: unknown })?.presence);
          if (!snapshot) throw error;
          accept(snapshot);
        }
      }
      throw new Error('presence conflict');
    } catch {
      alert.textContent = 'Chưa lưu được thay đổi. Kiểm tra Gateway rồi chỉnh lại.';
    } finally {
      for (const [key, intent] of batch) if (pending.get(key) === intent) pending.delete(key);
      sending = false;
      display();
      void save();
    }
  }

  for (const [key, input] of inputs) input.addEventListener('change', () => {
    if (!desired) return;
    if (key === 'idleSeconds') {
      invalid.hidden = validIdleSeconds(input.valueAsNumber);
      input.setAttribute('aria-invalid', String(!invalid.hidden));
      if (!invalid.hidden) return;
    }
    pending.set(key, { value: key === 'idleSeconds' ? input.valueAsNumber : input.checked });
    void save();
  });

  return (snapshot?: PresenceSnapshot, report?: PresenceApplied) => {
    accept(snapshot);
    applied = report;
    display();
  };
}
