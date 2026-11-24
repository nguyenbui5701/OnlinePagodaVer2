import { createLiveReceiver, reasons, type ReceiverStatus, type LiveEntry } from './live-receiver.ts';

export { decodeLivePoll, type LiveEntry, type LivePacket } from './live-receiver.ts';

export function updateLiveReport(report: Record<string, unknown>, state: ReceiverStatus) {
  report.liveStatus = state.status;
  report.liveReason = state.reason;
  report.liveDeliveryUncertain = state.uncertain;
  if (state.poll) {
    report.liveCounters = state.poll.counters;
    report.liveDropped = state.poll.dropped;
  }
}

export function createLiveControls(report: Record<string, unknown>, feed: (entries: LiveEntry[]) => boolean,
    sourceLost: () => void, receipt: () => { ack: number; failed: boolean }) {
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
  const dashboard = document.createElement('a');
  dashboard.href = '/dashboard/';
  dashboard.textContent = 'Mở Dashboard riêng';
  panel.append(form, status, counts, dashboard);
  document.querySelector('main')!.after(panel);

  let busy = false;
  let terminal = false;
  let current: ReceiverStatus = { status: 'OFFLINE', reason: '', uncertain: false };
  function show(state: ReceiverStatus, description?: string) {
    current = state;
    terminal ||= state.terminal === true;
    updateLiveReport(report, state);
    const text = description || (Object.hasOwn(reasons, state.reason) ? reasons[state.reason] : '');
    status.textContent = state.status + (text ? ' · ' + text : '') +
      (state.uncertain ? ' · Có gift final chưa xác minh giao nhận trong phiên gateway này.' : '');
    const active = ['CONNECTING', 'RECONNECTING', 'CONNECTED_NO_EVENTS', 'EVENTS_VERIFIED'].includes(state.status);
    connect.disabled = busy || terminal || active;
    disconnect.disabled = busy || terminal || !active;
    if (state.poll) {
      const { counters, viewerCount, dropped } = state.poll;
      counts.textContent = 'Chat ' + counters.chat + ' · Member ' + counters.member + ' · Like ' +
        counters.like + ' · Gift final ' + counters.giftFinal + ' · Gift progress ' + counters.giftProgress +
        ' · Người xem ' + viewerCount + ' · Bỏ qua ' + dropped;
    }
  }
  const receiver = createLiveReceiver({ feed, sourceLost, receipt, status: show });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || terminal) return;
    const name = username.value.trim();
    if (!/^@?[a-zA-Z0-9_.]{1,24}$/.test(name)) {
      show({ ...current, status: 'OFFLINE', reason: 'INVALID_USERNAME' });
      return;
    }
    busy = true;
    show({ ...current, status: 'CONNECTING', reason: '' });
    try { await receiver.connect(name); }
    catch (error) {
      const code = error instanceof Error ? error.message : '';
      busy = false;
      show({ ...current, status: 'ERROR', reason: code }, code === 'HTTP_409' ?
        'Gateway đang có phiên khác hoặc đang giao nốt sự kiện.' :
        code === 'LOCAL_RATE_LIMITED' ? 'Gateway cục bộ đang giới hạn yêu cầu.' :
          (Object.hasOwn(reasons, code) ? reasons[code] : 'Kiểm tra Gateway cục bộ tại cổng 5203.'));
    } finally {
      busy = false;
    }
  });

  disconnect.addEventListener('click', async () => {
    if (busy || terminal) return;
    busy = true;
    try { await receiver.disconnect(); }
    catch { show({ ...current, status: 'ERROR', reason: 'LOCAL_LINK_LOST' }, 'Không gửi được lệnh ngắt kết nối.'); }
    finally { busy = false; }
  });
  return receiver.dispose;
}