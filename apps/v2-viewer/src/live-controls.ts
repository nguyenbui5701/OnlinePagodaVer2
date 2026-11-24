import type { DemoEvent, SessionEvent } from '../../../packages/v2-events/src/protocol.ts';

export type LivePacket = DemoEvent | SessionEvent;
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
type Result = { status: string; reason: string; entries: { seq: number; event: LivePacket }[];
  counters: Record<typeof counterKeys[number], number>; viewerCount: number; dropped: number };
const natural = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;

export function decodeLivePoll(value: unknown, ack: number): Result {
  const data = value as Result & { version?: string };
  if (!data || data.version !== '0.2.0' || !statuses.has(data.status) ||
      typeof data.reason !== 'string' || (data.reason && !Object.hasOwn(reasons, data.reason)) ||
      !natural(data.viewerCount) || !natural(data.dropped) || !data.counters ||
      !counterKeys.every(key => natural(data.counters[key])) || !Array.isArray(data.entries) || data.entries.length > 48) {
    throw new Error('LIVE_PROTOCOL');
  }
  for (const [index, entry] of data.entries.entries()) {
    const event = entry?.event;
    if (entry?.seq !== ack + index + 1 || !event || !natural(event.roomEpoch) || !natural(event.connection) || !natural(event.atMs) ||
        !['session', 'chat', 'member', 'like', 'room', 'gift'].includes(event.type)) throw new Error('LIVE_PROTOCOL');
  }
  return data;
}

export function createLiveControls(report: Record<string, unknown>, feed: (packets: LivePacket[]) => boolean,
    sourceLost: () => void, deliveryFailed: () => boolean) {
  const client = Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, '0')).join('');
  const panel = document.createElement('section');
  panel.id = 'live-controls';
  const form = document.createElement('form');
  const username = document.createElement('input');
  username.required = true;
  username.maxLength = 25;
  username.autocomplete = 'off';
  const secret = document.createElement('input');
  secret.type = 'password';
  secret.maxLength = 64;
  secret.autocomplete = 'off';
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
  for (const [text, input] of [['Tên kênh TikTok', username], ['Mã gateway cục bộ', secret]] as const) {
    const label = document.createElement('label');
    label.append(text, ' ', input);
    form.append(label);
  }
  form.append(connect, ' ', disconnect);
  panel.append(form, status, counts);
  document.querySelector('main')!.after(panel);

  let token = '';
  let ack = 0;
  let timer: ReturnType<typeof setTimeout>;
  let watching = false;
  let faulted = false;
  let busy = false;
  let closed = false;
  let retryDelivery = false;
  const abort = new AbortController();
  async function request(path: string, data = {}, keepalive = false) {
    const response = await fetch(endpoint + path, {
      method: 'POST', credentials: 'omit', cache: 'no-store', redirect: 'error', keepalive,
      signal: keepalive ? undefined : AbortSignal.any([abort.signal, AbortSignal.timeout(3000)]),
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ client, ...data }),
    });
    if (!response.ok) throw new Error('HTTP_' + response.status);
    return response;
  }

  function show(state: string, reason = '', description = '') {
    report.liveStatus = state;
    report.liveReason = reason;
    const text = description || (Object.hasOwn(reasons, reason) ? reasons[reason] : '');
    status.textContent = state + (text ? ' · ' + text : '');
    const active = ['CONNECTING', 'RECONNECTING', 'CONNECTED_NO_EVENTS', 'EVENTS_VERIFIED'].includes(state);
    connect.disabled = busy || faulted || active;
    disconnect.disabled = busy || !active;
  }

  async function poll() {
    if (!watching || closed) return;
    try {
      if (deliveryFailed() && !retryDelivery) {
        retryDelivery = true;
        await request('/degraded');
      }
      const response = await request('/poll', { ack });
      const data = decodeLivePoll(await response.json(), ack);
      if (!feed(data.entries.map(item => item.event))) {
        await request('/degraded');
        throw new Error('DELIVERY_FAILED');
      }
      ack = data.entries.at(-1)?.seq ?? ack;
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
      // The poll cursor is ambiguous after an interrupted local session. Lease expiry closes it.
      watching = false;
      faulted = true;
      void request('/disconnect').catch(() => {});
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
    const key = secret.value.trim();
    secret.value = '';
    if (!/^@?[a-zA-Z0-9_.]{1,24}$/.test(name) || (key && !/^[a-f0-9]{64}$/.test(key)) || (!key && !token)) {
      show('OFFLINE', 'INVALID_INPUT', 'Nhập tên kênh và mã gateway hợp lệ.');
      return;
    }
    token = key || token;
    busy = true;
    show('CONNECTING');
    try {
      await request('/connect', { username: name });
      retryDelivery = false;
      if (!watching) {
        watching = true;
        void poll();
      }
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      busy = false;
      show('ERROR', code, code === 'HTTP_401' ? 'Mã gateway sai hoặc đã hết hạn.' :
        code === 'HTTP_409' ? 'Gateway đang có phiên khác hoặc đang giao nốt sự kiện.' :
        code === 'HTTP_429' ? reasons.RATE_LIMITED : 'Kiểm tra gateway cục bộ tại cổng 5203.');
    } finally {
      busy = false;
    }
  });

  disconnect.addEventListener('click', async () => {
    if (busy || closed || faulted) return;
    busy = true;
    try { await request('/disconnect'); }
    catch { sourceLost(); show('DEGRADED', 'LOCAL_LINK_LOST', 'Không gửi được lệnh ngắt kết nối.'); }
    finally { busy = false; }
  });

  const leave = () => {
    if (closed) return;
    closed = true;
    if (watching) void request('/disconnect', {}, true).catch(() => {});
    watching = false;
    clearTimeout(timer);
    abort.abort();
    window.removeEventListener('pagehide', leave);
  };
  window.addEventListener('pagehide', leave, { once: true });
  window.addEventListener('pageshow', event => { if (event.persisted && closed) location.reload(); }, { once: true });
  return leave;
}