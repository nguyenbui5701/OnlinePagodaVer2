import type { DemoEvent, SessionEvent } from '../../../packages/v2-events/src/protocol.ts';

export type LivePacket = DemoEvent | SessionEvent;
export type LiveEntry = { seq: number; event: LivePacket };
export const liveBatchLimit = 48;
const endpoint = 'http://127.0.0.1:5203';
const statuses = new Set(['OFFLINE', 'CONNECTING', 'RECONNECTING', 'CONNECTED_NO_EVENTS', 'EVENTS_VERIFIED', 'ERROR', 'DEGRADED']);
const reasons: Record<string, string> = {
  ROOM_OFFLINE: 'Kênh chưa LIVE hoặc phiên đã kết thúc.',
  ACCESS_DENIED: 'Provider từ chối quyền truy cập.',
  PAID_ROUTE: 'Provider yêu cầu route trả phí.',
  SIGNING_FAILED: 'Dịch vụ ký không trả về kết nối hợp lệ.',
  RATE_LIMITED: 'Provider đã giới hạn yêu cầu. Đợi hết hạn trước khi khởi động lại gateway.',
  NETWORK: 'Không kết nối được tới provider.',
  UNKNOWN: 'Provider trả lỗi chưa xác định.',
  INVALID_USERNAME: 'Tên kênh TikTok không hợp lệ.',
  GIFT_UNMAPPED: 'Có gift final không thể ánh xạ an toàn.',
  GIFT_DELIVERY_FAILED: 'Có gift final không thể chuyển tới Viewer.',
};
const counterKeys = ['chat', 'member', 'like', 'giftProgress', 'giftFinal', 'room'] as const;
type Result = { status: string; reason: string; entries: LiveEntry[]; deliveryUncertain: boolean;
  counters: Record<typeof counterKeys[number], number>; viewerCount: number; dropped: number };
const natural = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;

export function decodeLivePoll(value: unknown, ack: number): Result {
  const data = value as Result & { version?: string };
  if (!data || data.version !== '0.2.0' || !statuses.has(data.status) ||
      typeof data.reason !== 'string' || (data.reason && !Object.hasOwn(reasons, data.reason)) ||
      typeof data.deliveryUncertain !== 'boolean' || !natural(data.viewerCount) || !natural(data.dropped) || !data.counters ||
      !counterKeys.every(key => natural(data.counters[key])) || !Array.isArray(data.entries) || data.entries.length > liveBatchLimit) {
    throw new Error('LIVE_PROTOCOL');
  }
  for (const [index, entry] of data.entries.entries()) {
    const event = entry?.event;
    if (entry?.seq !== ack + index + 1 || !event || !natural(event.roomEpoch) || !natural(event.connection) || !natural(event.atMs) ||
        !['session', 'chat', 'member', 'like', 'room', 'gift'].includes(event.type)) throw new Error('LIVE_PROTOCOL');
  }
  return data;
}

