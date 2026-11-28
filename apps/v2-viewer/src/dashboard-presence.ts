import { presenceFlowKeys, presenceKeys, readPresenceSnapshot, validIdleSeconds, validPresenceFlow, type PresenceApplied, type PresenceSettings,
  type PresenceSnapshot } from '../../../packages/v2-events/src/presence.ts';
import { GatewayError, postGateway } from './live-api.ts';

const find = <T extends HTMLElement>(id: string) => document.getElementById(id)! as T;

export type PresenceDiagnostics = {
  ingress: Record<string, number>; ingressReports: number; ingressIncomplete: number; mapped: number; dedup: number;
  observed: number; observedCapped: boolean;
  queued: number; coalesced: number; pressure: number; throttled: number; overflow: number; sessionDrop: number;
  invalid: number; entries: number; consumed: number; abandoned: number;
  offered: number; acknowledged: number; pending: number;
};

export function dashboardPresence() {
  const fields = find<HTMLFieldSetElement>('presence-fields');
  const inputs = new Map(presenceKeys.map(key => [key, find<HTMLInputElement>('presence-' + key)]));
  const duration = inputs.get('idleSeconds')!;
  const invalid = find('presence-invalid');
  const alert = find('presence-message');
  const stateLine = find('presence-state');
  const counts = find('presence-counts');
  const ingressLine = find('presence-ingress');
  const flowLine = find('presence-flow');
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

  return (snapshot?: PresenceSnapshot, report?: PresenceApplied, diagnostics?: PresenceDiagnostics, flow?: unknown) => {
    accept(snapshot);
    applied = report;
    display();
    const d = diagnostics;
    const i = d?.ingress;
    ingressLine.textContent = !d || !i ? '' : (d.ingressReports ?
      `Callback đã nhận · vào ${i.member}, chat ${i.chat}, Like ${i.like}, tổng phòng ${i.roomUser}, quà ${i.gift}. ` +
        `Lọc · chưa có phòng ${i.noRoom}, sai phòng ${i.wrongRoom}, thời gian ${i.time}, cấu trúc ${i.schema}, ID người xem ${i.identity}, ID gói ${i.message}. ` +
        `IPC · chuyển ${i.handoff}, quá tải ${i.ipcPressure}, lỗi ${i.ipcError}. `
      : 'Chưa có báo cáo callback từ Connector. ') +
      (d.ingressIncomplete ? `IPC · ${d.ingressIncomplete} phiên có báo cáo cuối thiếu. ` : '') +
      `Định danh phòng hiện tại ${d.observed}${d.observedCapped ? '+' : ''}. Gateway · đã ánh xạ ${d.mapped}, trùng ${d.dedup}, ` +
      `đã xếp chuyển ${d.queued}, gộp ${d.coalesced}, quá tải ${d.pressure + d.overflow}, hạn nhịp ${d.throttled}, ngoài phiên ${d.sessionDrop}, sai loại ${d.invalid}. ` +
      `Đã gửi đến seq ${d.offered}, ACK ${d.acknowledged}, còn ${d.pending} gói. Tổng từ khi mở Gateway · vào hàng ${d.entries}, ACK ${d.consumed}, bỏ khi nhả phiên ${d.abandoned}.`;
    if (validPresenceFlow(flow)) {
      const s = Object.fromEntries(presenceFlowKeys.map((key, index) => [key, flow[index]]));
      flowLine.textContent = `Engine nhận ${s.ingested}, từ chối ${s.rejected}, trùng ${s.duplicate}. ` +
        `Ghế mới ${s.seated}, cập nhật ghế cũ ${s.alreadySeated}, vào hàng ${s.queued}, chuyển từ hàng sang ghế ${s.refilled}, ` +
        `hết hạn chờ ${s.waitExpired}, hết hạn ghế ${s.seatExpired}, xóa khỏi hàng ${s.queueRemoved}, ` +
        `hàng đầy ${s.capacity}, tự xếp ghế tắt ${s.disabled}. Tên đang thấy trên Overlay ${s.visibleNames}.`;
    } else flowLine.textContent = '';
  };
}