export function createLiveControls(report: Record<string, unknown>, feed: (entries: LiveEntry[]) => boolean,
    sourceLost: () => void, receipt: () => { ack: number; failed: boolean }) {
  const client = Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, '0')).join('');
  const panel = document.createElement('section');
  panel.id = 'live-controls';
  const form = document.createElement('form');
  const username = document.createElement('input');
  username.required = true;
  username.maxLength = 25;
  username.autocomplete = 'off';

  const connect = document.createElement('button');
  connect.type = 'submit';
  connect.textContent = 'Connect';
  const disconnect = document.createElement('button');
  disconnect.type = 'button';
  disconnect.textContent = 'Disconnect';
  disconnect.disabled = true;
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.textContent = 'OFFLINE · Chưa kết nối.';
  const counts = document.createElement('p');
  const label = document.createElement('label');
  label.append('Tên kênh TikTok', ' ', username);
  form.append(label, connect, ' ', disconnect);
  panel.append(form, status, counts);
  document.querySelector('main')!.after(panel);

  let timer: ReturnType<typeof setTimeout>;
  let watching = false;
  let faulted = false;
  let busy = false;
  let closed = false;
  let reportedFailure = false;
  let linkRetries = 0;
  let deliveryUncertain = false;
  const abort = new AbortController();
  async function request(path: string, data = {}, keepalive = false) {
    const response = await fetch(endpoint + path, {
      method: 'POST', credentials: 'omit', cache: 'no-store', redirect: 'error', keepalive,
      signal: keepalive ? undefined : AbortSignal.any([abort.signal, AbortSignal.timeout(3000)]),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client, ...data }),
    });
    if (response.status === 429) {
      const body = await response.json();
      throw new Error(body?.reason === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'LOCAL_RATE_LIMITED');
    }
    if (!response.ok) throw new Error('HTTP_' + response.status);
    return response;
  }

  function show(state: string, reason = '', description = '') {
    report.liveStatus = state;
    report.liveReason = reason;
    const text = description || (Object.hasOwn(reasons, reason) ? reasons[reason] : '');
    report.liveDeliveryUncertain = deliveryUncertain;
    status.textContent = state + (text ? ' · ' + text : '') +
      (deliveryUncertain ? ' · Có gift final chưa xác minh giao nhận trong phiên gateway này.' : '');
    const active = ['CONNECTING', 'RECONNECTING', 'CONNECTED_NO_EVENTS', 'EVENTS_VERIFIED'].includes(state);
    connect.disabled = busy || faulted || active;
    disconnect.disabled = busy || !active;
  }

  async function poll() {
    if (!watching || closed) return;
    try {
      if (receipt().failed && !reportedFailure) {
        deliveryUncertain = true;
        await request('/degraded');
        reportedFailure = true;
      }
      const { ack } = receipt();
      const response = await request('/poll', { ack });
      const data = decodeLivePoll(await response.json(), ack);
      if (closed) return;
      deliveryUncertain ||= data.deliveryUncertain;
      if (!feed(data.entries)) {
        deliveryUncertain = true;
        await request('/degraded');
        throw new Error('DELIVERY_FAILED');
      }
      linkRetries = 0;
      report.liveCounters = data.counters;
      report.liveDropped = data.dropped;
      counts.textContent = 'Chat ' + data.counters.chat + ' · Member ' + data.counters.member + ' · Like ' +
        data.counters.like + ' · Gift final ' + data.counters.giftFinal + ' · Gift progress ' + data.counters.giftProgress +
        ' · Người xem ' + data.viewerCount + ' · Bỏ qua ' + data.dropped;
      show(data.status, data.reason);
      timer = setTimeout(poll, 250);
    } catch (error) {
      if (closed) return;
      const code = error instanceof Error ? error.message : '';
      const transient = error instanceof TypeError || (error instanceof DOMException && error.name === 'TimeoutError');
      if (transient && linkRetries < 2) {
        show('RECONNECTING', 'LOCAL_LINK_LOST', 'Đang nối lại gateway cục bộ.');
        timer = setTimeout(poll, 250 * 2 ** linkRetries++);
        return;
      }
      watching = false;
      faulted = true;
      deliveryUncertain = true;
      void request('/disconnect', { ack: receipt().ack, closing: true }).catch(() => {});
      sourceLost();
      show('DEGRADED', code === 'DELIVERY_FAILED' ? 'GIFT_DELIVERY_FAILED' : 'LOCAL_LINK_LOST',
        code === 'DELIVERY_FAILED' ? reasons.GIFT_DELIVERY_FAILED :
          'Mất liên lạc với gateway. Mở lại trang nếu phiên đã hết hạn.');
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || closed || faulted) return;
    const name = username.value.trim();
    if (!/^@?[a-zA-Z0-9_.]{1,24}$/.test(name)) {
      show('OFFLINE', 'INVALID_INPUT', 'Nhập tên kênh TikTok hợp lệ.');
      return;
    }
    busy = true;
    show('CONNECTING');
    try {
      await request('/connect', { username: name });
      if (!watching) {
        watching = true;
        void poll();
      }
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      busy = false;
      show('ERROR', code, code === 'HTTP_409' ? 'Gateway đang có phiên khác hoặc đang giao nốt sự kiện.' :
        code === 'RATE_LIMITED' ? reasons.RATE_LIMITED :
          code === 'LOCAL_RATE_LIMITED' ? 'Gateway cục bộ đang giới hạn số lần yêu cầu. Thử lại sau một phút.' :
            'Kiểm tra gateway cục bộ tại cổng 5203.');
    } finally {
      busy = false;
    }
  });

  disconnect.addEventListener('click', async () => {
    if (busy || closed || faulted) return;
    busy = true;
    try { await request('/disconnect'); }
    catch { show('ERROR', 'LOCAL_LINK_LOST', 'Không gửi được lệnh ngắt kết nối. Viewer vẫn kiểm tra gateway.'); }
    finally { busy = false; }
  });

  const leave = () => {
    if (closed) return;
    closed = true;
    if (watching || busy) void request('/disconnect', { ack: receipt().ack, closing: true }, true).catch(() => {});
    watching = false;
    clearTimeout(timer);
    abort.abort();
    window.removeEventListener('pagehide', leave);
  };
  window.addEventListener('pagehide', leave, { once: true });
  window.addEventListener('pageshow', event => { if (event.persisted && closed) location.reload(); }, { once: true });
  return leave;
}